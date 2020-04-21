//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// UserAuditHistoryPageView enables shows the wizard for the audit history of a
// user. User can see the data according to the operations and date range
// selected.
//
define([
  // Core classes
  'views/wizard/BaseAuditHistoryWizardView',
  'views/useraudithistory/UserAuditHistoryTableView',
  'views/useraudithistory/UserAuditHistoryChartView',
  // Utils
  'utils/AppConstants'],
function(
  // References
  BaseAuditHistoryWizardView,
  UserAuditHistoryTableView,
  UserAuditHistoryChartView,
  // Utils
  AppConstants) {

  'use strict';

  // Extending the BaseAuditHistoryWizardView
  return BaseAuditHistoryWizardView.extend({

    name: 'UserAuditHistoryPageView',

    // @private
    // Add the operation filter checkboxes.
    addFilterCheckboxes: function() {
      BaseAuditHistoryWizardView.prototype.addFilterCheckboxes.call(this,
        AppConstants.USER_AUDIT_FILTER_OPERATIONS);
    },

    // @override
    // Renders the user audit history graph.
    // @param startTimeInMs - the start time in milliseconds.
    // @param endTimeInMs - the end time in milliseconds.
    plotGraph: function(startTimeInMs, endTimeInMs) {
      const userAuditHistoryChartView = new UserAuditHistoryChartView({
        entityType    : AppConstants.ACCESS_PATTERN_USER_AUDIT_HISTORY,
        userId        : this.options.actionTargetId,
        chartId       : 'file-audit-chart',
        startTimeInMs : startTimeInMs,
        endTimeInMs   : endTimeInMs,
        title         : 'User Events for: ' + this.options.actionTargetName
      });

      this.$('.graphWrapper').html(
        userAuditHistoryChartView.render().el);

      // Register view with the subview helper.
      this.registerSubview('userAuditHistoryChartView',
        userAuditHistoryChartView);
    },

    // @override
    // Fetches and renders the audit history table.
    addAuditHistoryTable: function(startTimeInMs, endTimeInMs) {
      let defaultMinRows = 10;
      // Keep the default number of rows to show the same when filter changes,
      // default min rows should not be less than 10
      if (this.userAuditHistoryTableView) {
        defaultMinRows = this.userAuditHistoryTableView.defaultMinRows > 10 ?
          this.userAuditHistoryTableView.defaultMinRows : defaultMinRows;
        this.userAuditHistoryTableView.remove();
      }

      this.userAuditHistoryTableView = new UserAuditHistoryTableView({
        defaultMinRows: defaultMinRows,
        userName      : this.options.actionTargetName.replace(/\\/g, '%5C'),
        userId        : this.options.actionTargetId,
        startTimeInMs : startTimeInMs,
        endTimeInMs   : endTimeInMs,
        parent        : this
      });

      // Append the newly initialized datatable
      this.getDOM('.tableWrapper')
        .html(this.userAuditHistoryTableView.render().el);

      // Start Fetch
      this.userAuditHistoryTableView.onStartServices();
    }
  });
});
