//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// EntitySimpleLineChartView is a historical/realtime view of different data
// attributes on the same entity, rendered as a line chart
// For example, read and write operation aggregated at fileserver level
//
define([
  // Core
  'views/base/BaseChartView',
  // Utils
  'utils/AppConstants',
  'utils/StatsUtil',
  'utils/StyleDescriptor'],
function(
  // References of core
  BaseChartView,
  // Utils
  AppConstants,
  StatsUtil,
  StyleDescriptor) {

  'use strict';

  // Chart margin to render the graph
  var CHART_MARGINS = {
    top: 50,
    left: 35,
    right: 35 };

  // Extending the BaseChartView
  var EntitySimpleLineChartView = BaseChartView.extend({

    // Properties
    //-----------

    // NOTE about el:
    // The el property should be set by the parent class.

    // NOTE about className:
    // It uses the default value from the BaseChartView.

    // NOTE about model:
    // this.model is an instance
    model: null,

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initializeStatsProperties: function(options) {
      // Update the title
      this.title = StatsUtil.getMetricLabel(options.entityType);

      // Gets the options to be shown as legends and on the chart
      if (this.metricType) {
        this.lineOptions = StatsUtil.getMetricOptions(this.metricType[0]);
      }

      if (this.lineOptions) {
        this.lineDataOptions = this.lineOptions.lineDataOptions;
        this.numLinesOfData = this.lineDataOptions ?
          this.lineDataOptions.length : 0;
        this.units = this.lineOptions.units;
      }

      // Get chart colors base on metric type
      this.lineColors = StyleDescriptor.getChartColor(this.metricType[0]);
    },

    // @override
    // Updates the chart data, gets the data in the format required and
    // renders it.
    updateChartData: function(filterDuration) {
      // Check if chart is valid for update
      if (!this.isValidForChartUpdate(filterDuration)) {
        return;
      }

      // Get the metrics for this chart as specified in the options during
      // initialization.
      var metrics = this.getMetricId();

      this.graphData = [];

      // get the graph data for each metric
      var count = 0;
      _.each(metrics, function(metric, i) {
        if (this.model.getStats(metric)) {
          this.graphData[count] = this.model.getStats(metric);
          count++;
        }
      }, this);

      // Check if we have same amount of data for all the metrics given
      // since this is needed for charts.
      // Also, check if there are any NA (-1) scenarios for data, in which
      // case we will need to fill in the data from the previous timestamp.
      if (!this._checkDataFormat()) {
        // Show No Data
        this.showNoData();
        return;
      }

      // Now that we have our data, lets get it in the format we want for
      // rendering the line chart as expected by nvd3
      this._formatLineChartDataD3();

      // Re-render the chart
      this.renderChart();
    },

    // @private
    // Check if we have same amount of data for all the metrics given
    // since this is needed for stacked area charts.
    // Also, check if there are any null scenarios for data, in which
    // case we will need to fill in the data from the previous timestamp.
    _checkDataFormat: function() {
      var isDataEnough = true,
          lengthOfData = 0;

      // Check if there is a mismatch of the number of values in the metrics
      // data obtained. For stacked area charts, there should be same number
      // of data available.

      if (this.graphData && this.graphData.length) {

        // Backend should return an empty array here if there are no stats
        // but to make UI code more robust lets handle the case where
        // the stats call returns no content.
        lengthOfData = this.graphData[0] ? this.graphData[0].length : 0;

        for (var i = 1; i < this.graphData.length; i++) {
          if (!this.graphData[i] ||
            this.graphData[i].length !== lengthOfData) {
            isDataEnough = false;
          }
        }
      } else {
        isDataEnough = false;
      }

      if (isDataEnough) {
        // Now that we know that we have enough data, check if all of that
        // data is available. If there is any -1 in the values, that means
        // data was not available at that timestamp, and we need to fill it
        // in from the previous timestamp, else it will be shown as 0 by
        // default
        _.each(this.graphData, function(data) {
          var prev = 0;
          _.each(data, function(d, i) {
            // d[0] is the timestamp and d[1] is the data
            if (d[1] < 0) {
              d[1] = prev;
            }
            prev = d[1];
          });
        });
      } else {
        console.log('EntitySimpleLineChartView: ' +
          'The number of data points do not match for the metrics.');
      }

      return isDataEnough;
    },

    // graphData coming to us is of the following format, where the outer
    // array will hold as many array objects as the number of metrics we
    // want to plot in the same area chart.
    // For example, for the latency chart, the
    // first array corresponds to the total data metric, and the second
    // array corresponds to the snapshot data metric.
    // [
    //    [
    //      [ts1, 50],
    //      [ts2, 75],
    //      [ts3, 100], ...
    //    ],
    //    [
    //      [ts1, 25],
    //      [ts2, 30],
    //      [ts3, 50],...
    //    ]
    //  ]
    //  and we need to convert it in the following format:
    //
    //  [
    //    {
    //      key: "Description for series",
    //      color: "Color for series",
    //      values: [{x:ts1, y:50}, {x:ts2, y:75}, {x:ts3, y:100}, ...]
    //    },
    //    {
    //      key: "Description for series",
    //      color: "Color for series",
    //      values: [{x:ts1, y:25}, {x:ts2, y:30}, {x:ts3, y:50}, ...]
    //    }
    //  ]
    //
    // This array will have as many objects as the number of stacks
    _formatLineChartDataD3: function() {
      this.lineChartData = [];

      // If there is no data, just return instead of trying to get the bar
      // data. Then the renderChart will just display no data available.
      if (!this.graphData || !this.graphData.length) {
        return;
      }

      // Get the metrics for this chart as specified in the options during
      // initialization.
      var metrics = this.getMetricId();

      for (var i = 0; i < this.graphData.length; i++) {
        this.lineChartData.push({
          key: AppConstants.OPERATION[metrics[i]] ?
            AppConstants.OPERATION[metrics[i]] : metrics[i],
          color: this.lineColors[i],
          values: []
        });
      }

      if (this.lineChartData && this.lineChartData.length) {
        _.each(this.graphData, function(dataArray, ii) {
          _.each(this.graphData[ii], function(val) {
            // Do the units conversion based on the option specified.
            // val[0] is the timestamp
            // val[1] is the value
            this.lineChartData[ii].values.push({
              x: val.epoch_time,
              y: val.count
            });
          }, this);
        }, this);
      }
    },

    // @private
    // Checks if we have all the data to render the chart
    _isThereDataToRender: function() {
      var retVal = this.lineChartData && this.lineChartData.length;

      _.each(this.lineChartData, function(data) {
        retVal = retVal && data.values && data.values.length;
      });

      return retVal;
    },

    // @override
    renderChart: function() {
      // Get the DOM element where your chart is placed
      var chartContainer = this.getChartContainer();
      var _this = this;

      // Remove previous if already exists
      if (this._svg) {
        this._svg.remove();
        this._svg = null;
        this.graph = null;
      }

      this._svg = d3.select(chartContainer)
        .append('svg')
        .attr('class', 'chart');

      // Check if there's data...
      if (this._isThereDataToRender()) {
        // Show the chart element
        this.showChart();

        this.graph =
          nv.addGraph(function() {
            var chart = nv.models.lineChart()
              .useInteractiveGuideline(true)
              .showLegend(false)
              .showYAxis(true)
              .showXAxis(true)
              .transitionDuration(350)
              .margin(CHART_MARGINS)
              .rectMode(false)
              .excludeLegendsFromMarginTop(false)
              .showYZeroLine(true);

            chart.legend.margin({
              top: 2,
              right: 130,
              left: 0,
              bottom: 30
            });

            _this._svg
              .datum(_this.lineChartData)
              .call(chart);
            // Setting the gravity to custom avoids tooltip to get
            // cut off and remain within chart container
            chart.interactiveLayer.tooltip.gravity('custom');
            nv.utils.windowResize(chart.update);
            return chart;
          });
      } else {
        // Show No Data
        this.showNoData();
      }
    }
  });

  // Returns the EntitySimpleLineChartView Class
  return EntitySimpleLineChartView;
});
