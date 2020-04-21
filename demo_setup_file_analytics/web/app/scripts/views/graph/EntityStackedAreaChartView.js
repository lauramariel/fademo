//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// EntityStackedAreaChartView is a historical/realtime view of different data
// attributes on the same entity, rendered as a line chart
// For example, read and write operation aggregated at fileserver level
//
define([
  // Core
  'views/base/BaseChartView',
  // Utils
  'utils/StatsUtil',
  'utils/StyleDescriptor'],
function(
  // References of core
  BaseChartView,
  // Utils
  StatsUtil,
  StyleDescriptor) {

  'use strict';

  // Chart margin to render the graph
  var CHART_MARGINS = {
    top: 50,
    left: 50,
    right: 30
  };

  // Extending the BaseChartView
  var EntityStackedAreaChartView = BaseChartView.extend({

    // Properties
    //-----------

    // NOTE about el:
    // The el property should be set by the parent class.

    // NOTE about className:
    // It uses the default value from the BaseChartView.

    // NOTE about model:
    // this.model is an instance
    model: null,

    // set default value formatter as false
    hasCustomValueFormatter: false,

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initializeStatsProperties: function(options) {
      // Since all the metrics specified will be rendered in the same chart
      // we can get the chart title, options and colors using any of the
      // metrics. The consumer of this chart view need to ensure that the
      // metric type is passed in the options as an array.


      // Update the title
      this.title = StatsUtil.getMetricLabel(options.entityType);

      // Gets the options to be shown as legends and on the chart
      if (this.metricType) {
        this.stackOptions = StatsUtil.getMetricOptions(this.metricType);
      }

      if (this.stackOptions) {
        this.stackDataOptions = this.stackOptions.stackDataOptions;
        this.numStacksOfData = this.stackDataOptions ?
          this.stackDataOptions.length : 0;
        this.units = this.stackOptions.units;
      }

      // Get chart colors base on metric type
      this.stackColors = StyleDescriptor.getChartColor(this.metricType);
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
      this._formatstackedAreaDataD3();

      // Re-render the chart
      this.renderChart();
    },

    // @private
    // Check if we have same amount of data for all the metrics given
    // since this is needed for stacked area charts.
    // Also, check if there are any null scenarios for data, in which
    // case we will need to fill in the data from the previous timestamp.
    _checkDataFormat: function() {
      var isDataEnough = true, lengthOfData = 0;

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
        console.log('EntityStackedAreaChartView: ' +
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
    _formatstackedAreaDataD3: function() {
      this.stackedAreaData = [];

      for (var i = 0; i < this.numStacksOfData; i++) {
        this.stackedAreaData.push({
          key: this.stackDataOptions[i].desc,
          values: []
        });
      }

      if (this.stackedAreaData && this.stackedAreaData.length) {
        _.each(this.graphData, function(dataArray, ii) {
          _.each(this.graphData[ii], function(val) {
            this.stackedAreaData[ii].values.push({
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
      var retVal = this.stackedAreaData && this.stackedAreaData.length;

      if (retVal) {
        _.each(this.stackedAreaData, function(data) {
          retVal = retVal && data.values && data.values.length;
        });
      }

      return retVal;
    },

    // Set the tick format of X and Y axis
    setAxisFormat: function(chart) {
    // To be overidden in the child class
    },

    setStrokeColor: function() {
      if (this.options.entityType) {
        var strokeColors =
          StyleDescriptor.getChartStrokeColor(this.options.entityType);
        for (var i = 0; i < strokeColors.length; i++) {
          this._svg.select('.nv-stackedAreaChart path.nv-area-' + i)
            .style('stroke', strokeColors[i]);
        }
      }
    },

    // @override
    // Renderthe chart.
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
          nv.addGraph(() => {
            var chart = nv.models.stackedAreaChart()
              .useInteractiveGuideline(true)
              .x(function(d) { return d.x; })
              .y(function(d) { return d.y; })
              .showControls(false)
              .showLegend(false)
              .clipEdge(false)
              .transitionDuration(0)
              .margin(CHART_MARGINS);

            // Check base function for the value else do not render
            // custom value formatter
            chart.customToolTip(this.hasCustomValueFormatter);
            // Interactive guidelines does not allow modifying tooltip
            // using tooltip function, to explicitly override the tooltip
            // we need to call value formatter belonging to
            // interactiveLayer.tooltip.valueFormatter
            if (this.hasCustomValueFormatter) {
              const fnGetTooltip = _.bind(this.getTooltipValue, this);
              chart.interactiveLayer.tooltip.valueFormatter(fnGetTooltip);
            }
            chart.xAxis
              .showMaxMin(false);

            _this.setAxisFormat(chart);
            _this._svg
              .datum(_this.stackedAreaData)
              .call(chart);

            _this.setStrokeColor();

            // Setting the gravity to custom avoids tooltip to get
            // cut off and remain within chart container
            chart.interactiveLayer.tooltip.gravity('custom');
            nv.utils.windowResize(chart.update);
            return chart;
          });
      } else if (this.stackedAreaData && !this.stackedAreaData.length) {
        // Show No Data
        this.showNoData();
      }
    },

    // @override
    // Helper function to generate the tooltip content for the bar when
    // hovered
    getTooltipValue: function() {
      return true;
    }
  });

  // Returns the EntityStackedAreaChartView Class
  return EntityStackedAreaChartView;
});
