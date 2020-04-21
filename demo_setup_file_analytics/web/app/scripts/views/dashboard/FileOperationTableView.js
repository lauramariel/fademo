//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileOperationTableView enables the user to view the table with
// the different file operations.
//
define([
  // Views
  'views/base/BaseTableView',
  'views/dashboard/FileOperationChartView',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/TimeUtil',
  // Models
  'collections/filesaudithistory/FileAuditGraphCollection'],
function(
  // Views
  BaseTableView,
  FileOperationChartView,
  // Utils
  AppConstants,
  AppUtil,
  TimeUtil,
  // Models
  FileAuditGraphCollection) {
  'use strict';

  var FILE_OPERATION_LIST = ['FileCreate', 'FileRead',
    'FileWrite', 'FileDelete', 'SecurityChange'];

  var FileOperationTableView = BaseTableView.extend({

    // The model for the view.
    model: null,

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new FileAuditGraphCollection();
      this.createAccessPatternUrl(options.defaultDuration,
        options.startTimeInMs, options.endTimeInMs);
      BaseTableView.prototype.initialize.call(this, options);
    },

    // @private
    // Function to create the fetch URL.
    createAccessPatternUrl: function(filterDuration, startTime, endTime) {
      let intervalDuration = TimeUtil.getInterval(filterDuration);

      this.model.getAccessPatternUrl(FILE_OPERATION_LIST, intervalDuration,
        startTime, endTime);
    },

    // @override
    // Override onDataError function to show error
    // template and hide the table header.
    onDataError(xhr) {
      this.$el.find('thead').css('display', 'none');
      BaseTableView.prototype.onDataError.call(this, xhr);
    },

    // @override
    // Remove DOM elements that are not required
    renderSubViews: function() {
      BaseTableView.prototype.renderSubViews.call(this);
      this.$('.n-header').remove();
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      let _this = this;
      let defaultDurationVal = this.options.defaultDuration;
      var retArray = [
        // Name
        {
          'sTitle'  : 'Name',
          'mData'   : 'metric',
          'sWidth': '24%',
          'mRender' : function(data, type, full) {
            return '<span title="' + AppConstants.OPERATION[data] + '">' +
              AppConstants.OPERATION[data] + '</span>';
          }
        },
        {
          'sTitle'  : 'Trend',
          'mData'   : 'values',
          'mRender' : function(data, type, full) {
            let templ = '<div class="fileOperationChart' + full.metric +
              ' file-operation-chart"></div>';
            let fileOperChart = new FileOperationChartView({
              entityType  : AppConstants.ACCESS_PATTERN_FILES_OPERATIONS,
              defaultDuration : defaultDurationVal,
              data : full,
              operations: FILE_OPERATION_LIST
            });

            $('.fileOperationChart' + full.metric).html(
              fileOperChart.render().el);
            return templ;
          }
        },
        {
          'sTitle'  : 'Current',
          'mData'   : 'values',
          'sWidth': '15%',
          'sType': 'numeric',
          'mSort' : function(data, type, full) {
            let currVal = data[data.length - 1].count;
            return currVal;
          },
          'mRender' : function(data, type, full) {
            let currVal = data[data.length - 1].count;
            return '<span title="' + currVal + '" >' +
              AppUtil.formatSize(currVal) + '</span>';
          }
        },
        {
          'sTitle'  : 'Average',
          'mData'   : 'values',
          'sWidth': '15%',
          'sType': 'numeric',
          'mSort': function(data, type, full) {
            let sum = 0;
            data.forEach(function(val) {
              sum += val.count;
            });
            let avg = Math.round(sum / (data.length));
            return avg;
          },
          'mRender' : function(data, type, full) {
            let sum = 0;
            data.forEach(function(val) {
              sum += val.count;
            });
            let avg = Math.round(sum / (data.length));
            return '<span title="' + avg + '" >' +
              AppUtil.formatSize(avg) + '</span>';
          }
        },{
          'sTitle'  : 'Peak',
          'mData'   : 'values',
          'sWidth': '15%',
          'sType': 'numeric',
          'mSort': function(data, type, full) {
            let peakVal = 0;

            data.forEach(function(val) {
              if (val.count > peakVal) {
                peakVal = val.count;
              }
            });
            return peakVal;
          },
          'mRender' : function(data, type, full) {
            let peakVal = 0;

            data.forEach(function(val) {
              if (val.count > peakVal) {
                peakVal = val.count;
              }
            });

            return  '<span title="' + peakVal + '" >' +
              AppUtil.formatSize(peakVal) + '</span>';
          }
        }
      ];

      return retArray;
    }
  });

  return FileOperationTableView;
});
