//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TopViolatingUserChartView is used for showing top users
// violating policy.
//
define([
  // Core
  'views/graph/EntityBulletChartView'],
function(
  // Core
  EntityBulletChartView) {

  'use strict';

  var TopViolatingUserChartView = EntityBulletChartView.extend({
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
        measures: [this.options.data.doc_count],
        markers: [],
        barColor: [this.barColors]
      };
      gData.push(data);
      return gData;
    }
  });

  // Return TopViolatingUserChartView
  return TopViolatingUserChartView;
});
