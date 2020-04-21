//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// DashboardView renders the different elements on the dashboard
// as per the user preferences.
define([
  // Core
  'views/base/BaseGridView',
  // Views
  'views/dashboard/CapacityBarChartView',
  'views/dashboard/AlertNotificationView',
  'views/search/filesearch/TopFileTableView',
  'views/search/usersearch/TopUserTableView',
  'views/dashboard/MaliciousActivityTableView',
  'views/dashboard/FileOperationTableView',
  'views/dashboard/FileTypeChartView',
  'views/dashboard/FileSizeTableView',
  'views/dashboard/FileAgeChartView',
  // Managers
  'managers/PopupManager',
  // Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/TimeUtil',
  'utils/StyleDescriptor'],
function(
  // Core
  BaseGridView,
  // Views
  CapacityBarChartView,
  AlertNotificationView,
  TopFileTableView,
  TopUserTableView,
  MaliciousActivityTableView,
  FileOperationTableView,
  FileTypeChartView,
  FileSizeTableView,
  FileAgeChartView,
  // Managers
  PopupManager,
  // Utils
  AppConstants,
  CommonTemplates,
  TimeUtil,
  StyleDescriptor) {

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
  var tableTempl =  _.template(`<div class="<%= tableClass %>
    dashboard-tables">`);

  var DashboardView = BaseGridView.extend({

    // Properties
    //-----------

    // @inherited
    pageId: AppConstants.DASHBOARD_PAGE_ID,

    // @inherited
    defaultSubPageId: AppConstants.SUBPAGE_MAIN_DASHBOARD,

    // The model for this view.
    model: null,

    // Gridster instance
    gridster: null,

    // Default duration for Dashboard Page
    pageDefaultDurationText: AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_24_HRS,

    pageDefaultDurationVal: AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_24_HRS,

    // Default number of rows for table
    pageDefaultNumberOfTableRows: 5,

    // Events.
    events: {
      'click .tablebtnDropdownAction' : 'handleFilterDropdownActionClick',
      'click .graphbtnDropdownAction' : 'handleFilterDropdownActionClick',
      'click #viewFileDetails'        : 'onFileTypeClick',
      'click .more-records'           : 'moreRecordDetailsPopupClick'
    },

    // @inherited
    onShowSubPage: function(subPageId, options) {
      if (!options) {
        options = {};
      }
      options.className = 'n-dashboard';

      BaseGridView.prototype.onShowSubPage.call(this, subPageId, options);
    },

    // @private
    // This function will render the elements according to the preferences.
    // @param formData is the dashboard configuration data.
    renderElements: function() {
      // Render different elements on the dashboard.
      this.renderCapacityChart();
      this.renderDormantChart();
      this.renderAlertNotificationElement();
      this.renderMaliciousActivityElement();
      this.renderFileDistributionBySizeTable();
      this.renderFileDistributionByTypeChart();
      this.renderTopUsersTable();
      this.renderTopFilesTable();
      this.renderFileOperationElement();
    },

    // @private
    // Render the capacity fluctuation chart.
    renderCapacityChart: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_CAPACITY_FLUCTUATION];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;

      // Add "n-vantage-chart-only" class only when the widget just has a chart
      // (and may be a legend) and no other entity like table, other charts, etc
      let classs = 'n-vantage-point-alert-event capacity-trends \
        n-vantage-chart-only';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 4, 2, widgetContent);

      // Add loading and no data wrapper.
      this.addLoadingWrapper('capacity-trends');
      this.addNoDataWrapper('capacity-trends');

      // Add the capacity chart to the widget content.
      this.addCapacityChart();

      // Add the dropdown duration filter to the widget chart
      this.addTableHeaderDropdown('capacity-trends', 'capacityDropdown',
        'graph', true, AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_7_DAYS);
    },

    // @private
    // Add capacity fluctutation chart to the dashboard.
    addCapacityChart: function() {
      let entityType = AppConstants.SHOW_CAPACITY_FLUCTUATION;

      // Render the capacity chart
      let capacityChartView = new CapacityBarChartView({
        entityType    : entityType
      });

      this.$('.capacity-trends .n-column-content-1').html(
        capacityChartView.render().el);

      this.registerSubview('capacityChartView', capacityChartView);
    },

    // @private
    // Render the dormat data chart.
    renderDormantChart: function() {
      let title = AppConstants.HEADINGS[
        AppConstants.SHOW_FILE_DISTRIBUTION_BY_AGE];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;

      // Class "n-vantage-chart-with-table" is used when widget
      // has a chart at the top and a table at the bottom.
      let classs = 'n-vantage-point-alert-event dormantData \
        n-vantage-chart-with-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add loading wrapper template.
      this.addLoadingWrapper('dormantData');
      this.addNoDataWrapper('dormantData');

      // Add file age chart to the widget
      this.addFileAgeChart();
    },

    // @private
    // Render the file age chart.
    addFileAgeChart: function() {
      let entityType = AppConstants.SHOW_FILE_DISTRIBUTION_BY_AGE;

      // Render the file age chart
      let fileAgeChartView = new FileAgeChartView({
        entityType  : entityType
      });

      this.$('.dormantData .n-column-content-1').html(
        fileAgeChartView.render().el);
      this.registerSubview('fileAgeChartView', fileAgeChartView);
    },

    // @private
    // Render the alert notification element.s
    renderAlertNotificationElement: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_ANOMALY_ALERTS];
      let contentTempl = this.CUSTOMIZED_CONTENT_SECTION;
      let classs = 'n-vantage-point-alert-event anomaly-notification';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);
      // Create the widget
      let widget =
        this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add loading wrapper template.
      this.addLoadingWrapper('anomaly-notification');
      this.addNoDataWrapper('anomaly-notification');
      // Add anomaly template to the widget
      this.addAnomalyTemplate(widget);
    },

    // @private
    // Add the anomaly template to the widget.
    addAnomalyTemplate: function(widget) {
      let alertNotificationView = new AlertNotificationView({
        el: this.$('.anomaly-notification'),
        widget : widget,
        className : 'anomaly-notification'
      });
    },

    // @private
    // Render the malicious activity chart.
    renderMaliciousActivityElement: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_MALICIOUS_USERS];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      // Add n-vantage-table" class only when the widget just has a table
      // (and may be legends) and no other entity like chart, other tables, etc
      let classs = 'n-vantage-point-alert-event malicious-activity \
        n-vantage-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add the table in the upper section of the template
      this.$('.malicious-activity .n-column-content-1').html(tableTempl({
        tableClass: 'malicious-user-results'
      }));

      // Add the legends in the lower section of the template
      this.$('.malicious-activity .n-column-content-2').html(
        CommonTemplates.LEGEND_TEMPLATE({
          legendClass: 'malicious-user-legends'
        }));
      // Add dropdown filter to the table
      this.addTableHeaderDropdown('malicious-activity', 'maliciousDropdown',
        'table');

      // Add the table to the widget
      this.addMaliciousActivityTable();

      // Add legends below the table
      this.addTableLegend(
        StyleDescriptor.DASHBOARD_TABLES[AppConstants.SHOW_MALICIOUS_USERS],
        'malicious-user-legends', AppConstants.LEGENDS.MALICIOUS_USER_TABLE);
    },

    // @private
    // Add malicious activity table to the dashboard.
    addMaliciousActivityTable: function(duration) {
      let noOfDays = duration || this.pageDefaultDurationVal;

      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getStartTime(noOfDays, currentTime);

      // Render the table
      let maliciousTableView = new MaliciousActivityTableView({
        startTimeInMs : parseInt(startTime),
        endTimeInMs   : parseInt(currentTime),
        defaultMinRows: this.pageDefaultNumberOfTableRows
      });

      // Append the newly initialized datatable
      this.getDOM('.malicious-user-results')
        .html(maliciousTableView.render().el);

      // Start Fetch
      maliciousTableView.onStartServices();

      this.registerSubview('maliciousTableView', maliciousTableView);
    },

    // @private
    // Render the file distribution by size chart.
    renderFileDistributionBySizeTable: function() {
      let title = AppConstants.HEADINGS[
        AppConstants.SHOW_FILE_DISTRIBUTION_BY_SIZE];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      let classs = 'n-vantage-point-alert-event file-size n-vantage-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add table in the upper section of the widget
      this.$('.file-size .n-column-content-1').html(tableTempl({
        tableClass: 'file-size-results'
      }));
      // Add legends in the lower section of the widget
      this.$('.file-size .n-column-content-2').html(
        CommonTemplates.LEGEND_TEMPLATE({
          legendClass: 'file-size-legends'
        }));
      // Add the table to the widget
      this.addFileSizeTable();

      // Add legend below the table
      this.addTableLegend(
        StyleDescriptor.DASHBOARD_TABLES[
          AppConstants.SHOW_FILE_DISTRIBUTION_BY_SIZE],
        'file-size-legends', AppConstants.LEGENDS.FILE_SIZE_TABLE);
    },

    // @private
    // Add the file size table to the widget.
    addFileSizeTable: function() {
      // Render the table
      let fileSizeTableView = new FileSizeTableView({
        defaultMinRows: this.pageDefaultNumberOfTableRows
      });

      // Append the newly initialized datatable
      this.getDOM('.file-size-results').html(fileSizeTableView.render().el);

      // Start Fetch
      fileSizeTableView.onStartServices();

      this.registerSubview('fileSizeTableView', fileSizeTableView);
    },

    // @private
    // Render the file distribution by type chart.
    renderFileDistributionByTypeChart: function() {
      let title = AppConstants.HEADINGS[
        AppConstants.SHOW_FILE_DISTRIBUTION_BY_TYPE];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      // Class "n-vantage-chart-with-table" is used when widget
      // has a chart at the top and a table at the bottom.
      let classs = 'n-vantage-point-alert-event file-type \
        n-vantage-chart-with-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 4, 2, widgetContent);


      // Add loading and no data wrapper template.
      this.addLoadingWrapper('file-type');
      this.addNoDataWrapper('file-type');

      // Append the View Details link.
      this.$('.file-type .vpTitleOptions').html(
        '<a id="viewFileDetails" style="display: none;">View Details</a>');

      // Add the file type graph to the widget
      this.addFileTypeGraph();
    },

    // @private
    // Add file type graph to the dashboard.
    addFileTypeGraph: function() {
      let entityType = AppConstants.SHOW_FILE_DISTRIBUTION_BY_TYPE;
      // Render the chart
      let fileTypeChartView = new FileTypeChartView({
        entityType  : entityType
      });

      this.$('.file-type .n-column-content-1')
        .html(fileTypeChartView.render().el);
      this.registerSubview('fileTypeChartView', fileTypeChartView);
    },

    // @private
    // Render the top files table.
    renderTopFilesTable: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_TOP_ACCESSED_FILES];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      let classs = 'n-vantage-point-alert-event top-file n-vantage-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);
      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add table in the upper section of the widget
      this.$('.top-file .n-column-content-1').html(tableTempl({
        tableClass: 'top-file-results'
      }));

      // Add legend in the lower section of the widget
      this.$('.top-file .n-column-content-2').html(
        CommonTemplates.LEGEND_TEMPLATE({
          legendClass: 'top-file-legends'
        }));

      // Add dropdown filter to the table
      this.addTableHeaderDropdown('top-file', 'topFileDropDown', 'table');

      // Add table to the widget
      this.addTopFilesTable();

      // Add legend below the table
      this.addTableLegend(
        StyleDescriptor.DASHBOARD_TABLES[AppConstants.SHOW_TOP_ACCESSED_FILES],
        'top-file-legends', AppConstants.LEGENDS.TOP_FILE_TABLE);
    },

    // @private
    // Add top 5 accessed files table to the dashboard.
    addTopFilesTable: function(duration) {
      let noOfDays = duration || this.pageDefaultDurationVal;

      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getStartTime(noOfDays, currentTime);

      // Render the table
      let topFileTableView = new TopFileTableView({
        startTimeInMs : parseInt(startTime),
        endTimeInMs   : parseInt(currentTime),
        defaultMinRows: this.pageDefaultNumberOfTableRows
      });

      // Append the newly initialized datatable
      this.getDOM('.top-file-results')
        .html(topFileTableView.render().el);

      // Start Fetch
      topFileTableView.onStartServices();

      this.registerSubview('topFileTableView', topFileTableView);
    },

    // @private
    // Render the top user table.
    renderTopUsersTable: function() {
      let title = AppConstants.HEADINGS[AppConstants.SHOW_TOP_ACTIVE_USERS];
      let contentTempl = this.CUSTOMIZED_CONTENT_COLUMN;
      let classs = 'n-vantage-point-alert-event top-user n-vantage-table';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);
      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);
      // Add table in the upper section of the widget
      this.$('.top-user .n-column-content-1').html(tableTempl({
        tableClass: 'top-user-results'
      }));

      // Add legend in the lower section of the widget
      this.$('.top-user .n-column-content-2').html(
        CommonTemplates.LEGEND_TEMPLATE({
          legendClass: 'top-user-legends'
        }));

      // Add dropdown filter to the table
      this.addTableHeaderDropdown('top-user','topUserDropDown', 'table');

      // Add the table to the widget
      this.addTopUsersTable();

      // Add legend below the table
      this.addTableLegend(
        StyleDescriptor.DASHBOARD_TABLES[AppConstants.SHOW_TOP_ACTIVE_USERS],
        'top-user-legends', AppConstants.LEGENDS.TOP_USER_TABLE);
    },

    // @private
    // Add top 5 active users table to the dashboard.
    addTopUsersTable: function(duration) {
      let noOfDays = duration || this.pageDefaultDurationVal;

      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getStartTime(noOfDays, currentTime);
      // Render the table
      let topUserTableView = new TopUserTableView({
        startTimeInMs : parseInt(startTime),
        endTimeInMs   : parseInt(currentTime),
        defaultMinRows: this.pageDefaultNumberOfTableRows
      });


      // Append the newly initialized datatable
      this.getDOM('.top-user-results')
        .html(topUserTableView.render().el);

      // Start Fetch
      topUserTableView.onStartServices();

      this.registerSubview('topUserTableView', topUserTableView);
    },

    // @private
    // Render the file operation table.
    renderFileOperationElement: function() {
      let title = AppConstants.HEADINGS[
        AppConstants.ACCESS_PATTERN_FILES_OPERATIONS];
      let contentTempl = tableTempl({
        tableClass: 'file-operations-results'
      });
      let classs = 'n-vantage-point-alert-event file-operation';

      let widgetContent = this.createWidgetContent(title, contentTempl, classs);
      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 4, 2, widgetContent);
      // Add dropdown filter to the table
      this.addTableHeaderDropdown('file-operation', 'operationDropDown',
        'table');
      // Add table to the widget
      this.addFileOperationTable();
    },

    // @private
    // Add file operation table to the dashboard.
    addFileOperationTable: function(duration) {
      let noOfDays = duration || this.pageDefaultDurationVal;

      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getStartTime(noOfDays, currentTime);

      let fileOperationTableView = new FileOperationTableView({
        defaultMinRows: this.pageDefaultNumberOfTableRows,
        startTimeInMs : parseInt(startTime),
        endTimeInMs   : parseInt(currentTime),
        defaultDuration : noOfDays
      });


      // Append the newly initialized datatable
      this.getDOM('.file-operations-results')
        .html(fileOperationTableView.render().el);

      // Start Fetch
      fileOperationTableView.onStartServices();

      this.registerSubview('fileOperationTableView', fileOperationTableView);
    },

    // Functions (Event Handlers)
    //---------------------------

    // @private
    // Handle the capacity chart filter.
    handleCapacityChartFilter: function(duration, durationUnit) {
      let noOfDays = duration || this.pageDefaultDurationVal;
      // Set date as per mignight
      let currentTime = TimeUtil.getCurrentTime(false);
      let startTime = TimeUtil.getStartTime(noOfDays, currentTime,
            AppConstants.SHOW_CAPACITY_FLUCTUATION);
      let capacityChart = this.subViewHelper.get('capacityChartView');
      // Update graph data based on the selected value
      capacityChart.fetchGraphData(duration, startTime, currentTime,
        durationUnit);
    },

    // @private
    // Handles the click on a filter in the table.
    handleFilterDropdownActionClick: function(e) {
      var elem = $(e.currentTarget);
      elem.closest('ul').find('li a.selected').removeClass('selected');
      elem.closest('li a').addClass('selected');
      let numberOfDays =
        TimeUtil.setDuration(elem.attr(AppConstants.NAV_ACTION),
          this.options.fsId);

      if (elem.closest('.dropdown').hasClass('topUserDropDown')) {
        this.addTopUsersTable(numberOfDays);
      } else if (elem.closest('.dropdown').hasClass('topFileDropDown')) {
        this.addTopFilesTable(numberOfDays);
      } else if (elem.closest('.dropdown').hasClass('maliciousDropdown')) {
        this.addMaliciousActivityTable(numberOfDays);
      } else if (elem.closest('.dropdown').hasClass('operationDropDown')) {
        this.addFileOperationTable(numberOfDays);
      } else if (elem.closest('.dropdown').hasClass('capacityDropdown')) {
        // Data retention is not considered for capacity trend
        numberOfDays = elem.attr(AppConstants.NAV_ACTION);
        let durationUnit = elem.attr(AppConstants.NAV_ACTION_TARGET);
        // To format the x axis data points on the basis of duration.
        durationUnit = durationUnit.split(' ')[2];
        this.handleCapacityChartFilter(numberOfDays, durationUnit);
      }

      // Hide the deafult table header.
      this.$('.table-container .n-header').hide();
    },

    // @override
    // Opens a popup on click of a particular category bar.
    onFileTypeClick: function(e) {
      const fileTypeChartView = this.subViewHelper.get('fileTypeChartView');
      let options = {};
      options.title = AppConstants.POPUP.FILE_TYPE;
      options.action = AppConstants.ENTITY_FILE_TYPE;
      options.actionTarget = AppConstants.ENTITY_FILE_TYPE;
      options.fsId = this.options.fsId;
      options.fileTypeModel = fileTypeChartView.model;
      PopupManager.handleAction(options);
    },

    // Opens popup on click of "More" to show more records.
    moreRecordDetailsPopupClick : function(e) {
      let options = {};

      let elem = $(e.currentTarget);
      if (elem.attr('action-target') === 'topFileResultsPopupLink') {
        options.actionTarget = AppConstants.ENTITY_ACCESSED_FILES;
      } else if (elem.attr('action-target') ===
        'maliciousUserResultsPopupLink') {
        options.actionTarget = AppConstants.ENTITY_PERMISSION_DENIALS;
      } else if (elem.attr('action-target') === 'topUserResultsPopupLink') {
        options.actionTarget = AppConstants.ENTITY_ACTIVE_USER;
      }

      // Pass the current state of dashboard widget dropdown to
      // its corresponding popup dropdown
      let filterText = $(elem.closest('.n-vantage-point')
        .find('.dropdown ul li a.selected'));
      options.filterText = filterText.attr('actiontarget') ||
        this.pageDefaultDurationText;

      let filterVal =
        (_.invert(AppConstants.ALL_DURATION_OPTIONS_TEXT))[options.filterText];

      options.duration = AppConstants.ALL_DURATION_OPTIONS_VALUE[filterVal];

      PopupManager.handleAction(options);
    }
  });
  // Return the dashboard view.
  return DashboardView;
});
