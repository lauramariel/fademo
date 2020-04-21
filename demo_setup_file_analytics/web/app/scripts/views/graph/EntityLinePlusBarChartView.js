//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// EntityLinePlusBarChartView is a bar chart along with line chart
// representation for different comparable data attributes
//
define([
  // Core
  'views/base/BaseChartView',
  // Utils
  'utils/StatsUtil',
  'utils/StyleDescriptor',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // References of core
  BaseChartView,
  // References of utils
  StatsUtil,
  StyleDescriptor,
  // Templates
  ChartTemplates) {

  'use strict';

  // Chart margin for rendering the graph
  const CHART_MARGINS = {
    top   : 30,
    right : 60,
    bottom: 50,
    left  : 75
  };

  // Extending the BaseChartView
  var EntityLinePlusBarChartView = BaseChartView.extend({

    // Properties
    //-----------

    // For i18n
    name: 'EntityLinePlusBarChartView',

    // NOTE about el:
    // The el property should be set by the parent class.

    // NOTE about className:
    // It uses the default value from the BaseChartView.

    // NOTE about model:
    // this.model is an instance of the entity types collection.
    model: null,

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initializeStatsProperties: function(options) {
      // Update the title
      this.title = StatsUtil.getMetricLabel(options.entityType);

      // Gets the options to be shown as legends and on the chart
      if (options.entityType) {
        var lineBarOptions = StatsUtil.getMetricOptions(options.entityType);
      }

      if (lineBarOptions) {
        this.lineBarDataOptions = lineBarOptions.lineBarDataOptions;
        this.numBarsInGroup = this.lineBarDataOptions ?
          this.lineBarDataOptions.length : 0;
        this.units = lineBarOptions.units;
      }

      // Update the chart's bar colors
      this.lineBarColors = StyleDescriptor.getChartColor(options.entityType);
    },

    // @override
    // Updates the chart data, gets the data in the format required and
    // renders it.
    updateChartData: function() {
      // Update the graph data
      // First, get graphData from all the models in the
      // collection based on what attributes need to be plotted as specified
      // in the bar options.
      // Next, format this graph data in the format required by D3.
      this.graphData = this.getGraphDataForModel();

      // Now that we have our data, lets get it in the format we want for
      // rendering the bar chart as expected by nvd3
      this._formatBarDataD3(this.graphData);

      // Re-render the chart
      this.renderChart();
    },

    // @private
    // Pre-process the data before converting it further.
    getGraphDataForModel: function() {
      // override in child file for pre-processing of data
    },

    // we need to convert it in the following format:
    // [
    //   {
    //     'key': 'key1',
    //     'bar': true,
    //     'values': [
    //       [1431993600000, 31.6882],
    //       [1431993600000, -76.1706]
    //       ...
    //     ]
    //   }, {
    //     'key': 'key2',
    //     'values': [
    //       [1431993600000, 31.6882],
    //       [1432684800000, 54.6283]
    //       ...
    //     ]
    //   }
    // ]
    //
    _formatBarDataD3: function() {
      this.lineBarData = [];
      this.maxYValue = 0;
      this.minYValue = 0;
      let tooltipData = '', netChange = 0;

      // If there is no data, just return instead of trying to get the bar
      // data. Then the renderChart will just display no data available.
      if (!this.graphData || !this.graphData.length) {
        return;
      }

      for (let i = 0; i < this.graphData.length; i++) {
        let legendData = { title  : '',
          desc   : ''
        };
        legendData.title = this.graphData[i].name;
        legendData.desc = this.graphData[i].name;
        this.lineBarDataOptions.push(legendData);
        this.lineBarData.push({
          key   : this.lineBarDataOptions[i].title,
          values: []
        });
      }

      _.each(this.graphData, function(dataObj, i) {
        _.each(dataObj, function(data, j) {
          if (i === 0) {
            // If customised tooltip values are needed, they are sent as
            // tooltipCount.
            tooltipData = [data.name, data.tooltipCount || data.count,
              this.graphData[1][j].tooltipCount || this.graphData[1][j].count];
            this.lineBarData[i].values.push(
              {
                x: data.name,
                y: data.count,
                tooltip: tooltipData
              }
            );
            this.lineBarData[i].values.push(
              {
                x: data.name,
                y: -this.graphData[1][j].count,
                tooltip: tooltipData
              }
            );

            // Get the max Y value for the chart
            this.maxYValue = Math.max(data.count, this.maxYValue);
            this.lineBarData[i].bar = true;
          } else if (i === 1) {
            tooltipData = [data.name, data.count, this.graphData[0][j].count];
            netChange = this.graphData[0][j].count - data.count;
            this.lineBarData[i].values.push(
              {
                x: data.name,
                y: netChange,
                tooltip: tooltipData
              }
            );

            // Get the min Y value for the chart
            this.minYValue = Math.max(data.count, this.minYValue);
          }
        }, this);
      }, this);
    },

    // @override
    renderChart: function() {
      // Get the DOM element where your chart is placed
      // let chartContainer = document.getElementById(this.options.chartId);
      let chartContainer = this.getChartContainer();

      this.lineBarColors =
        StyleDescriptor.getChartColor(this.options.entityType);

      // Remove previous if already exists
      if (this._svg) {
        this._svg.remove();
        this._svg = null;
        this.graph = null;
      }

      let _this = this;

      this._svg = d3.select(chartContainer)
        .append('svg')
        .attr('class', 'chart');

      // Check if there's data...
      if (this.lineBarData && this.lineBarData.length) {
        // Show the chart element
        this.showChart();

        this.graph =
          /* global nv */
          nv.addGraph(() => {
            var chart = nv.models.linePlusBarChart()
              .margin(CHART_MARGINS)
              .showLegend(false)
              .x(function(d,i) { return i })
              .y(function(d) { return d.y })
              .color(this.lineBarColors);

            // Align bars and line to same y axis value.
            chart.bars.forceY([-this.minYValue, this.maxYValue]);
            chart.lines.forceY([-this.minYValue, this.maxYValue]);

            // Custom tooltips
            let fnGetTooltip = _.bind(this.getTooltip, this);
            chart.tooltipContent(fnGetTooltip)

            this._svg
              .datum(this.lineBarData)
              .transition().duration(500)
              .call(chart);

            nv.utils.windowResize(function() {
              chart.update();
              _this.modifyChart();
            });
            return chart;
          });
      } else if (this.lineBarData && !this.lineBarData.length) {
        // Show No Data
        this.showNoData();
      }
    },

    // Helper function to generate the tooltip content for the bar when
    // hovered
    getTooltip: function(key, x, y, e, graph) {
      let tooltip = '', title = '';
      if (e && e.point && e.point.tooltip &&
          (e.point.tooltip.length === 2) && y) {
        tooltip = ChartTemplates.TOOL_TIP_TEMPLTE({
          entityName: title,
          dataTitle: e.point.tooltip[0],
          dataValue: e.point.tooltip[1]
        });
      }
      return tooltip;
    },

    // Modify the chart after resize.
    modifyChart: function() {
      // To be overridden in child class
    },

    // Destroy this instance
    destroy: function() {

      // Remove all callbacks
      this.model.off();

      // Call the base class cleanup
      BaseChartView.prototype.destroy.apply(this, arguments);
    }
  });

  // Returns the EntityLinePlusBarChartView Class
  return EntityLinePlusBarChartView;
});
