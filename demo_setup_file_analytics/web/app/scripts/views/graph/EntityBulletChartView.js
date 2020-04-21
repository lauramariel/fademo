//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// EntityBulletChartView is a donut pie chart representation for different
// comparable data attributes for a couple of same type entities.
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
  // References of utils
  StatsUtil,
  StyleDescriptor) {

  'use strict';

  // Chart margin to render the graph
  var CHART_MARGINS = {top: 0, left: 0, right: 0};

  // Extending the BaseChartView
  var EntityBulletChartView = BaseChartView.extend({

    // Properties
    //-----------

    // For i18n
    name: 'EntityBulletChartView',

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
        var barOptions = StatsUtil.getMetricOptions(options.entityType);
      }

      if (barOptions) {
        this.barDataOptions = barOptions.barDataOptions;
      }

      // Update the chart's bar colors
      this.barColors = StyleDescriptor.getChartColor(options.entityType);

      this.barData = {
        title: this.title || '',
        subtitle: '',
        barColor: this.barColors
      };
    },

    // @override
    // Updates the chart data, gets the data in the format required and
    // renders it.
    updateChartData: function() {
      // Check if chart is valid for update
      // if (!this.isValidForChartUpdate(this.model)) {
      //   return;
      // }

      // Update the graph data
      // First, get graphData from all the models in the
      // collection based on what attributes need to be plotted as specified
      // in the bar options.
      // Next, format this graph data in the format required by D3.
      this.graphData = this.getGraphDataForModel();

      // Now that we have our data, lets get it in the format we want for
      // rendering the bar chart as expected by nvd3
      // this._formatBarDataD3(this.graphData);

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
          gData.push(data);
        }, this);
      }

      return gData;
    },

    _formatBarDataD3: function() {
      // If there is no data, just return instead of trying to get the bar
      // data. Then the renderChart will just display no data available.
      if (!this.graphData || !this.graphData.length) {
        return;
      }

      this.barData = {
        title: '',
        subtitle: '',
        ranges: [0,0,this.options.totalValue],
        measures: [this.options.data.log_count],
        markers: [],
        barColor: [this.barColor]
      };
    },

    // @override
    renderChart: function() {
      // Get the DOM element where your chart is placed
      let chartContainer = this.getChartContainer();
      let _this = this;
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
        nv.addGraph(function() {
          var chart = nv.models.bulletChart()
            .margin(CHART_MARGINS)
            .tooltips(false)
            .height(90);

          _this._svg
            .datum(_this.graphData[0])
            .transition().duration(1000)
            .call(chart);

          d3.selectAll('rect.nv-measure').attr('y', 0).attr('height', 18)
            .style('fill', function(d) { return d.barColor; });
          d3.selectAll('rect.nv-rangeMax').attr('y', 0).attr('height', 18)
            .style('fill', function(d) {
              return StyleDescriptor.DEFAULT_BAR_BG_COLOR;
            });

          return chart;
        });
      } else if (this.graphData && !this.graphData.length) {
        // Show No Data
        this.showNoData();
      }
    },

    // Destroy this instance
    destroy: function() {

      // Remove all callbacks
      this.model.off();

      // Call the base class cleanup
      BaseChartView.prototype.destroy.apply(this, arguments);
    }

  });

  // Returns the EntityBulletChartView Class
  return EntityBulletChartView;
});
