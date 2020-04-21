//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AlertDashboardView enables the user to view the anomaly
// information in the widgets
define([
  // Core
  'views/base/BaseGridView',
  // Views
  'views/anomalyscreen/TopViolatingUsersTableView',
  'views/anomalyscreen/TopContributingFoldersTableView',
  'views/anomalyscreen/AlertTypeOverTimeChartView',
  'views/anomalyscreen/AlertTypesChartView',
  // Models
  'models/anamoly/AnomalyModel',
  'models/alertdashboard/AlertDashboardModel',
  // Managers
  'managers/PopupManager',
  'managers/NamespaceManager',
  // Utils
  'utils/AppConstants',
  'utils/TimeUtil',
  'utils/CommonTemplates',
  'utils/StyleDescriptor',
  // Templates
  'text!templates/anomalyPolicy/AlertConfigure.html'],
function(
  // Core
  BaseGridView,
  // Views
  TopViolatingUsersTableView,
  TopContributingFoldersTableView,
  AlertTypeOverTimeChartView,
  AlertTypesChartView,
  // Models
  AnomalyModel,
  AlertDashboardModel,
  // Managers
  PopupManager,
  NamespaceManager,
  // Utils
  AppConstants,
  TimeUtil,
  CommonTemplates,
  StyleDescriptor,
  // Template
  AlertConfigureView) {
  'use strict';

  //-------------------------------------------------------------------------
  // GRIDSTER EXTENSIONS
  //-------------------------------------------------------------------------
  // Custom functions
  var extensions = {

    // Updates the widget block width and height, including margins.
    resize_widget_dimensions: function(options) {
      if (options.widget_margins) {
        this.options.widget_margins = options.widget_margins;
      }

      if (options.widget_base_dimensions) {
        this.options.widget_base_dimensions = options.widget_base_dimensions;
      }

      this.$widgets.each($.proxy(function(i, widget) {
        var $widget = $(widget);
        this.resize_widget($widget);
      }, this));

      this.$widgets.sort(function(a, b) {
        var $a = $(a);
        var $b = $(b);
        var aRow = parseInt($a.attr('data-row'), 10);
        var bRow = parseInt($b.attr('data-row'), 10);
        var aCol = parseInt($a.attr('data-col'), 10);
        var bCol = parseInt($b.attr('data-col'), 10);
        if (aRow > bRow || (aRow === bRow && aCol < bCol)) {
          return 1;
        }
        return -1;
      });

      // We generate a new stylesheet
      this.generate_grid_and_stylesheet();
      this.get_widgets_from_DOM();
      this.set_dom_grid_height();

      return false;
    },

    // @inherited
    // Injects the given CSS as string to the head of the document.
    add_style_tag: function(css) {
      var d = document;
      var tag = d.createElement('style');

      d.getElementsByTagName('head')[0].appendChild(tag);
      tag.setAttribute('type', 'text/css');

      // Add an attribute to gridster style so we can remove it when grid
      // is resized.
      tag.setAttribute('generated-from', 'gridster');

      // Remove the previous gridster stylesheet(s)
      // NOTE: Gridster dynamically adds stylesheet in the head document.
      $('head [generated-from="gridster"]:not(:last)').remove();

      if (tag.styleSheet) {
        tag.styleSheet.cssText = css;
      }else{
        tag.appendChild(document.createTextNode(css));
      }
      return this;
    },

    // @inherited
    // It generates the necessary styles to position the widgets. We had to
    // override this function so we don't use the duplication logic here
    // since duplicate stylesheets are already removed.
    generate_stylesheet: function(opts) {
      var styles = '';
      var max_size_x = opts.max_size_x || this.options.max_size_x;
      // var max_rows = 0;
      // var max_cols = 0;
      var i;

      opts = opts || {};
      opts.cols = opts.cols || this.options.cols  ||this.cols;
      opts.rows = opts.rows || this.options.rows || this.rows;
      if (typeof this.options !== 'undefined') {
        opts.namespace = this.options.namespace;
        opts.widget_base_dimensions = this.options.widget_base_dimensions;
      }
      opts.widget_margins = opts.widget_margins ||
          this.options.widget_margins;
      opts.min_widget_width = (opts.widget_margins[0] * 2) +
        opts.widget_base_dimensions[0];
      opts.min_widget_height = (opts.widget_margins[1] * 2) +
        opts.widget_base_dimensions[1];

      // NOTE: Don't use the duplication logic here
      // don't duplicate stylesheets for the same configuration
      //var serialized_opts = $.param(opts);
      //if ($.inArray(serialized_opts,Gridster.generated_stylesheets) >= 0) {
      //    return false;
      //}
      //Gridster.generated_stylesheets.push(serialized_opts);

      // generate CSS styles for cols
      for (i = opts.cols; i >= 0; i--) {
        styles += (opts.namespace + ' [data-col="'+ (i + 1) + '"] { left:' +
            ((i * opts.widget_base_dimensions[0]) +
            (i * opts.widget_margins[0]) +
            ((i + 1) * opts.widget_margins[0])) + 'px;} ');
      }

      // generate CSS styles for rows
      for (i = opts.rows; i >= 0; i--) {
        styles += (opts.namespace + ' [data-row="' + (i + 1) + '"] { top:' +
            ((i * opts.widget_base_dimensions[1]) +
            (i * opts.widget_margins[1]) +
            ((i + 1) * opts.widget_margins[1]) ) + 'px;} ');
      }

      for (var y = 1; y <= opts.rows; y++) {
        styles += (opts.namespace + ' [data-sizey="' + y + '"] { height:' +
            (y * opts.widget_base_dimensions[1] +
            (y - 1) * (opts.widget_margins[1] * 2)) + 'px;}');
      }

      for (var x = 1; x <= max_size_x; x++) {
        styles += (opts.namespace + ' [data-sizex="' + x + '"] { width:' +
            (x * opts.widget_base_dimensions[0] +
            (x - 1) * (opts.widget_margins[0] * 2)) + 'px;}');
      }

      return this.add_style_tag(styles);
    },

    // Utility method to return all the widgets present on a page.
    get_all_widgets : function() {
      return this.$widgets;
    },

    // Proper clean up for gridster. Unfortunately Gridster doesn't have a
    // a public API to clean up the grids.
    destroyGridster: function() {
      if (this.drag_api) {
        this.drag_api.destroy();
        this.$el.removeData('drag');
      }
      this.$el.removeData('gridster');
      this.$el.empty();
    },

    // @override
    // Adding vantagePoint id in the widget.
    add_widget : function(html, size_x, size_y, col, row, id) {
        var pos;
        size_x = size_x ||  1;
        size_y = size_y || 1;

        if (!col & !row) {
          pos = this.next_position(size_x, size_y);
        }else{
          pos = {
            col: col,
            row: row
          };

          this.empty_cells(col, row, size_x, size_y);
        }

        var $w = $(html).attr({
          'data-col': pos.col,
          'data-row': pos.row,
          'data-sizex' : size_x,
          'data-sizey' : size_y,
          'data-id'    : id
        }).addClass('gs_w').appendTo(this.$el).hide();

        this.$widgets = this.$widgets.add($w);

        this.register_widget($w);

        this.add_faux_rows(pos.size_y);
        //this.add_faux_cols(pos.size_x);

        this.set_dom_grid_height();

        return $w.fadeIn();
       },

    // @inherited
    // This is to fix the overlapping bug.
    // Check issue https://github.com/ducksboard/gridster.js/issues/4
    // for more details.
    move_widget_down: function($widget, y_units) {
      if (y_units <= 0) { return false; }
      var el_grid_data = $widget.coords().grid;
      var actual_row = el_grid_data.row;
      var moved = [];
      var y_diff = y_units;

      if (!$widget) { return false; }

      if ($.inArray($widget, moved) === -1) {

        var widget_grid_data = $widget.coords().grid;
        var next_row = actual_row + y_units;
        var $next_widgets = this.widgets_below($widget);

        this.remove_from_gridmap(widget_grid_data);

        $next_widgets.each($.proxy(function(i, widget) {
          var $w = $(widget);
          var wd = $w.coords().grid;
          var tmp_y = this.displacement_diff(
            wd, widget_grid_data, y_diff);

          if (tmp_y > 0) {
            this.move_widget_down($w, tmp_y);
          }
        }, this));

        widget_grid_data.row = next_row;
        this.update_widget_position(widget_grid_data, $widget);
        $widget.attr('data-row', widget_grid_data.row);
        this.$changed = this.$changed.add($widget);

        moved.push($widget);
      }
    }
  };

  // Add the new function(s) to the gridster core library
  $.extend($.Gridster, extensions);

  // Template for the tables.
  var tableTempl = _.template(`<div class='<%= tableClass %>
    dashboard-tables n-base-data-table'>`);

  // Template for the graphs.
  var graphTempl = _.template(`<div class='<%= graphClass %>'><div>`);

  var navTempl = _.template('<div class="n-page-action-group  pull-right"> \
    <a class="btnPageAction defineRule"> \
    <span><%= navText %></span>\
    </a></div>');


  // Empty page template.
  let alertConfigureView = _.template(AlertConfigureView);

  var AlertDashboardView = BaseGridView.extend({

    // Properties
    //-----------

    // @inherited
    pageId: AppConstants.ANOMALY_PAGE_ID,

    // @inherited
    defaultSubPageId: AppConstants.SUBPAGE_ANOMALY,

    // The model for this view.
    model: null,

    // Configurations
    configurationModel: null,

    // Anomaly Types
    anomalyTypesModel: null,

    // The subviewHelper for this view.
    subViewHelper: null,

    // Gridster instance
    gridster: null,

    // Default duration for Alert Page
    pageDefaultDurationText:
      AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_30_DAYS,

    pageDefaultDurationVal:
      AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS,

    // Default number of rows for table
    pageDefaultNumberOfTableRows: 5,

    // Events.
    events: {
      'click .tablebtnDropdownAction' : 'handleFilterDropdownActionClick',
      'click .defineRule' : 'onPolicyClick',
      'click .more-records' : 'moreRecordDetailsPopupClick'
    },

    // Private page loader since global loader is hidden when fileserver
    // validation is completed giving the user empty page until configuration
    // api response is received.
    LOADING: `<div class="n-loading app-view-loader anomaly-loader">
                  <div class="donut-loader-blue-large"></div>
                    Loading...
                  </div>
                </div>`,

    // Functions (Event Handlers)
    //---------------------------

    // @inherited
    onShowSubPage: function(subPageId, options) {
      if (!options) {
        options = {};
      }
      options.className = 'n-alert-dashboard';

      BaseGridView.prototype.onShowSubPage.call(this, subPageId, options);

      // Check if analytics is enable for the selected file server, hide if
      // not enabled
      if (NamespaceManager.get('analytics_enabled_' + this.options.fsId) ||
        NamespaceManager.get('fileserver_active_' + this.options.fsId)) {
        this.$('.n-page-nav').show().append(navTempl({
          navText: '+ ' + AppConstants.POPUP.POLICY
        }));
      }

      // Show loader and display elements only when response is received
      this.$('.n-subpage-anomaly').append(this.LOADING);
    },

    // @inherited
    renderElements: function() {
      // Initialize Configurations Model
      this.configurationModel = new AnomalyModel();
      // Initialize Anomaly types Model
      this.anomalyTypesModel = new AlertDashboardModel();
      // Get configurations
      this.getConfigurations();
    },

    // @private
    // Render all the events
    renderWidgets: function() {
      // Hide Anomaly page explicit Loader
      this.hideLoader();
      if (this.configurationModel.exists) {
        // Render the alert trend widget.
        this.renderAnomalyTrend();
        // Render the top violating users widget.
        this.renderUserViolatingPolicy();
        // Render the top contributing folders widget.
        this.renderTopContributingFolders();
        // Render anomaly types widget.
        this.renderAnomalytypes();
      } else {
        // Render an empty page with configure event action.
        this.renderEmptyPage();
      }
    },

    // @private
    // Render the top violating user widget.
    renderUserViolatingPolicy: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_TOP_VIOLATING_USERS];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      let classs = 'n-vantage-point-alert-event topViolatingUsers \
        n-vantage-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add table in the upper section of the widget
      this.$('.topViolatingUsers .n-column-content-1').html(tableTempl({
        tableClass: 'topViolatingUserResults'
      }));

      // Add the legends in the lower section of the template
      this.$('.topViolatingUsers .n-column-content-2').html(
        CommonTemplates.LEGEND_TEMPLATE({
          legendClass: 'violating-user-legends'
        }));

      // Add dropdown filter to the table
      this.addTableHeaderDropdown('topViolatingUsers', 'usersDropdown',
        'table');

      // Add tooltip
      const text = 'Displays the users with the most anomalies and the \
        number of anomalies per user.';
      this.updateTitleOptions('topViolatingUsers', text);

      // Add legends below the table
      this.addTableLegend(
        StyleDescriptor.DASHBOARD_TABLES[AppConstants.SHOW_TOP_VIOLATING_USERS],
        'violating-user-legends', AppConstants.LEGENDS.VIOLATING_USER_TABLE);

      // Add the top user table.
      this.addViolatingUserTable();
    },

    // @private
    // Add the top user table.
    // @param duration - duration selected from the dropdown.
    addViolatingUserTable: function(duration) {
      // Consider the default duration as 30 days.
      let noOfDays = duration || this.pageDefaultDurationVal;

      // Calculate the start and end time accordingly.
      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getRoundedStartTime(noOfDays, currentTime);

      // Render the table
      let topViolatingUsersTableView = new TopViolatingUsersTableView({
        startTimeInMs : parseInt(startTime, 10),
        endTimeInMs   : parseInt(currentTime, 10),
        defaultMinRows: this.pageDefaultNumberOfTableRows
      });

      // Append the newly initialized datatable
      this.getDOM('.topViolatingUserResults')
        .html(topViolatingUsersTableView.render().el);

      // Start Fetch
      topViolatingUsersTableView.onStartServices();

      // Register view with subview helper.
      this.registerSubview('topViolatingUsersTableView',
        topViolatingUsersTableView);
    },

    // @private
    // Render the top folder widget.
    renderTopContributingFolders: function() {
      let title = AppConstants.HEADINGS[
        AppConstants.SHOW_TOP_CONTRIBUTING_FOLDERS];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      // Add n-vantage-table" class only when the widget just has a table
      // (and may be legends) and no other entity like chart, other tables, etc
      let classs = 'n-vantage-point-alert-event topContributingFolders \
        n-vantage-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add table in the upper section of the widget
      this.$('.topContributingFolders .n-column-content-1').html(tableTempl({
        tableClass: 'topContributingFoldersResults'
      }));

      // Add the legends in the lower section of the template
      this.$('.topContributingFolders .n-column-content-2').html(
        CommonTemplates.LEGEND_TEMPLATE({
          legendClass: 'contributing-folder-legends'
        }));

      // Add dropdown filter to the table
      this.addTableHeaderDropdown('topContributingFolders', 'folderDropdown',
        'table');

      // Add tooltip
      const text = 'Displays the folders with the most anomalies and the \
        number of anomalies per folder.';
      this.updateTitleOptions('topContributingFolders', text);

      // Add legends below the table
      this.addTableLegend(StyleDescriptor.DASHBOARD_TABLES[
        AppConstants.SHOW_TOP_CONTRIBUTING_FOLDERS],
      'contributing-folder-legends',
      AppConstants.LEGENDS.CONTRIBUTING_FOLDER_TABLE);

      // Render the top folder table.
      this.addTopContributingFoldersTable();
    },

    // @private
    // Render the top folder table.
    // @param duration - duration selected from the dropdown.
    addTopContributingFoldersTable: function(duration) {
      // Consider the default duration as 30 days.
      let noOfDays = duration || this.pageDefaultDurationVal;

      // Calculate the start and end time accordingly.
      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getRoundedStartTime(noOfDays, currentTime);

      // Render the table
      let topContributingFoldersTableView =
        new TopContributingFoldersTableView({
          startTimeInMs : parseInt(startTime, 10),
          endTimeInMs   : parseInt(currentTime, 10),
          defaultMinRows: this.pageDefaultNumberOfTableRows
        });

      // Append the newly initialized datatable
      this.getDOM('.topContributingFoldersResults')
        .html(topContributingFoldersTableView.render().el);

      // Start Fetch
      topContributingFoldersTableView.onStartServices();

      // Register view with subview helper.
      this.registerSubview('topContributingFoldersTableView',
        topContributingFoldersTableView);
    },

    // @private
    // Render the anomaly types widget.
    renderAnomalytypes: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_ALERT_TYPE];
      let contentTempl = this.CUSTOMIZED_VERTICAL_SECTION;
      let classs = 'n-vantage-point-alert-event anomalyTypes';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 4, 2, widgetContent);

      // Add dropdown filter to the table
      this.addTableHeaderDropdown('anomalyTypes', 'anomalyDropdown',
        'table');

      // Add tooltip
      const text = 'Displays the percentage of occurrences per anomaly type.';
      this.updateTitleOptions('anomalyTypes', text);

      // Add loading wrapper
      this.addLoadingWrapper('anomalyTypes');
      this.addNoDataWrapper('anomalyTypes');

      // Render the anomaly types donut chart.
      this.addAnomalyTypeChart();
    },

    // @private
    // Render method if no configuration found
    renderEmptyPage: function() {
      $('.n-subpage-anomaly').html(alertConfigureView({
        // Load image from assets
        image: 'app/assets/images/sample_anomaly_screen.png',
        imageText: 'Default Anomaly Dashboard'
      }));

      // Disable button if file analytics is disabled
      if (!NamespaceManager.get('analytics_enabled_' + this.options.fsId) ||
        !NamespaceManager.get('fileserver_active_' + this.options.fsId)) {
        this.disableConfigureAlertBtn();
      }
    },

    // @private
    // Render the anomaly type chart.
    // @param duration - duration selected from the dropdown.
    addAnomalyTypeChart: function(duration) {
      let entityType = AppConstants.SHOW_ALERT_TYPE;
      let noOfDays = duration || this.pageDefaultDurationVal;
      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getRoundedStartTime(noOfDays, currentTime);

      // Render the alert type chart
      let alertTypesChartView = new AlertTypesChartView({
        entityType    : entityType,
        startTimeInMs : parseInt(startTime, 10),
        endTimeInMs   : parseInt(currentTime, 10)
      });

      // Add the graph in the upper section of the template
      this.$('.anomalyTypes .n-vertical-content-1').html(
        alertTypesChartView.render().el);

      this.registerSubview('alertTypesChartView', alertTypesChartView);
    },

    // @private
    // Handle the alert chart filter.
    handleAnomalyTypeChartFilter: function(duration) {
      const noOfDays = duration || this.pageDefaultDurationVal;
      // Set date as per mignight
      const currentTime = TimeUtil.getCurrentTime();
      const startTime = TimeUtil.getRoundedStartTime(noOfDays, currentTime);
      const alertTypeChart = this.subViewHelper.get('alertTypesChartView');
      // Update graph data based on the selected value
      alertTypeChart.fetchGraphData(duration, startTime, currentTime);
    },

    // @private
    // Render the anomaly trend widget.
    renderAnomalyTrend: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_ALERT_OVER_TIME];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      // Add "n-vantage-chart-only" class only when the widget just has a chart
      // (and may be a legend)
      // and no other entity like table, other charts, etc.
      let classs = 'n-vantage-point-alert-event alertOverTime \
        n-vantage-chart-only';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 8, 2, widgetContent);

      // Add dropdown filter to the table
      this.addTableHeaderDropdown('alertOverTime', 'alertOverTimeDropdown',
        'table');

      // Add tooltip
      const text = 'Displays the number of anomalies per day or per month.';
      this.updateTitleOptions('alertOverTime', text);

      // Add loading and no data wrapper.
      this.addLoadingWrapper('alertOverTime');
      this.addNoDataWrapper('alertOverTime');

      // Render the anomaly trend chart.
      this.addAnomalyTrendChart();
    },

    // @private
    // Render the anomaly trend chart.
    addAnomalyTrendChart: function() {
      let entityType = AppConstants.SHOW_ALERT_OVER_TIME;

      // Render the time series chart
      let alertOverTimeChartView = new AlertTypeOverTimeChartView({
        entityType  : entityType
      });

      // Add the graph in the upper section of the template
      this.$('.alertOverTime .n-column-content-1')
        .append(alertOverTimeChartView.render().el);

      // Register view with the subview helper.
      this.registerSubview('alertOverTimeChartView', alertOverTimeChartView);
    },

    // @private
    // Handle the time series chart filter.
    // @param duration - duration selected from the dropdown.
    handleTimeSeriesFilter: function(duration) {
      // Consider default duration as 30 days.
      const noOfDays = duration || this.pageDefaultDurationVal;
      const currentTime = TimeUtil.getCurrentTime();
      const startTime = TimeUtil.getRoundedStartTime(noOfDays, currentTime,
        AppConstants.SHOW_ALERT_OVER_TIME);

      const alertOverTimeChart =
        this.subViewHelper.get('alertOverTimeChartView');
      // Update graph data based on the selected value
      alertOverTimeChart.fetchGraphData(duration, startTime, currentTime);
    },

    // @private
    // Handles the click on a filter in the table.
    handleFilterDropdownActionClick: function(e) {
      let elem = $(e.currentTarget);
      elem.closest('ul').find('li a.selected').removeClass('selected');
      elem.closest('li a').addClass('selected');

      let numberOfDays =
        TimeUtil.setDuration(elem.attr(AppConstants.NAV_ACTION),
          this.options.fsId);

      if (elem.closest('.dropdown').hasClass('folderDropdown')) {
        this.addTopContributingFoldersTable(numberOfDays);
      } else if (elem.closest('.dropdown').hasClass('usersDropdown')) {
        this.addViolatingUserTable(numberOfDays);
      } else if (elem.closest('.dropdown').hasClass('alertOverTimeDropdown')) {
        this.handleTimeSeriesFilter(elem.attr(AppConstants.NAV_ACTION));
      } else if (elem.closest('.dropdown').hasClass('anomalyDropdown')) {
        this.handleAnomalyTypeChartFilter(numberOfDays);
      }
    },

    // @private
    // Opens a popup for anomaly configuration.
    onPolicyClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.POLICY;
      options.action = AppConstants.ENTITY_ANOMALY_POLICY;
      options.actionTarget = AppConstants.ENTITY_ANOMALY_POLICY;
      options.fsId = this.options.fsId;
      PopupManager.handleAction(options);
    },

    // @private
    // Get Existing Configurations
    getConfigurations: function() {
      let _this = this;
      this.configurationModel.getURL();
      this.configurationModel.exists = false;
      this.configurationModel.fetch({
        success: function(data) {
          if (data.attributes &&
            Object.keys(data.attributes.configurations).length) {
            // If configurations exists
            _this.configurationModel.exists = true;
            _this.renderWidgets();
          } else {
            // Check if anomaly types exist
            _this.getAnomalyTypes();
          }

        },
        error: function(model, xhr) {
          _this.renderWidgets();
        }
      });
    },

    // Disable configure Alert button
    disableConfigureAlertBtn() {
      $('.titleConfigure').attr('title', 'Need to enable File Analytics')
        .addClass('disable');
      $('.titleConfigure > button').attr('disabled', true);

      // Remove define anomaly button
      $('.n-page-nav').empty();
    },

    // Enable configure Alert button
    enableConfigureAlertBtn() {
      $('.titleConfigure').removeClass('disable').removeAttr('title');
      $('.titleConfigure > button').removeAttr('disabled');

      // Append define anomaly button
      $('.n-page-nav').show().append(navTempl({
        navText: '+ ' + AppConstants.POPUP.POLICY
      }));
    },

    // Hide Page loader
    hideLoader: function() {
      $('.anomaly-loader').hide();
    },

    // Get Anomaly types to show data on dashboard if previous data exists,
    // irrespective of any active anomaly rules defined.
    getAnomalyTypes: function() {
      // Set start time to maximum time frame, 1 year currently
      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getRoundedStartTime('12', currentTime);
      let _this = this;
      this.anomalyTypesModel.getURL(
        AppConstants.ANOMALY_DETAIL_TYPES.ALERT_TYPES,
        startTime, currentTime);
      this.anomalyTypesModel.fetch({
        success: function(data) {
          if (data.attributes &&
            Object.keys(data.attributes).length) {
            let anomalyTypes = data.attributes,
                totalValue = 0;
            _.each(anomalyTypes, function(elem) {
              totalValue += elem.doc_count;
            });

            // If anomaly count exists
            if (totalValue) {
              _this.configurationModel.exists = true;
            }
          }
          _this.renderWidgets();

        },
        error: function(model, xhr) {
          _this.renderWidgets();
        }
      });
    },

    // Opens popup on click of "More" to show more records.
    moreRecordDetailsPopupClick : function(e) {
      let options = {};
      let elem = $(e.currentTarget);
      if (elem.attr('action-target') === 'topViolatingUserResultsPopupLink') {
        options.actionTarget = AppConstants.ENTITY_ANOMALY_USER;
      } else if (elem.attr('action-target') ===
        'topContributingFoldersResultsPopupLink') {
        options.actionTarget = AppConstants.ENTITY_ANOMALY_FOLDER;
      }

      // Pass the current state of dashboard widget dropdown to
      // its corresponding popup dropdown
      let filterText = $(elem.closest('.n-vantage-point')
        .find('.dropdown ul li a.selected'));
      options.filterText = filterText.attr('actiontarget') ||
        AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_30_DAYS;

      let filterVal =
        (_.invert(AppConstants.ALL_DURATION_OPTIONS_TEXT))[options.filterText];

      options.duration = AppConstants.ALL_DURATION_OPTIONS_VALUE[filterVal];

      PopupManager.handleAction(options);
    }
  });
  // Returns the AlertDashboardView class object.
  return AlertDashboardView;
});
