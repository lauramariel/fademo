//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// EntityDonutChartView is a donut pie chart representation for different
// comparable data attributes for a couple of same type entities.
//
define([
  // Core
  'views/base/BaseChartView',
  // Utils
  'utils/StyleDescriptor',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // References of core
  BaseChartView,
  // References of utils
  StyleDescriptor,
  // Templates
  ChartTemplates) {

  'use strict';

  // Chart margin to render the graph
  var CHART_MARGINS = {
    top: -13,
    bottom: 30 };

  // The height and the hole size of the chart respectively.
  var CHART_HEIGHT = 150,
      DONUT_RATIO = 0.7;

  // Extending the BaseChartView
  var EntityDonutChartView = BaseChartView.extend({

    // Properties
    //-----------

    // For i18n
    name: 'EntityDonutChartView',

    // NOTE about el:
    // The el property should be set by the parent class.

    // NOTE about className:
    // It uses the default value from the BaseChartView.

    // NOTE about model:
    // this.model is an instance of the entity types collection.
    model: null,

    // Is the chart rendered in a widet?
    isWidget: false,

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initializeStatsProperties: function(options) {
      // Update the chart's bar colors
      this.chartColors = StyleDescriptor.getChartColor(options.entityType);
      // Customise the chart
      if (options) {
        options.chartHeight = options.chartHeight || CHART_HEIGHT;
        options.chartMargin = options.chartMargin || CHART_MARGINS;
        options.donutRatio = options.donutRatio || DONUT_RATIO;
      }
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
      this._formatBarDataD3();

      // Re-render the chart
      this.renderChart();
    },

    // @private
    // Pre-process the data before converting it further.
    getGraphDataForModel: function() {
      let gData = [];
      if (this.model) {
        let models = this.model.attributes;

        _.each(models, function(model, i) {
          let data = {};
          data.name = model.name;
          if (model.count < 0) {
            data.count = 0;
          } else {
            data.count = model.size;
          }
          gData.push(data);
          this.chartColors.push(
            StyleDescriptor.DORMANT_DATA_COLORS[model.name]);
        }, this);
      }

      return gData;
    },

    _formatBarDataD3: function() {
      return this.graphData;
    },

    // @override
    // Return text to display in the middle of donut chart.
    // By default, return empty string.
    getMiddleText: function() {
      // To be overriden in the child class.
      return '';
    },

    // @override
    renderChart: function() {
      // Get the DOM element where your chart is placed
      let chartContainer = this.getChartContainer();
      let _this = this;

      let totalValue = this.getMiddleText();

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
      if (this.graphData && this.graphData.length) {
        // Show the chart element
        this.showChart();
        let fnGetTooltip = _.bind(this.getTooltip, this);
        nv.addGraph(function() {
          var chart = nv.models.pieChart()
            .x(function(d) { return d.name })
            .y(function(d) { return d.count })
            .showLabels(false) // Display pie labels
            .donut(true) // Turn on Donut mode. Makes pie chart look tasty!
            .donutRatio(_this.options.donutRatio) // Configure hole size.
            .showLegend(false)
            .tooltipContent(fnGetTooltip)
            .margin(_this.options.chartMargin)
            .height(_this.options.chartHeight)
            ;

          // Add custom colors to the pie chart.
          chart.color(_this.chartColors);

          _this._svg
            .datum(_this.graphData)
            .transition().duration(350)
            .call(chart);

          _this._svg.selectAll('.nv-pieLabels text').remove();

          _this._svg.selectAll('.nv-pieLabels')
            .append('text')
            .attr('dy', '-0.2em')
            .attr('text-anchor', 'middle')
            .text(function(d) {
              return (totalValue[0]);
            });

          _this._svg.selectAll('.nv-pieLabels')
            .append('text')
            .attr('class', 'labelText')
            .attr('dy', '1em')
            .attr('text-anchor', 'middle')
            .text(function(d) {
              return (totalValue[1]);
            });

          nv.utils.windowResize(chart.update);
          return chart;
        });
      } else if (this.graphData && !this.graphData.length) {
        // Show No Data
        this.showNoData();
      }
    },

    // @override
    // Get the data value for the tooltip.
    getDataValueForTooltip: function(x) {
      // To be overriden in the child class, in case need to format x.
      return x;
    },

    // Helper function to generate the tooltip content for the bar when
    // hovered
    getTooltip: function(key, x, y, e, graph) {
      let tooltip = '', title = '';

      if (x && y) {
        tooltip = ChartTemplates.TOOL_TIP_TEMPLTE({
          entityName: title,
          dataTitle: key,
          dataValue: this.getDataValueForTooltip(x)
        });
      }
      return tooltip;
    },

    // Destroy this instance
    destroy: function() {

      // Remove all callbacks
      this.model.off();

      // Call the base class cleanup
      BaseChartView.prototype.destroy.apply(this, arguments);
    }

  });

  // Returns the EntityDonutChartView Class
  return EntityDonutChartView;
});
