//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// HealthDashboardView renders the different elements on the health dashboard
//
define([
  // Core
  'views/base/BaseGridView',
  'views/base/BaseView',
  // Views
  'views/dashboard/AlertNotificationView',
  'views/health/DataSummaryView',
  'views/health/OverallSummaryView',
  'views/health/EsSummaryView',
  'views/health/HostMemoryView',
  'views/health/HostCpuView',
  'views/health/HostStorageChartView',
  'views/base/DataTableTemplates',
  // Managers
  'managers/NamespaceManager',
  // Components
  'components/Components',
  // Models/Collections
  'models/health/HealthModel',
  // Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/TimeUtil',
  'utils/AppUtil',
  'utils/SVG',
  'utils/FileAnalyticsEnableUtil',
  'utils/StyleDescriptor'],
function(
  // Core
  BaseGridView,
  BaseView,
  // Views
  AlertNotificationView,
  DataSummaryView,
  OverallSummaryView,
  EsSummaryView,
  HostMemoryView,
  HostCpuView,
  HostStorageChartView,
  DataTableTemplates,
  // Managers
  NamespaceManager,
  // Components
  Components,
  // Models/Collections
  HealthModel,
  // Utils
  AppConstants,
  CommonTemplates,
  TimeUtil,
  AppUtil,
  SVG,
  FileAnalyticsEnableUtil,
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

  var HealthDashboardView = BaseGridView.extend({

    // Properties
    //-----------

    // @inherited
    pageId: AppConstants.HEALTH_PAGE_ID,

    // @inherited
    defaultSubPageId: AppConstants.SUBPAGE_HEALTH,

    // The model for this view.
    healthModel: null,

    // Gridster instance
    gridster: null,

    // Events.
    events: {
      'click .storageChart' : 'handleFilterDropdownActionClick'
    },

    // @inherited
    onShowSubPage: function(subPageId, options) {
      if (!options) {
        options = {};
      }
      options.className = 'n-health-dashboard n-dashboard';

      BaseGridView.prototype.onShowSubPage.call(this, subPageId, options);

      // Update the class to apply default dashboard css to the body
      this.updateBodyStyle(AppConstants.DASHBOARD_PAGE_ID);
      // Show loader and display elements only when response is received
      this.$('.n-subpage-health').append(this.LOADING);
    },

    // @override
    // First need to fetch health page status
    updateSubPage: function() {
      this.getHealthStatus();
      let _this = this;
      // Setup polling for Health data if not setup
      if (!NamespaceManager.get('healthDataPolling')) {
        const healthDataPolling = setInterval(function() {
          _this.getHealthData();
        }, AppConstants.TASK_POLLING_INTERVAL);
        NamespaceManager.set('healthDataPolling', healthDataPolling);
      }
    },

    // @private
    // This function will render the elements according to the preferences.
    renderElements: function() {
      // Hide page loader
      this.hideLoader();

      // Render different elements on the health dashboard.
      this.renderDataSummary();
      this.renderOverallHealth();
      this.renderEsSummary();
      this.renderHostMemory();
      this.renderHostCpu();
      this.renderStorageSummary();
    },

    // Functions (Render Widgets)
    //---------------------------

    // @private
    // Render the data summary.
    renderDataSummary: function() {
      const title = AppConstants.HEADINGS[AppConstants.SHOW_DATA_SUMMARY],
            contentTempl = this.renderColumnContent(4),
            classs = 'dataSummary',
            widgetContent =
              this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 4, 1, widgetContent);

      // Add loading and no data wrapper.
      this.addLoadingWrapper(classs);
      this.addNoDataWrapper(classs);

      // Add the data summary content to the widget content.
      this.addDataSummaryContent(classs);

      // Display information about the data to help user understand context
      this.updateTitleOptions('dataSummary', 'This includes data for all \
      enabled fileservers.');
    },

    // @private
    // Render overall health summary
    renderOverallHealth: function() {
      const title = AppConstants.HEADINGS[AppConstants.SHOW_OVERALL_HEALTH],
            contentTempl = this.CUSTOMIZED_CONTENT_COLUMN,
            classs = 'n-vantage-point-summary n-vantage-point-summary-health \
              overallHealth',
            widgetContent =
              this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add loading wrapper template.
      this.addLoadingWrapper('overallHealth');
      this.addNoDataWrapper('overallHealth');

      // Add overall health content to the widget
      this.addOverallHealthContent('overallHealth');
    },

    // @private
    // Render ES Summary
    renderEsSummary: function() {
      const title = AppConstants.HEADINGS[AppConstants.SHOW_ES_SUMMARY],
            contentTempl = this.CUSTOMIZED_CONTENT_COLUMN,
            classs = 'n-vantage-point-summary n-vantage-point-summary-health \
              esSummary',
            widgetContent =
              this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      const widget =
        this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 2, widgetContent);

      // Add loading wrapper template.
      this.addLoadingWrapper('esSummary');
      this.addNoDataWrapper('esSummary');

      // Add ES summary template to the widget
      this.addEsSummaryContent('esSummary');
    },

    // @private
    // Render Host Memory
    renderHostMemory: function() {
      const title = AppConstants.HEADINGS[AppConstants.SHOW_HOST_MEMORY],
            contentTempl = this.CUSTOMIZED_CONTENT_SECTION,
            classs = 'n-vantage-point-metric hostMemory',
            widgetContent =
              this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 1, 1, widgetContent);

      // Add loading and no data wrapper.
      this.addLoadingWrapper('hostMemory');
      this.addNoDataWrapper('hostMemory');

      // Add the host memory to the widget content.
      this.addHostMemoryConent('hostMemory');
    },

    // @private
    // Render Host CPU Usage
    renderHostCpu: function() {
      const title = AppConstants.HEADINGS[AppConstants.SHOW_HOST_CPU_USAGE],
            contentTempl = this.CUSTOMIZED_CONTENT_SECTION,
            classs = 'n-vantage-point-metric hostCpuUsage',
            widgetContent =
              this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 1, 1, widgetContent);

      // Add loading and no data wrapper.
      this.addLoadingWrapper('hostCpuUsage');
      this.addNoDataWrapper('hostCpuUsage');

      // Add the host cpu to the widget content.
      this.addHostCpuContent('hostCpuUsage');
    },

    // @private
    // Render Host CPU Usage
    renderStorageSummary: function() {
      const title = AppConstants.HEADINGS[AppConstants.SHOW_STORAGE_SUMMARY],
            contentTempl = this.CUSTOMIZED_CONTENT_SECTION,
            classs = 'hostStorage',
            widgetContent =
              this.createWidgetContent(title, contentTempl, classs);

      // Create the widget
      this.createWidget(this.VANTAGE_POINT_WIDGET, 2, 1, widgetContent);

      // Add loading and no data wrapper.
      this.addLoadingWrapper(classs);
      this.addNoDataWrapper(classs);

      // Add dropdown filter to the table
      this.addTableHeaderDropdown('hostStorage', 'hostStorageUsageDropDown');

      // Add the host storage chart to the widget content.
      this.addHostStorageContent(classs);
    },

    // @override
    // Add dropdown in the widget header.
    addTableHeaderDropdown: function(customClass, dropdownClass, type,
      allOptions = false, defaultDuration = null) {
      const dropDownOptions = AppUtil.constructDropDownData(type, allOptions,
        this.options.fsId, this.pageId);

      defaultDuration = defaultDuration ||
        AppConstants.HOST_STORAGE_OPTIONS_TEXT.HOST_VOLUME_GROUP_USAGE;

      // Filter template
      const filterDropDown = Components.dropdown({
        classes   : 'action-dropdown pull-right ' + dropdownClass,
        text      : defaultDuration,
        options   : dropDownOptions,
        variants  : '-compact',
        rightAlign: true
      });

      this.$('.' + customClass + ' .vpTitleOptions').html(filterDropDown);
    },

    // Functions (Render Widget Content)
    //---------------------------

    // Get file analytics health status and update health status(color)
    // in the header
    getHealthStatus: async function() {
      this.healthModel = await FileAnalyticsEnableUtil.getHealthData();

      // Render health page widget
      this.renderElements();
    },

    // @private
    // Update healthModel at timely intervals
    getHealthData: function() {
      if (this.healthModel) {
        this.healthModel.fetch({
          success: function(data) {
            FileAnalyticsEnableUtil.updateHeaderHeart(data);
          },
          error: function(model, xhr) {
            FileAnalyticsEnableUtil.markHeartHealth();
            model.set({'error': xhr});
          }
        });
      }
    },

    // @private
    // Update the Data Summary widget content
    addDataSummaryContent: function(classs) {
      // Render the data summary
      const dataSummaryView = new DataSummaryView({
        parent : this,
        el: this.$('.' + classs + ' > .n-content'),
        classs : classs
      });

      // Append the newly initialized data summary view
      dataSummaryView.render();
    },

    // @private
    // Update the Overall Health widget content
    addOverallHealthContent: function(classs) {
      // Render the overall summary
      const overallSummaryView = new OverallSummaryView({
        parent : this,
        el: this.$('.' + classs + ' > .n-content'),
        classs : classs
      });

      // Append the newly initialized overall summary view
      overallSummaryView.render();
    },

    // @private
    // Update the Overall Health widget content
    addEsSummaryContent: function(classs) {
      // Render the es summary
      const esSummaryView = new EsSummaryView({
        parent : this,
        el: this.$('.' + classs + ' > .n-content'),
        classs : classs
      });

      // Append the newly initialized es summary view
      esSummaryView.render();
    },

    // @private
    // Update the Host memory widget content
    addHostMemoryConent: function(classs) {
      // Render the host memory
      const hostMemoryView = new HostMemoryView({
        parent : this,
        el: this.$('.' + classs + ' > .n-content'),
        classs : classs
      });

      // Append the newly initialized host memory view
      hostMemoryView.render();
    },

    // @private
    // Update the Host cpu widget content
    addHostCpuContent: function(classs) {
      // Render the host cpu
      const hostCpuView = new HostCpuView({
        parent : this,
        el: this.$('.' + classs + ' > .n-content'),
        classs : classs
      });

      // Append the newly initialized host cpu view
      hostCpuView.render();
    },

    // @private
    // Update the Host storage widget content
    addHostStorageContent: function(classs) {
      // Render the hosts storage
      const hostStorageView = new HostStorageChartView({
        parent : this,
        classs : classs
      });

      // Append the newly initialized host storage view
      const render = hostStorageView.render();
      if (render) {
        // Append the newly initialized host memory view
        this.getDOM('.' + classs + ' .n-column-content')
          .html(render.el);
      }
      this.registerSubview('hostStorageView', hostStorageView);
    },

    // Functions (Event Handlers)
    //---------------------------

    // @private
    // Handles the click on a filter in the chart widget
    handleFilterDropdownActionClick: function(e) {
      // Show loading
      this.showLoading('hostStorage');

      const elem = $(e.currentTarget);
      elem.closest('ul').find('li a.selected').removeClass('selected');
      elem.closest('li a').addClass('selected');
      const selectedEntity = elem.attr(AppConstants.NAV_ACTION);

      // Update the chart based on the filter selected
      const hostStorageView = this.subViewHelper.get('hostStorageView');
      if (hostStorageView) {
        hostStorageView.updateChartData({ 'selectedEntity' : selectedEntity });
      }
    },

    // Functions (Common)
    //---------------------------

    // Show the loading
    showLoading: function(className) {
      this.getDOM('.n-vantage-point.' + className + ' .n-loading-wrapper')
        .show();
    },

    // Clear contents of the existing widget
    // @param className - class that holds the widget
    // @param model - the object that holds the data of health dashboard
    // @param widget - the widget holder view object
    clearWidget: function(className, model, widget) {
      BaseGridView.prototype.clearWidget.call(this, className);

      // Show no data if model does not exists
      if (!model || !Object.keys(model.attributes).length) {
        this.showNoDataAvailable(className);
        return false;
      } else if (model.getError()) {
        widget.onDataError(model.getError());
        return false;
      }

      return true;
    }
  });
  // Return the dashboard view.
  return HealthDashboardView;
});
