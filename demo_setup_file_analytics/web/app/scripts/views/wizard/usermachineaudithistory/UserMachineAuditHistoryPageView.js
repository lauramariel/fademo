//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineAuditHistoryPageView enables shows the wizard for
// the audit history of a user machine.
// User can see the data according to the operations and date range
// selected.
//
define([
  // Core classes
  'views/wizard/BaseAuditHistoryWizardView',
  'views/usermachineaudithistory/UserMachineAuditHistoryTableView',
  'views/usermachineaudithistory/UserMachineAuditHistoryChartView',
  // Utils
  'utils/AppConstants'],
function(
  // References
  BaseAuditHistoryWizardView,
  UserMachineAuditHistoryTableView,
  UserMachineAuditHistoryChartView,
  // Utils
  AppConstants) {

  'use strict';

  // Extending the BaseAuditHistoryWizardView
  return BaseAuditHistoryWizardView.extend({

    name: 'UserMachineAuditHistoryPageView',

    // @private
    // Add the operation filter checkboxes.
    addFilterCheckboxes: function() {
      BaseAuditHistoryWizardView.prototype.addFilterCheckboxes.call(this,
        AppConstants.USER_AUDIT_FILTER_OPERATIONS);
    },

    // @override
    // Renders the user machine audit history graph.
    // @param startTimeInMs - the start time in milliseconds.
    // @param endTimeInMs - the end time in milliseconds.
    plotGraph: function(startTimeInMs, endTimeInMs) {
      const userMachineAuditHistoryChartView =
        new UserMachineAuditHistoryChartView({
          entityType    : AppConstants.ACCESS_PATTERN_USER_AUDIT_HISTORY,
          machineId     : this.options.actionTargetId,
          chartId       : 'file-audit-chart',
          startTimeInMs : startTimeInMs,
          endTimeInMs   : endTimeInMs,
          title         : 'User Events for: ' + this.options.actionTargetName
        });

      this.$('.graphWrapper').html(
        userMachineAuditHistoryChartView.render().el);

      // Register view with the subview helper.
      this.registerSubview('userMachineAuditHistoryChartView',
        userMachineAuditHistoryChartView);
    },

    // @override
    // Fetches and renders the audit history table.
    addAuditHistoryTable: function(startTimeInMs, endTimeInMs) {
      let defaultMinRows = 10;
      // Keep the default numbeer of rows to show the same when filter changes
      if (this.userMachineAuditHistoryTableView) {
        defaultMinRows = this.userMachineAuditHistoryTableView.defaultMinRows;
        this.userMachineAuditHistoryTableView.remove();
      }

      let chunkCount = this.$('.tableWrapper')
        .find('.dataTables_length select').val();

      if (chunkCount) {
        defaultMinRows = chunkCount;
      }

      this.userMachineAuditHistoryTableView =
        new UserMachineAuditHistoryTableView({
          defaultMinRows: defaultMinRows,
          machineName   : this.options.actionTargetName.replace(/\\/g, '%5C'),
          machineId     : this.options.actionTargetId,
          startTimeInMs : startTimeInMs,
          endTimeInMs   : endTimeInMs,
          parent        : this
        });

      // Append the newly initialized datatable
      this.getDOM('.tableWrapper')
        .html(this.userMachineAuditHistoryTableView.render().el);

      // Start Fetch
      this.userMachineAuditHistoryTableView.onStartServices();
    }
  });
});
