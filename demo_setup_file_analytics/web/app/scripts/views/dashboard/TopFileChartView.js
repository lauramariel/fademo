//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// TopFileChartView used for file age chart.
//
define([
  // Core
  'views/graph/EntityBulletChartView'],
function(
  // Core
  EntityBulletChartView) {

  'use strict';

  var TopFileChartView = EntityBulletChartView.extend({

    // @override
    fetchGraphData: function() {
      this.updateChartData();
    },

    // @override
    getGraphDataForModel: function() {
      let gData = [];

      let data = {
        title: '',
        subtitle: '',
        ranges: [0, 0, this.options.totalValue],
        measures: [this.options.data.log_count],
        markers: [],
        barColor: [this.barColors]
      };
      gData.push(data);
      return gData;
    }
  });

  // Return TopFileChartView
  return TopFileChartView;
});
