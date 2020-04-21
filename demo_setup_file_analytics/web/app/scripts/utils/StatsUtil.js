//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// StatsUtil contains common utility functions for stats data.
//
define([
  // Data
  'data/DataProperties',
  // Utils
  'utils/AppConstants'],
function(
  // Data
  DataProp,
  // Utils
  AppConstants) {

  'use strict';

  // Constants
  //----------

  var StatsUtil = _.extend({

    // Properties
    //-----------

    // Module Name
    name: 'StatsUtil',

    // Constants
    //----------
    STORAGE_UOM: {
      B:  1,
      KB: 1024,
      MB: 1048576,
      GB: 1073741824,
      TB: 1099511627776
    },

    // Units of measurement for binary (used in memory)
    UOM_KB: 'KB',
    UOM_MB: 'MB',
    UOM_GB: 'GB',
    UOM_TB: 'TB',
    UOM_BYTES: 'B',


    // Functions
    //----------------------------

    // Returns the options required for chart of a metric type
    getMetricOptions: function(metric) {
      var options;

      switch (metric) {
        case DataProp.STATS_FILE_AUDIT_HISTORY:
        case DataProp.STATS_USER_AUDIT_HISTORY:
        case DataProp.STATS_FILE_DISTRIBUTION_BY_TYPE:
        case DataProp.STATS_FILE_DISTRIBUTION_BY_AGE:
          options = {
            units: '',
            nameAttr: 'name', // to get name of entity
            sortAttr: 'count', // to sort the entities
            barDataOptions: [] // for dynamic barDataOptions
          };
          break;
        case DataProp.ACCESS_PATTERN_FILES_OPERATIONS:
          options = {
            units: '',
            lineDataOptions: []
          };
          break;
        case DataProp.STATS_FILE_DISTRIBUTION_BY_SIZE:
          options = {
            barDataOptions: []
          };
          break;
        case DataProp.SHOW_CAPACITY_FLUCTUATION:
          options = {
            units: '',
            lineBarDataOptions: [
              {
                title : AppConstants.CAPACITY_TREND.CAPACITY_ADDED // for legend
              },
              {
                title : AppConstants.CAPACITY_TREND.NET_CAPACITY // for legend
              }
            ]
          };
          break;
        case DataProp.SHOW_FILE_TYPE_OVER_TIME:
          options = {
            units: '',
            stackDataOptions: [
              {
                title : ''
              }
            ]
          };
          break;
      }

      return options;
    },

    // Returns the label of a entity type
    // @param entityType - Entity being referrenced for the stat.
    getMetricLabel: function(entityType) {
      var labelMetric = null;
      // Get the entity type label
      switch (entityType) {
        case AppConstants.ACCESS_PATTERN_FILES_OPERATIONS:
        case AppConstants.ACCESS_PATTERN_FILE_AUDIT_HISTORY:
        case AppConstants.ACCESS_PATTERN_USER_AUDIT_HISTORY:
        case AppConstants.SHOW_FILE_DISTRIBUTION_BY_TYPE:
        case AppConstants.SHOW_FILE_DISTRIBUTION_BY_SIZE:
        case AppConstants.SHOW_FILE_DISTRIBUTION_BY_AGE:
        case AppConstants.SHOW_CAPACITY_FLUCTUATION:
        case AppConstants.SHOW_FILE_TYPE_OVER_TIME:
          labelMetric = AppConstants.HEADINGS[entityType];
          break;
      }
      return labelMetric;
    },

    formatBytes: function(bytes, decimals) {
      if (bytes < 0) {
        return AppConstants.STATS_NOT_AVAILABLE;
      }

      if (bytes === 0) {
        return '0 B';
      }
      // Accept 0 as a parameter in case no decimals are to be displayed
      let dm = typeof decimals === 'undefined' ? 2 : decimals;

      var k = this.STORAGE_UOM.KB,
          sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
          i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    // Compare all of the values in the array to find middle value.
    // Use middle value to determine the proper data size unit.
    // @ param arr : an array of data size values
    determineDataSizeUnit: function(arr) {
      let minValue = Math.min.apply(null, arr),
          maxValue = Math.max.apply(null, arr),
          middleValue = (minValue + maxValue) / 2,
          unit;

      if (middleValue === 0) {
        unit = this.UOM_BYTES;
      }
      // Use middle value to determine the data size unit
      if (middleValue > 0) {
        let indicator = Math.floor(
          middleValue / this.STORAGE_UOM.GB);
        if (indicator > 1024) {
          unit = this.UOM_TB;
        } else if (indicator === 0) {
          let val = Math.floor(
            middleValue / this.STORAGE_UOM.MB);
          if (val > 0) {
            unit = this.UOM_MB;
          } else {
            let subVal = Math.floor(
              middleValue / this.STORAGE_UOM.KB);
            if (subVal > 0) {
              unit = this.UOM_KB;
            } else {
              unit = this.UOM_BYTES;
            }
          }
        } else {
          unit = this.UOM_GB;
        }
      }
      return unit;
    },

    // Compare all of the values in the array to find middle value.
    // Use middle value to determin the proper data count unit.
    // @ param arr : an array of data count values
    determineDataCountUnit: function(arr) {
      var minValue = Math.min.apply(null, arr),
          maxValue = Math.max.apply(null, arr),
          middleValue = (minValue + maxValue) / 2, unit;

      // Use middle value to determine the data size unit
      if (middleValue === 0) {
        unit = '';
      } else {
        var indicator = this.round(middleValue / 1000000);
        indicator = parseInt(indicator, 10);
        if (indicator > 1000000) {
          unit = 'M';
        } else if (indicator === 0) {
          var subIndicator = this.round(middleValue / 1000);
          subIndicator = parseInt(subIndicator, 10);
          if (subIndicator > 0) {
            unit = 'K';
          } else {
            unit = '';
          }
        } else {
          unit = 'M';
        }
      }
      return unit;
    },

    // Do the units conversion based on the option specified.
    // @ param val : The value needed to convert the unit
    // @ param unit : The unit to convert to
    // @ param roundoff : Default is true - Get the rounded value
    unitsConversion: function(val, unit, roundOff = true) {
      switch (unit) {
        case this.UOM_TB:
          val = val / this.STORAGE_UOM.TB;
          break;
        case this.UOM_GB:
          val = val / this.STORAGE_UOM.GB;
          break;
        case this.UOM_MB:
          val = val / this.STORAGE_UOM.MB;
          break;
        case this.UOM_KB:
          val = val / this.STORAGE_UOM.KB;
          break;
        case this.UOM_KB + 'ps':
          val = val / this.STORAGE_UOM.KB;
          break;
        default:
          break;
      }

      // if roundOff is true return rounded value upto 2 decimals
      if (roundOff) {
        val = this.round(val, 2);
      }

      return val;
    },

    // Do the units conversion based on the option specified.
    // @ param val : The valuse needed to convert the unit
    // @ param unit : The unit to convert to
    unitsConversionCount: function(val, unit, roundOff = true) {
      switch (unit) {
        case 'M':
          val = val / 1000000;
          break;
        case 'K':
          val = val / 1000;
          break;
        default:
          break;
      }

      // if roundOff is true return rounded value upto 2 decimals
      if (roundOff) {
        val = this.round(val, 2);
      }

      return val;
    },

    // Returns the round off value where i is the decimal place.
    // Default is 100th decimal place.
    round: function(value, i) {
      value = value || 0;
      if (i !== 0) { // Allow zero value
        i = i || 2; // But not other falsy values
      }
      return Math.round((value * Math.pow(10, i))) / Math.pow(10, i);
    }
  });

  return StatsUtil;
});
