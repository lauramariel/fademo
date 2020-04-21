//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileOperationChartView enables the user to view the
// the file operation chart.
// with operation filter checkboxes and time duration filter
// Shows the user the desired results
define([
  // Views
  'views/graph/EntitySimpleLineChartView',
  // Utils
  'utils/AppConstants',
  'utils/TimeUtil',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // Views
  EntitySimpleLineChartView,
  // Utils
  AppConstants,
  TimeUtil,
  // Templates
  ChartTemplates) {

  'use strict';

  var CHART_MARGINS = {top: 0, left: 5, right: 5, bottom: 10};

  var FileOperationChartView = EntitySimpleLineChartView.extend({

    // @override
    initialize: function(options) {
      this.metricType = options.operations;
      EntitySimpleLineChartView.prototype.initialize.call(this, options);
      if (options.defaultDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_24_HRS) {
        this.interval = AppConstants.HOURS;
      } else if (options.defaultDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_1_YEAR) {
        this.interval = AppConstants.MONTHS;
      }
    },

    // @override
    // Gets the data for the file operation chart
    fetchGraphData: function() {
      this.updateChartData();
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
              .showLegend(false)
              .showYAxis(false)
              .showXAxis(false)
              .margin(CHART_MARGINS)
              .transitionDuration(350);

            chart.height(30);

            // Custom tooltips
            let fnGetTooltip = _.bind(_this.getTooltip, _this);
            chart.tooltipContent(fnGetTooltip);

            _this._svg
              .datum(_this.lineChartData)
              .call(chart);

            d3.selectAll('.nv-lineChart rect').attr('style', 'opacity: 0 !important');

            // Setting the gravity to custom avoids tooltip to get
            // cut off and remain within chart container
            // chart.interactiveLayer.tooltip.gravity('custom');
            nv.utils.windowResize(chart.update);
            return chart;
          });
      } else {
        // Show No Data
        this.showNoData();
      }
    },

    getTooltip: function(key, x, y, e, graph) {
      let tooltip = '', title = '';
      if (e && e.point) {
        tooltip = ChartTemplates.TOOL_TIP_TEMPLTE({
          entityName: title,
          dataTitle: TimeUtil.convertDate(e.point.x, this.interval),
          dataValue: e.point.y
        });
      }
      return tooltip;
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
      this.lineChartData = this._formatLineChartDataD3();

      // Now that we have our data, lets get it in the format we want for
      // rendering the bar chart as expected by nvd3
      // this._formatLineChartDataD3();

      // Re-render the chart
      this.renderChart();
    },

    _formatLineChartDataD3: function() {
      let gData = [], valArr = [];
      _.each(this.options.data.values, function(val) {
        valArr.push({x: val['epoch_time'], y: val['count']});
      });

      // Incase 25 keys are returned from api for last 24 hours,
      // Incase 8 keys are returned from api for last 7 days,
      // Incase 31 keys are returned from api for last 30 days,
      // Incase 13 keys are returned from api for last 1 year,
      // , skip the oldest
      // LAST_24_HRS : 24,
      // LAST_7_DAYS : 7,
      // LAST_30_DAYS: 6,
      // LAST_1_YEAR : 12
      let duration = this.options.defaultDuration;
      if (valArr.length &&
        (((!duration.includes('h') && !duration.includes('d')) &&
        (valArr.length > parseInt(this.options.defaultDuration, 10))) ||
        ((duration.includes('h') || duration.includes('d')) &&
        $.inArray(valArr.length, [24, 7, 30]) < 0))) {
        valArr.shift();
      }

      let data = {
        values: valArr,
        key: this.options.data.metric,
        color: '#ff7f0e'
      };

      gData.push(data);
      return gData;
    }
  });

  return FileOperationChartView;
});
