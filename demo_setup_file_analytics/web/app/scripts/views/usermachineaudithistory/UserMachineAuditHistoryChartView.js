//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineAuditHistoryChartView used for user audit history chart.
//
define([
  // Core
  'views/graph/EntityBarChartView',
  // Models
  'models/usermachineaudithistory/UserMachineAuditGraphModel',
  // Utils
  'utils/AppConstants',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // Core
  EntityBarChartView,
  // Models
  UserMachineAuditGraphModel,
  // Utils
  AppConstants,
  // Templates
  ChartTemplates) {

  'use strict';

  var UserMachineAuditHistoryChartView = EntityBarChartView.extend({

    model: null,

    // Operation filter has permission deined or not
    hasPermissionDenied: false,

    // Operation filter has permission denied file blocking or not
    hasPermissionDeniedFileBlocking: false,

    // Flag to ensure the success call is made just once
    fetch: 0,

    // Will store the copy of model data used for multiple fetch
    modelData: {},

    // @override
    initialize: function(options) {
      this.fetch = 0;
      this.model = new UserMachineAuditGraphModel();
      const machineId = options.machineId;
      const startTimeInMs = options.startTimeInMs;
      const endTimeInMs = options.endTimeInMs;

      // Setting the URL parameters
      // Adding machineId start time and end time to the URL
      this.setUrlParams(machineId, startTimeInMs, endTimeInMs);

      EntityBarChartView.prototype.initialize.call(this, options);
    },

    // @private
    // Sets the parameter to create the URL.
    setUrlParams: function(searchVal, startTimeInMs, endTimeInMs) {
      // Getting the URL for the model
      this.model.getURL(searchVal, startTimeInMs, endTimeInMs);

      let filter = {}, operationFilter = this.getOperationFilter();
      if (Object.keys(operationFilter).length) {
        const optFilter = operationFilter.operations;

        // Check if Permission Denied is checked or not
        const hasPermissionDenied =
          _.indexOf(optFilter, AppConstants.OPERATION_VALUES.PermissionDenied);

        // Check if Permission Denied File Blocking is checked or not
        const hasPermissionDeniedFileBlocking =
          _.indexOf(optFilter,
            AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking);

        // If Permission Denied or Permission Denied file blocking
        // is checked or not
        if (hasPermissionDenied > -1 || hasPermissionDeniedFileBlocking > -1) {
          let filterOperations = JSON.parse(JSON.stringify(optFilter));

          if (hasPermissionDenied > -1) {
            // If operation filters are applied including Permission Denied,
            // exclude Permission Denied pass other operations to the API.
            filterOperations = _.without(optFilter,
              AppConstants.OPERATION_VALUES.PermissionDenied);

            // Set the permission denied flag to true
            this.hasPermissionDenied = true;
          }

          if (hasPermissionDeniedFileBlocking > -1) {
            // If operation filters are applied including Permission Denied
            // File Blocking, exclude Permission Denied File Blocking and
            // pass other operations to the API.
            filterOperations = _.without(filterOperations,
              AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking);

            // Set the permission denied file blocking flag to true
            this.hasPermissionDeniedFileBlocking = true;
          }

          filter.operations = filterOperations;
        } else {
          // If operation filters are applied, pass only those operations
          // to the API.
          filter = operationFilter;
        }
      }

      // Setting up the URL with the operation filters applied
      this.model.setFilterUrl(filter);
    },

    // @Overriden
    // Fetch the data to be rendered in the graph.
    // Need to make 2 separate calls 1. All operations 2. Permission Denied
    fetchGraphData: function(filterDuration) {
      // Hide the error template and show loading on rendering the graph again
      this.showLoading();

      // Get checked operations
      const operationFilter = this.getOperationFilter();

      // If just either permission denied or permission denied with file
      // blocking is checked,
      // or both of them are the only ones checked
      if (((this.hasPermissionDenied ||
        this.hasPermissionDeniedFileBlocking) &&
        (operationFilter.operations.length === 1)) ||
        ((this.hasPermissionDenied &&
        this.hasPermissionDeniedFileBlocking) &&
        (operationFilter.operations.length === 2))) {
        this.prefetchPermissionDeniedStats(filterDuration);
      } else {
        // Fetch all operations stats
        this.fetchOperationsStats(filterDuration);
      }
    },

    // @private
    // Fetch the data for all operation other than "Permission Denied"
    // to be rendered in the graph.
    fetchOperationsStats: function(filterDuration) {
      let _this = this;

      const requestPayload = this.model.getRequestPayload(),
            operationFilter = this.getOperationFilter();

      const options = {
        data: requestPayload,
        type: 'POST',
        success : function(data) {
          // Check if permission denied/permission denied file blocking is
          // required or not OR none of the filter operations are selected
          if ((_this.hasPermissionDenied ||
            _this.hasPermissionDeniedFileBlocking) ||
            (!operationFilter.operations ||
            !operationFilter.operations.length)) {
            // Fetch "Permission Denied" data
            _this.modelData = JSON.parse(JSON.stringify(_this.model.toJSON()));

            _this.prefetchPermissionDeniedStats(filterDuration);
          } else {
            // Dont need "Permission Denied" data
            _this.onActionSuccess(filterDuration);
          }
        },
        error: function(model, xhr) {
          _this.onDataError(xhr);
        }
      };

      this.model.fetch(options);
    },

    // @private
    // Decides what data to be appended in the final graph data.
    prefetchPermissionDeniedStats: function(filterDuration) {
      const operationFilter = this.getOperationFilter(),
            isOperationPresent = Object.keys(operationFilter).length &&
              operationFilter.operations;

      // For permission denied access control
      if (this.hasPermissionDenied || !isOperationPresent) {
        this.fetch++;
        this.fetchPermissionDeniedStats(filterDuration,
          AppConstants.OPERATION_VALUES.PermissionDenied);
      }
      // For permission denied file blocking
      if (this.hasPermissionDeniedFileBlocking || !isOperationPresent) {
        this.fetch++;
        this.fetchPermissionDeniedStats(filterDuration,
          AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking);
      }
    },

    // @private
    // Fetch the data for "Permission Denied" or "Permission Denied File
    // Blocking" to be rendered in the graph.
    fetchPermissionDeniedStats: function(filterDuration, typeOfPD) {
      let _this = this;
      // Set the request payload for "Permission Denied"
      const filter = {
        'operations': [typeOfPD]
      };

      this.model.setFilterUrl(filter);
      const requestPayload = this.model.getRequestPayload();

      const options = {
        data: requestPayload,
        type: 'POST',
        success : function(data) {
          _this.fetch--;

          // Format the data to render the chart to accomodate the
          // permission denied changes.
          _this.formatPermissionDeniedStats(typeOfPD);

          // Call the onActionSuccess function just once.
          if (_this.fetch === 0) {
            _this.onActionSuccess();
          }
        },
        error: function(model, xhr) {
          _this.onDataError(xhr);
        }
      };

      this.model.fetch(options);
    },

    // @private
    // Aggregate sum of Permission Denied events for all operations
    formatPermissionDeniedStats: function(typeOfPD) {
      const totalPermissionDenied =
        _.reduce(this.model.toJSON(), function(total, val) {
          return total + val.count;
        }, 0);

      // Clone the model data
      let newModelData = JSON.parse(JSON.stringify(this.modelData));
      const length = newModelData ? Object.keys(newModelData).length : 0;

      // Append the permission denied/permission denied file blocking record
      // at the end
      newModelData[length] = {
        count: totalPermissionDenied,
        name: typeOfPD
      };

      // Update the value in the instance of model data
      this.modelData = JSON.parse(JSON.stringify(newModelData));

      // Update the model with all operations including Permission Denied and
      // Permission Denied File blocking
      this.model.attributes = newModelData;
    },

    // Update chart on fetch complete
    onActionSuccess: function(filterDuration) {
      // Hide loading
      this.hideLoading();
      this.updateChartData(filterDuration);
    },


    // Function to return the applied operation filter
    getOperationFilter: function() {
      let checkboxIds = [], filter = {};

      // Getting all the checkboxes
      let checkboxes = $('.op-filter').find('.operations')
        .find('.n-checkbox');

      // Getting the checkboxes that are selected
      _.each(checkboxes, function(checkbox) {
        if ($(checkbox).is(':checked')) {
          checkboxIds.push($(checkbox).attr('name'));
        }
      });

      // Adding selected checkboxes' id to operation filter
      if (checkboxIds.length > 0) {
        filter = { 'operations' : checkboxIds };
      }

      return filter;
    },

    // @override
    // Helper function to generate the tooltip content for the bar when
    // hovered
    getTooltip: function(key, x, y, e, graph) {
      var tooltip, title = AppConstants.TOOLTIP_HEADINGS[
        AppConstants.ACCESS_PATTERN_USER_AUDIT_HISTORY];
      if (e && e.point && e.point.tooltip &&
          (e.point.tooltip.length === 2)) {
        tooltip = ChartTemplates.TOOL_TIP_TEMPLTE({
          entityName: title,
          dataTitle: e.point.tooltip[0],
          dataValue: e.point.tooltip[1]
        });
      }

      return tooltip;
    }
  });

  return UserMachineAuditHistoryChartView;
});
