//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileSizeChartView used for file size chart.
//
define([
  // Core
  'views/graph/EntityBulletChartView'],
function(
  // Core
  EntityBulletChartView) {

  'use strict';

  var FileSizeChartView = EntityBulletChartView.extend({

    // @override
    fetchGraphData: function() {
      this.updateChartData();
    },

    // @override
    getGraphDataForModel: function() {
      let gData = [], _this = this;

      let data = {
        title: '',
        subtitle: '',
        ranges: [0, 0, this.options.totalValue],
        measures: [this.options.data],
        markers: [],
        barColor: [this.barColors]
      };
      gData.push(data);
      return gData;
    }
  });

  // Return FileSizeChartView
  return FileSizeChartView;
});
