//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// CapacitySummaryTableView views the table with
// the summary of capacity trend.
//
define([
  // Views
  'views/base/BaseTableView',
  // Collections
  'collections/capacitytrend/CapacityTrendCollection',
  // Utils
  'utils/StatsUtil'],
function(
  // Views
  BaseTableView,
  // Collections
  CapacityTrendCollection,
  // Utils
  StatsUtil) {

  'use strict';

  var CapacitySummaryTableView = BaseTableView.extend({

    // The model for the view.
    model: null,

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new CapacityTrendCollection();
      this.model._metadata = {
        'count': 1,
        'total': 1
      }
      options.defaultMinRows = 1;
      this.model.models = [];
      BaseTableView.prototype.initialize.call(this, options);
    },

    // @override
    fetchModel: function() {
      this.resetSettings();
      const finalData = [this.options];
      this.insertDataRows(finalData);
    },

    // @override
    // Render sub-views and remove unwanted view from DOM
    renderSubViews: function() {
      BaseTableView.prototype.renderSubViews.call(this);
      this.$('.n-header').remove();
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      var retArray = [
        {
          'sTitle'  : 'Net Capacity Change',
          'mData'   : 'capacityAdded',
          'mRender' : function(data, type, full) {
            let addedCount = full.capacityAdded,
                removedCount = full.capacityRemoved;

            let netChange = addedCount - removedCount,
                units = StatsUtil.determineDataSizeUnit([Math.abs(netChange)]);
            return StatsUtil.unitsConversion(netChange, units)
              + ' ' + units;
          }
        },
        {
          'sTitle'  : 'Capacity Added',
          'mData'   : 'capacityAdded',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;
          }
        },
        {
          'sTitle'  : 'Capacity Removed',
          'mData'   : 'capacityRemoved',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;
          }
        },
        {
          'sTitle'  : 'Total Capacity',
          'mData'   : 'totalCapacity',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;

          }
        }
      ];

      return retArray;
    }
  });

  return CapacitySummaryTableView;
});
