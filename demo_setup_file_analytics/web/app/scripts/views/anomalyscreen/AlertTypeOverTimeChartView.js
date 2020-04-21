//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AlertTypeOverTimeChartView used to show the alert
// trend chart.
//
define([
  // Core
  'views/graph/EntityBarChartView',
  // Models
  'models/alertdashboard/AlertDashboardModel',
  // Templates
  'views/base/charts/ChartTemplates',
  // Utils
  'utils/TimeUtil',
  'utils/AppUtil',
  'utils/StyleDescriptor',
  'utils/CommonTemplates',
  'utils/AppConstants'],
function(
  // Core
  EntityBarChartView,
  // Models
  AlertDashboardModel,
  // Templates
  ChartTemplates,
  // Utils
  TimeUtil,
  AppUtil,
  StyleDescriptor,
  CommonTemplates,
  AppConstants) {
  'use strict';

  // Chart margin for rendering the graph
  const CHART_MARGINS = {
    top   : 5,
    left  : 55,
    bottom: 20 };

  var AlertTypeOverTimeChartView = EntityBarChartView.extend({
    model: null,

    interval: AppConstants.WEEKS,

    // Is the chart rendered in a widget?
    isWidget: true,

    // @override
    initialize: function(options) {
      // Creating the instance of the alert dashboard model.
      this.model = new AlertDashboardModel();
      EntityBarChartView.prototype.initialize.call(this, options);
    },

    // Render the chart template
    render: function() {
      // Set the contents of the $el
      this.$el.html(
        ChartTemplates.ENTITY_CHART_WITHOUT_HEADER({
          chartWidthP : '100'
        })
      );

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
    // Gets the data for the file modification chart.
    fetchGraphData: function(filterDuration, startTime, endTime) {
      // If Filterduration is not defined
      // setting it to default value that is 30 (last 30 days)
      let selectedDuration = filterDuration ||
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS;

      // Calculate the start and end time as per midnight.
      if (!startTime && !endTime) {
        endTime = TimeUtil.getCurrentTime();
        startTime = TimeUtil.getRoundedStartTime(selectedDuration, endTime);
      }

      // Show loading
      this.showLoading();

      // Create the fetch url
      this.createUrl(selectedDuration, startTime, endTime);

      EntityBarChartView.prototype.fetchGraphData.call(this,
        selectedDuration);
    },

    // @override
    // Actions to be done after the fetch is successful.
    onActionSuccess: function() {
      // Add the legends in the lower section of the template
      this.$el.parents('.alertOverTime')
        .find('.n-column-content-2').html(
          CommonTemplates.LEGEND_TEMPLATE({
            legendClass: 'alert-legends'
          }));

      // Add legends below the graph
      this.addGraphTableLegend(
        StyleDescriptor.DASHBOARD_TABLES[AppConstants.SHOW_ALERT_OVER_TIME],
        'alert-legends', ['File Operation Anomaly']);
    },

    // @private
    // Function to create the fetch URL
    // @param filterDuration - interval.
    // @param startTime - start time.
    // @param endTime - end time.
    createUrl: function(filterDuration, startTime, endTime) {
      let intervalDuration = TimeUtil.getInterval(filterDuration)
        || AppConstants.STATS_PER_DAY;

      if (filterDuration === '1d') {
        this.interval = AppConstants.HOURS;
      } else if (filterDuration === '7d') {
        this.interval = AppConstants.DAYS;
      } else if (filterDuration === '30d') {
        this.interval = AppConstants.WEEKS;
        intervalDuration = AppConstants.STATS_PER_DAY;
      } else {
        this.interval = AppConstants.MONTHS;
      }

      this.model.getURL(AppConstants.ANOMALY_DETAIL_TYPES.TIME_SERIES,
        startTime, endTime, 0, intervalDuration);
    },

    // @override
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

      for (let i = 0; i < this.graphData.length; i++) {
        this.barData.push({
          key   : AppConstants.ALERT_MAIN_TYPES.FILE_OPERATION_ANOMALY,
          values: []
        });
      }

      _.each(this.graphData, function(dataArray, j) {
        _.each(dataArray, function(dataObj, i) {
          this.barData[j].values.push(
            { x       : dataObj.name,
              y       : dataObj.count || 0,
              tooltip : [dataObj.name, dataObj.count || 0]
            });
          // Get the max Y value for the chart
          if (j === 0) {
            this.maxYValue =
              Math.max(dataObj.count || 0, this.maxYValue);
          }
        }, this);
      }, this);
    },

    // @override
    // Pre-process the data before converting it further.
    getGraphDataForModel: function() {
      let gData = [], fileOperationAnomalyGdata = [];
      if (this.model) {
        let fileOperationAnomalydata = {},
            models = this.model.attributes;

        // Incase 8 keys are returned from api for last 7 days,
        // for last 7 days current day is skipped always as anomaly detection
        // happens in every 24hrs so for most practical purpose it will
        // mostly be 0, so we dont show it.
        // Incase 31 keys are returned from api for last 30 days,
        // current day is skipped.
        // Incase incorrect number of keys are returned from api for last
        // x months/year, skip the oldest
        if (this.interval === AppConstants.DAYS &&
          Object.keys(models).length > 7) {
          delete models[7];
        } else if (this.interval === AppConstants.MONTHS &&
            (Object.keys(models).length >
            AppUtil.getDataRetentionPeriod(this.options.fsId))) {
          delete models[0];
        } else if (this.interval === AppConstants.WEEKS &&
          Object.keys(models).length > 30) {
          delete models[30];
        }

        _.each(models, function(model, i) {
          fileOperationAnomalydata = {};
          fileOperationAnomalydata.name = model.key;
          fileOperationAnomalydata.count = model.doc_count;
          fileOperationAnomalyGdata.push(fileOperationAnomalydata);
        }, this);

        gData.push(fileOperationAnomalyGdata);

        return gData;
      }
    },

    // @override
    // Render the chart.
    renderChart: function() {
      // Get the DOM element where your chart is placed
      let chartContainer = this.getChartContainer();

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
      if (this.barData && this.barData[0] && this.barData[0].values.length) {
        // Show the chart element
        this.showChart();

        this.graph =
          /* global nv */
          nv.addGraph(() => {
            var chart = nv.models.multiBarChart()
              .transitionDuration(0)
              .reduceXTicks(false)
              .showControls(false)
              .showLegend(false)
              .margin(CHART_MARGINS);

            chart.yAxis.tickFormat(d3.format(',f'));
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
              chart.groupSpacing(0.6);
            }

            chart.xAxis.tickFormat(function(d) {
              return TimeUtil.convertDate(d, _this.interval);
            });
            // Custom colors for the bars
            chart.color(this.barColors);
            this.maxYValue += parseInt((this.maxYValue < 30) ? 5 :
              this.maxYValue / 10, 10);
            chart.forceY([0, this.maxYValue ? this.maxYValue : 1]);

            this._svg
              .datum(this.barData)
              .call(chart);

            // Hides the line parallel to y axis across each bar.
            d3.selectAll('.nv-x g.tick').each(function(xAxis) {
              let axis = d3.select(this);
              axis.select('line').style('opacity', 0);
            });

            nv.utils.windowResize(chart.update);
            return chart;
          });
      } else if (this.barData && (!this.barData.length || !this.barData[0] ||
        !this.barData[0].values.length)) {
        // In case of resize, renderchart is called again.
        // In case of error scenario, data is not found on resize.
        // So 'No data available' is appended along with error template,
        // which is not the expected behaviour, so checking for this.barData
        // as it wont be initialized in case of error nd hence nothing will
        // be appended to the rror template.
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
          dataTitle: TimeUtil.convertDate(e.point.tooltip[0], this.interval),
          dataValue: e.point.tooltip[1]
        });
      }
      return tooltip;
    }
  });

  // Return AlertTypeOverTimeChartView
  return AlertTypeOverTimeChartView;
});
