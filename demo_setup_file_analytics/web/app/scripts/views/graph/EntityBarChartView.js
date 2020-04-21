//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// EntityBarChartView is a grouped bar chart representation for different
// comparable data attributes for a couple of same type entities.
//
define([
  // Core
  'views/base/BaseChartView',
  // Utils
  'utils/AppConstants',
  'utils/StatsUtil',
  'utils/AppUtil',
  'utils/StyleDescriptor',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // References of core
  BaseChartView,
  // References of utils
  AppConstants,
  StatsUtil,
  AppUtil,
  StyleDescriptor,
  // Templates
  ChartTemplates) {

  'use strict';

  // constants for specifying the space between each bar group and the
  // max number of groups that we want to display resp.
  const BARS_GROUP_SPACING = 0.6;

  // Chart margin for rendering the graph
  const CHART_MARGINS = {
    top   : 50,
    left  : 55,
    bottom: 65
  };

  // Extending the BaseChartView
  var EntityBarChartView = BaseChartView.extend({

    // Properties
    //-----------

    // For i18n
    name: 'EntityBarChartView',

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
      if (options.entityType ===
            AppConstants.ACCESS_PATTERN_FILE_AUDIT_HISTORY ||
          options.entityType ===
            AppConstants.ACCESS_PATTERN_USER_AUDIT_HISTORY) {
        const titleTemplate =
          _.template(StatsUtil.getMetricLabel(options.entityType), {
            auditTarget: options.userInput
          });
        this.title = titleTemplate;
      } else {
        this.title = StatsUtil.getMetricLabel(options.entityType);
      }

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
      this.barColors = StyleDescriptor.getChartColor(options.entityType);
    },

    // @override
    render: function() {
      // Set the contents of the $el
      this.$el.html(ChartTemplates.ENTITY_MULTIDATA_CHART_WITH_BORDER({
        title       : this.options.title,
        chartId     : this.options.chartId,
        chartWidthP : '100',
        loading     : AppConstants.LOADING,
        no_data     : AppConstants.NO_DATA_AVAILABLE
      }));

      // Fetching the graph data as soon as the
      // chart structure is rendered hence using
      // setTimeout. Introducing delay for rendering those
      // charts that dont get data from model but instead data
      // is passed to them explicitly. In case of using model
      // to get data for rendering charts, API fetching does
      // the functionality of setTimeout i.e. introducing delay.
      const _this = this;
      setTimeout(function() {
        _this.fetchGraphData();
      }, 300);

      return this;
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
      this._formatBarDataD3(this.graphData);

      // Re-render the chart
      this.renderChart();
    },

    // @private
    // Pre-process the data before converting it further.
    getGraphDataForModel: function() {
      let gData = [];

      if (this.options.entityType ===
            AppConstants.ACCESS_PATTERN_FILE_AUDIT_HISTORY ||
            this.options.entityType ===
            AppConstants.ACCESS_PATTERN_USER_AUDIT_HISTORY) {
        this.barColors = [];
      }

      if (this.model) {
        let models = this.model.attributes;
        _.each(models, function(model, i) {
          let data = {};
          if (this.options.entityType !==
            AppConstants.ACCESS_PATTERN_FILE_AUDIT_HISTORY &&
            this.options.entityType !==
            AppConstants.ACCESS_PATTERN_USER_AUDIT_HISTORY) {
            data.name = model.name;
            if (data.count < 0) {
              data.count = 0;
            } else {
              data.count = model.count;
            }
            gData.push(data);
          } else if (AppConstants.OPERATION[model.name]) {
            data.name = AppConstants.OPERATION[model.name];
            if (data.count < 0) {
              data.count = 0;
            } else {
              data.count = model.count;
            }
            gData.push(data);
            this.barColors.push(
              StyleDescriptor.OPERATIONS_COLORS[model.name]);
          }

        }, this);
      }

      return gData;
    },

    // graphData coming to us is of the format:
    // [
    //  { 'name': 'share1',
    //    'count':'100' // attr specified in getMetricOptions
    //  },
    //  { 'name': 'share2',
    //    'count':'400'
    //  },
    //  { 'name': 'share3',
    //    'count':'50'
    //  }
    //  ]
    //
    //  and we need to convert it in the following format:
    //
    //  [
    //    {
    //      values: [{x:share1, y:100}, {x:share2, y:400}...]
    //    },
    //    {
    //      values: [{x:share1, y:25}, {x:share2, y:105}...]
    //    }
    //  ]
    //
    // The bars are displayed by grouping together values[0], values[1] and
    // so on of the objects. This array will have as many objects as the
    // number of bars in a group. Most common case is 2 bars in a group
    _formatBarDataD3: function() {
      this.barData = [];
      this.maxYValue = 0;

      // If there is no data, just return instead of trying to get the bar
      // data. Then the renderChart will just display no data available.
      if (!this.graphData || !this.graphData.length) {
        return;
      }

      // Determine stats units
      this.determineStatsUnit(this.graphData);

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
          { x       : dataObj.name,
            y       : dataObj.count,
            tooltip : [dataObj.name, dataObj.count]
          });

        // Get the max Y value for the chart
        this.maxYValue =
          Math.max(dataObj.count, this.maxYValue);
      }, this);
    },

    // @private
    // Converts the data to appropriate units.
    determineStatsUnit: function(data) {
      let tempArr = [];
      _.each(data, function(val, i) {
        tempArr.push(val.count);
      });

      this.units = StatsUtil.determineDataCountUnit(tempArr);
    },

    // @override
    renderChart: function() {
      // Get the DOM element where your chart is placed
      let chartContainer = this.getChartContainer();

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

        let _this = this;

        this.graph =
          /* global nv */
          nv.addGraph(() => {
            var chart = nv.models.multiBarChart()
              .transitionDuration(0)
              .reduceXTicks(false)
              .showControls(false)
              .showLegend(false)
              .stacked(true)
              .margin(CHART_MARGINS);

            chart.yAxis
              .tickFormat(function(num) {
                let yAxis = num;
                if (_this.options.entityType ===
                  AppConstants.SHOW_FILE_DISTRIBUTION_BY_AGE) {
                  yAxis = num + ' ' + _this.units;
                } else {
                  yAxis = StatsUtil.unitsConversionCount(num, _this.units) +
                    _this.units;
                }
                return yAxis;
              });

            // Custom tooltips
            let fnGetTooltip = _.bind(this.getTooltip, this);
            chart.tooltip(fnGetTooltip);

            // Fixing the bar width
            if (this.barData.length === 1) {
              chart.groupSpacing(0.85);
            } else if (this.barData.length === 2) {
              chart.groupSpacing(0.8);
            } else if (this.barData.length === 3) {
              chart.groupSpacing(0.7);
            } else {
              chart.groupSpacing(BARS_GROUP_SPACING);
            }

            // Custom colors for the bars
            chart.color(this.barColors);
            this.maxYValue += parseInt((this.maxYValue < 30) ? 5 :
              this.maxYValue / 10, 10);
            chart.forceY([0, this.maxYValue ? this.maxYValue : 1]);

            // Custom lengend shape to rectangle
            chart.legend.rectMode(true);

            // Set margin for legend
            chart.legend.margin({
              top: 2,
              right: 0,
              left: 0,
              bottom: 30
            });

            this._svg
              .datum(this.barData)
              .call(chart);

            nv.utils.windowResize(function() {
              chart.update();
              _this.modifyChart();
            });
            // Adding values and percentage on the top of bars
            this.updateTicker(this.barData, this._svg, this);

            // Breaks the x axis ticks into two lines.
            this.modifyChart();
            return chart;
          });
      } else if (this.barData && !this.barData.length) {
        // Show No Data
        this.showNoData();
      }
    },

    // Modify the chart on resize
    modifyChart: function() {
      // Breaks the x axis ticks into two lines.
      d3.selectAll('.nv-x g.tick').each(function(xAxis) {
        let axis = d3.select(this);
        let el = axis.select('text');
        if (el[0][0]) {
          let d = el.text();
          if (d) {
            let words = d.split(' ');
            el.text('');

            for (let i = 0; i < words.length; i++) {
              let tspan = el.append('tspan').text(words[i]);
              if (i > 0) {
                tspan.attr('x', 0).attr('dy', '15');
              }
            }
          }
        }
      });
    },

    // Helper function to get the values and percentage on the top of bars
    // in the bar chart
    // @param data (required) - data of bar chart
    // @param svg (required) - svg element of the current bar chart
    updateTicker: function(data, svg, _this) {
      // Setting a timout to wait for the rendering of the graph to finish
      setTimeout(function() {
        // Getting the total of data required to calculate the percentage
        let total = 0;
        for (let i in data) {
          total += data[i].values[0].y;
        }

        svg.selectAll('.nv-multibar .nv-group').each(function(group) {
          let g = d3.select(this);
          g.selectAll('text').remove();
          g.selectAll('.nv-bar').each(function(bar) {
            let b = d3.select(this);
            let barWidth = b.attr('width');

            g.append('text')
              .attr('transform', b.attr('transform'))
              .text(function() {
                return _this.getBarText(bar, total);
              })
              .attr('y', function() {
                let newY = b.attr('y') - 5;
                return newY;
              })
              .attr('x', function() {
                let width = this.getBBox().width;
                return parseFloat(b.attr('x')) + ((parseFloat(barWidth) / 2) -
            (width / 2));
              })
              .attr('class', 'bar-values');
          });
        });
      }, 500);
    },

    getBarText: function(bar, total) {
      let percentStr;
      if (total === 0) {
        percentStr = '0%)';
      } else {
        percentStr =
        Math.round((bar.y / total) * 100).toString().concat('%)');
      }
      const valueStr = AppUtil.formatSize(bar.y).toString().concat(' (');
      return valueStr.concat(percentStr);
    },

    // Helper function to generate the tooltip content for the bar when
    // hovered
    getTooltip: function(key, x, y, e, graph) {
      let tooltip = '', title = AppConstants.TOOLTIP_HEADINGS[
        AppConstants.SHOW_FILE_DISTRIBUTION_BY_TYPE];
      if (e && e.point && e.point.tooltip &&
          (e.point.tooltip.length === 2) && y) {
        tooltip = ChartTemplates.TOOL_TIP_TEMPLTE({
          entityName: title,
          dataTitle: e.point.tooltip[0],
          dataValue: AppUtil.formatSize(e.point.tooltip[1])
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

  // Returns the EntityBarChartView Class
  return EntityBarChartView;
});
