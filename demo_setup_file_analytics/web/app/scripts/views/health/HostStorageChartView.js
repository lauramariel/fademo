//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// HostStorageChartView used for file age chart.
//
define([
  // Core
  'views/graph/EntityBulletChartView',
  // Utils
  'utils/StyleDescriptor',
  'utils/StatsUtil',
  'utils/AppConstants',
  // Models/Collections
  'models/health/HealthModel'],
function(
  // Core
  EntityBulletChartView,
  // Utils
  StyleDescriptor,
  StatsUtil,
  AppConstants,
  // Models/Collections
  HealthModel) {

  'use strict';

  // Chart margin to render the graph
  var CHART_MARGINS = { top: 40, left: 20, right: 20 };

  var HostStorageChartView = EntityBulletChartView.extend({

    // Is the chart rendered in a widget?
    isWidget: true,

    // @override
    modelEvents: {
      'change   model': 'updateChartData'
    },

    // Overridden to avoid fetch
    fetchGraphData: function() {
      this.parent = this.options.parent;
      this.model = this.parent.healthModel;
      // Update the widget when data in model changes
      this.delegateModelEvents();

      // Update chart data
      this.updateChartData();
    },

    // Overridden to do initial processing like hide loading and show
    // no data available
    updateChartData: function(options) {
      // Merge the default options with new values on filter change
      if (options) {
        this.options = _.extend(this.options, options);
      }

      // Clear previous widget display content
      if (!this.parent.clearWidget(this.options.classs, this.model, this)) {
        return;
      }

      EntityBulletChartView.prototype.updateChartData.apply(this, arguments);
    },

    // Overridden to construct the data for to the chart
    getGraphDataForModel: function() {
      let gData = [];

      // Update the components label
      const hostsStats = this.model.get(HealthModel.DP.HOST_STATS),
            hostsVGUsage = (hostsStats &&
              _.isNumber(hostsStats[HealthModel.DP.HOST_VG_USAGE])) ?
              hostsStats[HealthModel.DP.HOST_VG_USAGE] :
              AppConstants.NOT_AVAILABLE,
            hostTotalDisk = (hostsStats &&
              _.isNumber(hostsStats[HealthModel.DP.HOST_TOTAL_DISK])) ?
              hostsStats[HealthModel.DP.HOST_TOTAL_DISK] :
              AppConstants.NOT_AVAILABLE,
            hostVGTotalSize = (hostsStats &&
              _.isNumber(hostsStats[HealthModel.DP.HOST_TOTAL_VG_SIZE])) ?
              hostsStats[HealthModel.DP.HOST_TOTAL_VG_SIZE] :
              AppConstants.NOT_AVAILABLE;

      // Default values
      let selectedEntityVal = hostsVGUsage,
          selectedEntityTotal = hostVGTotalSize;

      // Incase filter is set/changed
      if (this.options && this.options.selectedEntity) {
        selectedEntityVal = hostsStats[this.options.selectedEntity];
        selectedEntityTotal =
          (this.options.selectedEntity === HealthModel.DP.HOST_DISK_USAGE) ?
            hostTotalDisk : hostVGTotalSize;
      }

      // Set title based on selected entity
      const title = ((selectedEntityVal !== AppConstants.NOT_AVAILABLE) ?
        StatsUtil.formatBytes(selectedEntityVal) : selectedEntityVal) +
        ' used space of total ' +
        ((selectedEntityTotal !== AppConstants.NOT_AVAILABLE) ?
          StatsUtil.formatBytes(selectedEntityTotal) : selectedEntityTotal);

      // Any of the required info is not available return []
      // to show no data available
      if (selectedEntityTotal === AppConstants.NOT_AVAILABLE ||
        selectedEntityVal === AppConstants.NOT_AVAILABLE) {
        return gData;
      }

      // Construct graph data
      const data = {
        title: title,
        subtitle: '',
        ranges: [0, 0, selectedEntityTotal],
        measures: [selectedEntityVal],
        markers: [],
        barColor: [StyleDescriptor.HEALTH_STATUS_COLORS.GREEN]
      };
      gData.push(data);

      return gData;
    },

    // Overridden to align to the health page design
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
            .transition().duration(0)
            .call(chart);

          d3.selectAll('rect.nv-measure').attr('y', 0).attr('height', 18)
            .style('fill', function(d) { return d.barColor; });
          d3.selectAll('rect.nv-rangeMax').attr('y', 0).attr('height', 18)
            .style('fill', function(d) { return '#F2F4F6'; });

          // Update the style for the title to put it on top of the bar
          d3.select('.hostStorage .nv-titles g').attr('text-anchor', 'start')
            .attr('transform', 'translate(0,-6)');

          return chart;
        });
      } else if (this.graphData && !this.graphData.length) {
        // Show No Data
        this.showNoData();
      }
    }
  });

  // Return HostStorageChartView
  return HostStorageChartView;
});
