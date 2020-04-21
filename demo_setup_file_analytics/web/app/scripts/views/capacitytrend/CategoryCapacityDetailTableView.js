//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// CategoryCapacityDetailTableView views the table with
// the details of capacity trend.
//
define([
  // Views
  'views/base/BaseTableView',
  // Utils
  'utils/StatsUtil',
  'utils/AppUtil',
  'utils/AppConstants',
  'utils/TimeUtil',
  // Data
  'data/DataProperties',
  // Collections
  'collections/capacitytrend/CapacityTrendCollection'],
function(
  // Views
  BaseTableView,
  // Utils
  StatsUtil,
  AppUtil,
  AppConstants,
  TimeUtil,
  // Data
  DataProp,
  // Collections
  CapacityTrendCollection) {
  'use strict';

  var CategoryCapacityDetailTableView = BaseTableView.extend({

    // Hide the left section of the header.
    leftHeader: false,

    // Hide search
    headerSearchBox: false,

    // The model for the view.
    model: null,

    // Page id list, need to maintain in case pagination is handled using
    // next_page_id instead of standard page count
    PAGE_ID_LIST: [],

    className: 'n-base-data-table n-tab tab-pane',

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new CapacityTrendCollection();
      this.createUrl(options.interval, options.startTimeInMs,
        options.endTimeInMs);
      this.PAGE_ID_LIST = [];

      BaseTableView.prototype.initialize.call(this, options);
    },

    // @private
    // Function to create the fetch URL
    createUrl: function(filterDuration, startTime, endTime) {
      let interval = TimeUtil.getInterval(filterDuration);
      this.model.getURL(interval, startTime, endTime, DataProp.CATEGORY);
    },

    // @private
    // Return defaults for category entity type
    getDefaultColumns: function() {
      var retArray = [
        // Name
        {
          'sTitle'  : 'Name',
          'mData'   : DataProp.CAPACITY_ENTITY_DETAILS,
          'bSearchable' : true,
          'mRender' : function(data, type, full) {
            return data[DataProp.NAME] ?
              AppUtil.getCategoryDisplayName(data[DataProp.NAME]) :
              AppConstants.NOT_AVAILABLE;
          }
        },
        {
          'sTitle': 'Net Capacity Change',
          'mData': DataProp.CAPACITY_ADDED,
          'sType': 'numeric',
          'mSort': function(data, type, full) {
            return full[DataProp.CAPACITY_ADDED] -
              full[DataProp.CAPACITY_REMOVED];
          },
          'mRender': function(data, type, full) {
            let change =
              full[DataProp.CAPACITY_ADDED] - full[DataProp.CAPACITY_REMOVED];
            let units = StatsUtil.determineDataSizeUnit([Math.abs(change)]);
            return StatsUtil.unitsConversion(change, units)
              + ' ' + units;
          }
        },
        {
          'sTitle'  : 'Capacity Added',
          'mData'   : DataProp.CAPACITY_ADDED,
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;
          }
        },
        {
          'sTitle'  : 'Capacity Removed',
          'mData'   : DataProp.CAPACITY_REMOVED,
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;
          }
        }
      ];

      return retArray;
    },

    // @override
    // Overriden to update the fetch url with the next page id instead of
    // page count
    refreshData: function(options) {
      // Get meta data and update the new url with next page id
      const modelMetaData = this.model.getMetaData();
      if (Object.keys(modelMetaData).length &&
        modelMetaData[DataProp.NEXT_PAGE_ID]) {
        // Check if next page id is already in the list or not
        // if in the list dont push else push
        let indexOfNextPageId =
          this.PAGE_ID_LIST.indexOf(modelMetaData[DataProp.NEXT_PAGE_ID]);
        if (indexOfNextPageId < 0) {
          this.PAGE_ID_LIST.push(modelMetaData[DataProp.NEXT_PAGE_ID]);
        }
        this.model.updateUrl(this.PAGE_ID_LIST[this.currentPage - 1]);
      }

      let _this = this,
          modelData = this.model.models,
          params = options && options.params ? options.params : {
            success : function(data) {
              data.models = modelData.concat(data.models);
              _this.switchNextPage();
            },
            error: function(model, xhr) {
              _this.onDataError(xhr);
            }
          };

      this.model.fetch(params);
    }
  });

  return CategoryCapacityDetailTableView;
});
