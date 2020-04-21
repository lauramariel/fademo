//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// TopUserChartView used to show the top users.
//
define([
  // Core
  'views/graph/EntityBulletChartView'],
function(
  // Core
  EntityBulletChartView) {

  'use strict';

  var TopUserChartView = EntityBulletChartView.extend({

    // @override
    fetchGraphData: function() {
      this.updateChartData();
    },

    // @override
    getGraphDataForModel: function() {
      let gData = [];

      let data = {
        title: "",
        subtitle: "",
        ranges: [0,0,this.options.totalValue],
        measures: [this.options.data.log_count],
        markers: [],
        barColor: [this.barColors]
      }
      gData.push(data);
      return gData;
    }
  });

  // Return TopUserChartView
  return TopUserChartView;
});
