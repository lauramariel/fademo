//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileTypePopupView enables a user to view the file type details.
//
define([
  // Core classes
  'views/base/BasePopupView',
  'views/filetype/FileTypeOverTimeChartView',
  'views/filetype/FileTypeTableView',
  // Utils
  'utils/AppConstants',
  'utils/SubViewHelper',
  'utils/TimeUtil'],
function(
  // Core classes
  BasePopupView,
  FileTypeOverTimeChartView,
  FileTypeTableView,
  // Utils
  AppConstants,
  SubViewHelper,
  TimeUtil) {
  'use strict';

  // Page template
  var viewTemplate = '<div class="graphWrapper"></div>' +
    '<div data-ntnx-section="type-separator" ></div>' +
    '<div class="tableWrapper file-type-table ' +
    'n-base-data-table"></div>';

  return BasePopupView.extend({
    name: 'FileTypePopupView',

    el: '#fileTypePopupView',

    // The subviewHelper for this view.
    subViewHelper: null,

    events: {
      'click .modal-header .close:not(.disabled)' : 'hide',
      'click [data-dismiss="alert"]'              : 'clearHeader',
      'click .btnCancel'                          : 'hide',
      'click .graphbtnDropdownAction' : 'handleFilterDropdownActionClick'
    },

    initialize: function(options) {
      // Initialize the subviewhelper.
      this.subViewHelper = new SubViewHelper();
      BasePopupView.prototype.initialize.call(this);
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      this.$el.html(this.defaultTemplate({
        title        : this.options.actionRoute.title,
        bodyContent  : viewTemplate,
        footerButtons: ''
      }));

      this.model = this.actionRoute.fileTypeModel;
      this.renderFileTypeData(this.model);
    },

    // @private
    // Renders the data in the graph as well as the table.
    // @param startTimeInMs - start time in ms.
    // @param endTimeinMs - end time in ms.
    // @param data - data to be rendered in the table.
    renderFileTypeData: function(data) {
      let endTime = new Date().getTime(),
          startTime = TimeUtil.getStartTime(
            AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS, endTime);

      // Plot the file type graph.
      this.plotGraph(startTime, endTime);
      // Draw the file type table.
      this.addFileTypeTable(data, startTime, endTime,
        AppConstants.STATS_PER_MONTH,
        AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_30_DAYS);
    },

    // @override
    // Renders the file type graph.
    // @param startTimeInMs - the start time in milliseconds.
    // @param endTimeInMs - the end time in milliseconds.
    plotGraph: function(startTimeInMs, endTimeInMs) {
      let fileTypeOverTimeChartView = new FileTypeOverTimeChartView({
        entityType: AppConstants.SHOW_FILE_TYPE_OVER_TIME,
        chartId: 'file-type-time-chart',
        chartClass: 'file-type-time-chart',
        startTimeInMs: startTimeInMs,
        endTimeInMs: endTimeInMs,
        model: this.model
      });

      this.$('.graphWrapper').html(
        fileTypeOverTimeChartView.render().el);

      // Append the legend wrapper.
      this.$('.graphWrapper').append('<div class="legend-wrap"></div>');

      // Register view with the subview helper.
      this.registerSubview('fileTypeOverTimeChartView',
        fileTypeOverTimeChartView);
    },

    // @private
    // Adds the file type table to the popup.
    // @param model - the data to be passed to the table.
    // @param startTime - the start time of the duration.
    // @param endTime - the end time of the duration.
    addFileTypeTable: function(model, startTime, currentTime, interval,
      duration) {
      let fileTypeTableView = new FileTypeTableView({
        startTimeInMs: parseInt(startTime, 10),
        endTimeInMs: parseInt(currentTime, 10),
        interval: interval,
        bProcessing: false,
        model: model,
        parent: this,
        duration: duration
      });

      // Append the newly initialized datatable
      this.getDOM('.tableWrapper').html(fileTypeTableView.render().el);

      // Start Fetch
      fileTypeTableView.onStartServices();
    },

    // @private
    // Returns the interval.
    getInterval: function(filterDuration) {
      let statsFor = '';

      if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_7_DAYS) {
        statsFor = AppConstants.STATS_PER_DAY;
      } else if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS) {
        statsFor = AppConstants.STATS_PER_WEEK;
      } else {
        statsFor = AppConstants.STATS_PER_MONTH;
      }

      return statsFor;
    },

    // @private
    // Handles the click on a filter above the graph.
    handleFilterDropdownActionClick: function(e) {
      let elem = $(e.currentTarget),
          dropDownText = elem.attr(AppConstants.NAV_ACTION_TARGET),
          interval = this.getInterval(elem.attr(AppConstants.NAV_ACTION));

      let numberOfDays =
        TimeUtil.setDuration(elem.attr(AppConstants.NAV_ACTION),
          this.options.fsId);

      if (elem.closest('.dropdown').hasClass('fileTrendDropdown')) {
        let noOfDays = numberOfDays ||
          AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS;

        let endTime = new Date().getTime(),
            startTime = TimeUtil.getStartTime(noOfDays, endTime);

        this.addFileTypeTable(this.model, startTime, endTime, interval,
          dropDownText);
      }
    },

    // @private
    // Shows modal alert.
    // @param type is the type of the error message.
    // @param message is the error message to be shown.
    showAlert: function(type, message) {
      this.triggerAction(AppConstants.MODAL.ACT.ALERT_SHOW, {
        type: type,
        message: message
      });
    },

    // Registers the subview if it  doesn't exist already.
    // @param pageId is the Id of view to register.
    // @param pageClass is the class of the view to register.
    registerSubview: function(pageId, pageClass) {
      if (this.subViewHelper.get(pageId)) {
        this.subViewHelper.remove(pageId);
      }
      this.subViewHelper.register(pageId, pageClass);
    }

  });
});
