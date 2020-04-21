//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// MaliciousActivityChartView used for malicious user chart.
//
define([
  // Core
  'views/graph/EntityBulletChartView'],
function(
  // Core
  EntityBulletChartView) {

  'use strict';

  var MaliciousActivityChartView = EntityBulletChartView.extend({

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
        ranges: [0,0, this.options.totalValue],
        measures: [this.options.data.log_count],
        markers: [],
        barColor: [this.barColors]
      }
      gData.push(data);
      return gData;
    }
  });

  // Return MaliciousActivityChartView
  return MaliciousActivityChartView;
});
