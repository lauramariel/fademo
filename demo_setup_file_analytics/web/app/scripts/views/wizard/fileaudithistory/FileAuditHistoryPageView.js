//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// The FileAuditHistoryPageView enables the user to view the file audit history
// page.
define([
  // Views/Models
  'views/wizard/BaseAuditHistoryWizardView',
  'views/fileaudithistory/FileAuditHistoryTableView',
  'views/fileaudithistory/FileAuditHistoryChartView',
  // Utils
  'utils/AppConstants'],
function(
  // Views/Models
  BaseAuditHistoryWizardView,
  FileAuditHistoryTableView,
  FileAuditHistoryChartView,
  // References of util
  AppConstants) {

  'use strict';

  // Extending the BaseAuditHistoryWizardView
  return BaseAuditHistoryWizardView.extend({

    name: 'FileAuditHistoryPageView',

    fileAuditHistoryTableView: false,

    // @override
    // Add the operation filter checkboxes.
    addFilterCheckboxes: function() {
      BaseAuditHistoryWizardView.prototype.addFilterCheckboxes.call(this,
        this.getAuditOperations());
    },

    // private
    // Get file audit operations based on file/folder search
    getAuditOperations: function() {
      let operationSet;
      if (this.options.actionTargetType ===
        AppConstants.FILE_SEARCH_TYPE.DIRECTORY) {
        operationSet = AppConstants.DIRECTORY_AUDIT_FILTER_OPERATIONS;
      } else {
        operationSet = AppConstants.FILE_AUDIT_FILTER_OPERATIONS;
      }
      return operationSet;
    },

    // @override
    // Renders the file audit history graph.
    // @param startTimeInMs - the start time in milliseconds.
    // @param endTimeInMs - the end time in milliseconds.
    plotGraph: function(startTimeInMs, endTimeInMs) {
      let titleArr = [], len = 0, title = '';

      // Constructing the title of the chart.
      if (this.options && this.options.actionTargetName) {
        titleArr = this.options.actionTargetName.split('/');
        len = titleArr.length;
        title = titleArr[len - 1];
      }

      const fileAuditHistoryChartView = new FileAuditHistoryChartView({
        entityType    : AppConstants.ACCESS_PATTERN_FILE_AUDIT_HISTORY,
        userInput     : this.options.actionTargetId,
        chartId       : 'file-audit-chart',
        startTimeInMs : startTimeInMs,
        endTimeInMs   : endTimeInMs,
        title         : 'File Events for: ' + title,
        objectType    : this.options.actionTargetType
      });

      this.$('.graphWrapper').html(
        fileAuditHistoryChartView.render().el);

      // Register view with the subview helper.
      this.registerSubview('fileAuditHistoryChartView',
        fileAuditHistoryChartView);
    },

    // @override
    // Fetches and renders the audit history table.
    addAuditHistoryTable: function(startTimeInMs, endTimeInMs) {
      let defaultMinRows = 10;
      // Keep the default number of rows to show the same when filter changes,
      // default min rows should not be less than 10
      if (this.fileAuditHistoryTableView) {
        defaultMinRows = this.fileAuditHistoryTableView.defaultMinRows > 10 ?
          this.fileAuditHistoryTableView.defaultMinRows : defaultMinRows;
        this.fileAuditHistoryTableView.remove();
      }

      this.fileAuditHistoryTableView = new FileAuditHistoryTableView({
        fileId: this.options.actionTargetId,
        fileName: this.options.actionTargetName,
        defaultMinRows: defaultMinRows,
        startTimeInMs : startTimeInMs,
        endTimeInMs   : endTimeInMs,
        parent        : this
      });

      // Append the newly initialized datatable
      this.getDOM('.tableWrapper')
        .html(this.fileAuditHistoryTableView.render().el);

      // Start Fetch
      this.fileAuditHistoryTableView.onStartServices();
    }
  });
});
