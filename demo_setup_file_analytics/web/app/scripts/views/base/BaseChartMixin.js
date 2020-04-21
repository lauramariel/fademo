//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// BaseChartMixin contains basic methods to be mixed in with any type of chart
// base
//
define([
  // Utils
  'utils/AppConstants'],
  function(
    // References of utils
    AppConstants) {
    'use strict';

    return {
      // Properties (Core)
      //------------------

      // Maximum Y value for the current chart data with margin.
      // Each metric type has a default margin.
      chartDataMaxY: 0,

      // Minimum Y value for the current chart data
      chartDataMinY: 0,

      // The max display value on Y-axis. Binny wants to display the actual max
      // data value and not the chartDataMaxY (with margin).
      chartDataMaxYdisplay: 0,

      // Margin on the max
      autoscaleMargin: 0.20,

      // Chart Constants
      //----------------

      // Defaults
      DEFAULT_MAX_Y: 100,
      DEFAULT_MIN_Y: 0,

      // For customization of this view with certain properties, this is called
      // during the initialize() function.
      initializeStatsProperties(options) {
        // NOTE: Meant to be overridden by subclass.
      },

      // Updates the chart data, calculates the max/min of the chart data and
      // renders it.
      // @param statsModel - an instance of StatsModel
      updateChartData(model) {
        // NOTE: Meant to be overridden by subclass
      },

      // Called to render the chart.
      renderChart() {
        // NOTE: Meant to be overridden by subclass
      },

      // NOTE: Don't override this
      // Return the metric stats property.
      getMetricId() {
        return this.options.metricId || this.metricType;
      },

      // Functions (Display)
      //--------------------
      // Shows no data view
      showNoData() {
        // NOTE: Meant to be overridden by subclass
      },

      // Functions (Util)
      //-----------------

      // Return blank
      xAxisTickFormatter(value) {
        // NOTE: Meant to be overridden by subclass
      },

      // Return blank
      yAxisTickFormatter(value) {
        // NOTE: Meant to be overridden by subclass
      },

      // Returns the default autoscale margin.
      getAutoScaleMargin() {
        return this.autoscaleMargin;
      },

      // Returns the default max value based on the metric type. This makes
      // sure there are no 0 max.
      getMax() {
        return this.chartDataMaxY;
      },

      // Returns the default min value based on the metric type
      getMin() {
        return this.chartDataMinY;
      },

      // Returns the max display value based on the metric type.
      getMaxDisplay() {
        return this.chartDataMaxYdisplay;
      },

      // Returns the max display label based on the metric type.
      getMaxDisplayLabel() {
        return this.formatStatsChartYAxis(this.getMetricId(),
          (this.getMaxDisplay() || this.getMax()), true);
      },

      // @abstract
      getMetricTypeUnit() {
        // Child class can provide the metric unit
      },

      // NOTE: To override
      // Update the max, min values based on the chart data.
      updateChartOptions() {
        // NOTE: Meant to be overridden by subclass
      },

      // Set an appropriate max based off the max value and units
      setAppropriateMax() {
        var max = this.chartDataMaxY;

        // Adds margin on top of the chart and limit
        var margin = 1 + this.getAutoScaleMargin();

        // The estimated new max after margin is applied
        var maxMargin = Math.ceil(max * margin);

        if (this.chartDataMaxY <= this.DEFAULT_MAX_Y) {
          // Default
          max = this.DEFAULT_MAX_Y;
        }

        // Now set the max
        this.chartDataMaxY = max;
      },

      // Returns the start time of the graph in milliseconds
      getTimeRangeMin() {
        return this.model.get('startTime') ||
               parseInt(this.model.get('interval_start_ms'), 10);
      },

      // Returns the end time of the graph in milliseconds
      getTimeRangeMax() {
        return this.model.get('endTime') ||
               parseInt(this.model.get('interval_end_ms'), 10);
      },


      // @private
      // Checks if the stats for the metric or metrics given are appropriate
      _checkMetricsData(model, metrics) {
        var isValid = true;

        if (_.isArray(metrics)) {
          _.each(metrics, function(metric) {
            var statsForMetric = model.getStats(metric);
            isValid = isValid && statsForMetric && statsForMetric.length !== 0;
          });
        } else {
          var statsForSingleMetric = model.getStats(metrics);
          isValid = statsForSingleMetric && statsForSingleMetric.length !== 0;
        }

        return isValid;
      },

      // Parses the data that comes from the y-axis of chart for consistency.
      // @param metric     - Metric type value from AppConstants.METRIC_*  OR
      //                     Property from DataProperties.STATS_*.
      // @param value      - Stats value to be converted to readable format.
      // @param hasUnit    - Set to false if the UOM label isn't included and
      //                     return numeric value. Default is true.
      formatStatsChartYAxis: function(metric, value, hasUnit) {
        var statsValue = this.rawNumericFormat(value);

        // Show only 2 decimal points when necessary. Preserve the symbol.
        if (statsValue && _.isString(statsValue)) {
          var y = statsValue.split(' '),
              stat = (isNaN(y[0]) ? y[0] : this.round(y[0], 2) ),
              symbol = (y.length > 1 ? y[1] : '');

          statsValue = stat + ' ' + symbol;
        }

        return statsValue;
      },

      // Formats raw numeric values.
      // eg 1000 is converted to 1K
      // @param value    - Numeric value
      // @param floor    - Boolean, determines if value is rounded or floored
      // @return formatted string
      rawNumericFormat: function(value, floor) {
        if (!this.isValidStats(value)) {
          return AppConstants.STATS_NOT_AVAILABLE;
        }

        var units = ["", "K", "M", "G", "T", "P"],
            returnValue = 0,
            power = 0;

        if (isNaN(value) || value === 0 || value === null) {
          return "0";
        }

        for (var i = units.length-1; i >= 0; i--) {
          if ((value / Math.pow(1000, i)) >= 1 || i === 0) {
            power = i;
            break;
          }
        }

        var valPoweredDown = value / Math.pow(1000, power);
        if (floor) {
          returnValue =
            this.formatDecimalDigits(valPoweredDown, 3, true) +
              units[power];
        }
        else {
          returnValue = Math.round(valPoweredDown * 100) / 100 + units[power];
        }

        return returnValue;
      },

      // Trim digits if necessary
      // The behavior here is to round or floor the digits of a float number
      // only up to the point of being an integer
      // @param value      - Value to be trimmed.
      // @param maxDigits  - Maximum number of digits for return value.  NOTE:
      //                     This value only determines if digits will be
      //                     rounded/floored from the right side of the
      //                     decimal.
      //                     e.g. if maxDigits = 3, the value 3045.7 would
      //                     become 3046 or 3045
      // @param floor      - Boolean, determines if value is roudned or floored
      formatDecimalDigits: function(value, maxDigits, floor){
        if (!maxDigits || maxDigits <= 0) {
          return value;
        }

        var num = parseFloat(value);

        if (isNaN(num)) {
          return value;
        }

        var decimalLocation = num.toString().search(/\./);

        // Only trim digits if a float number
        // decimalLocation will be -1 if no decimal
        if (decimalLocation > -1) {
          var digitCount = num.toString().length - 1;

          if (digitCount > maxDigits) {
            var stringValue = (typeof(value) === 'string') ? value :
              this.safeStringify(value);

            var trimmableDigits = digitCount - decimalLocation;
            var newDigitQty = trimmableDigits - (digitCount - maxDigits);
            newDigitQty = (newDigitQty > -1 ? newDigitQty : 0);

            if (floor) {
              value = this.floor(num,newDigitQty);
            }
            else {
              value = this.round(num,newDigitQty);
            }

            // Append units if value has units
            if (stringValue.search(' ') >= 0) {
              var val = stringValue.split(' ');
              value = (val.length > 1 ? value + ' ' + val[1] : value);
            }
          }
        }

        return value;
      },

      // Wrapper to safely stringify a variable.
      safeStringify: function(input) {
        return (typeof input === 'undefined' ? '' :
          JSON.stringify(input));
      }
    };
  }
);
