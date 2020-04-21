//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// EntityHorizontalStackedBarChartView is a horizontal bar chart
// representation for different
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

  // Chart margin for rendering the graph
  const CHART_MARGINS = {
    top   : 60,
    left  : 40,
    bottom: 30
  };

  // Extending the BaseChartView
  var EntityHorizontalStackedBarChartView = BaseChartView.extend({

    // Properties
    //-----------

    // For i18n
    name: 'EntityHorizontalStackedBarChartView',

    // NOTE about el:
    // The el property should be set by the parent class.

    // NOTE about className:
    // It uses the default value from the BaseChartView.

    // NOTE about model:
    // this.model is an instance of the entity types collection.
    model: null,

    // Push colors based on file type
    chartColors: [],

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
        this.numBarsInGroup = this.barDataOptions ?
          this.barDataOptions.length : 0;
        this.units = barOptions.units;
        this.nameAttr = barOptions.nameAttr;
        this.sortAttr = barOptions.sortAttr;
      }
      // Update the chart's bar colors
      this.chartColors = StyleDescriptor.getChartColor(options.entityType);
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
      let gData = [];
      if (this.model) {
        let models = this.model.attributes;

        _.each(models, function(model, i) {
          let data = {};
          data.name = model.name;
          data.count = model.size;
          gData.push(data);
        }, this);
      }

      return gData;
    },

    // Format data as required by the chart.
    _formatBarDataD3: function() {
      this.barData = [];

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
        this.barDataOptions.push(legendData);
        this.barData.push({
          key   : this.barDataOptions[i].title,
          values: []
        });
      }

      _.each(this.graphData, function(dataObj, i) {
        this.barData[i].values.push(
          { x       : 0,
            y       : dataObj.count,
            tooltip : [dataObj.name, dataObj.count]
          });

      }, this);
    },

    // @override
    // Render the chart.
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
      if (this.barData && this.barData.length) {
        // Show the chart element
        this.showChart();
        let fnGetTooltip = _.bind(this.getTooltip, this);
        let fnGetToolTipPosition = _.bind(this.tooltipShow, this);
        nv.addGraph(function() {
          var chart = nv.models.multiBarHorizontalChart()
            .margin(CHART_MARGINS)
            .showYAxis(false)
            .showXAxis(false)
            .showLegend(false) // to hide legend
            .showControls(false) // to hide controls
            .showBarLabels(true) // to hide controls
            .tooltipContent(fnGetTooltip)
            .showValues(true);

          chart.showTooltip(fnGetToolTipPosition);

          chart.multibar.stacked(true);
          chart.height(60);
          // Add custom colors to the pie chart.
          chart.color(_this.chartColors);

          _this._svg
            .datum(_this.barData)
            .transition().duration(0)
            .call(chart);

          d3.selectAll('.nv-zeroLine').attr('style', 'display:none');
          d3.select('.nv-multiBarHorizontalChart').attr('transform', 'translate(30,60)');

          // Display text inside the bar
          setTimeout(function() {
            d3.selectAll('.nv-multibarHorizontal .nv-group')
              .each(function(group) {
                var g = d3.select(this);

                // Remove previous labels if there is any
                g.selectAll('text').remove();
                g.selectAll('.nv-bar').each(function(bar) {
                  var b = d3.select(this);
                  var barWidth = b.selectAll('rect').attr('width');
                  var barHeight = b.selectAll('rect').attr('height');

                  let barTextLength = bar.tooltip[0].length;
                  let totalConsumedWidth = (barWidth / 9) - 2;
                  let displayText = bar.tooltip[0];

                  // Check if there is enough space for the word to be displayed without trimming
                  if (barTextLength > totalConsumedWidth) {
                    displayText = $.trim(bar.tooltip[0]
                      .substring(0, totalConsumedWidth));
                    displayText = displayText && displayText.length > 0
                      ? displayText + '...' : displayText;

                  }

                  g.append('text')
                  // Transforms shift the origin point then the x and y of the bar
                  // is altered by this transform. In order to align the labels
                  // we need to apply this transform to those.
                    .attr('transform', b.attr('transform'))
                    .text(function() {
                      // No decimals format and eliminate zero values
                      if (bar.y === 0) {
                        return;
                      }
                      return displayText;
                    })
                    .attr('y', function() {
                      // Center label vertically
                      var height = this.getBBox().height;
                      // return parseFloat(barHeight) - 8; // 5 is the label's margin from the top of bar
                      return parseFloat(barHeight) / 2 + height / 4;
                    })
                    .attr('x', function() {
                      return 10;
                    })
                    .style('stroke', 'white')
                    .attr('class', 'bar-values');
                });
              });
          }, 500);

          return chart;
        });
      } else if (this.barData && !this.barData.length) {
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

  // Returns the EntityHorizontalStackedBarChartView Class
  return EntityHorizontalStackedBarChartView;
});
