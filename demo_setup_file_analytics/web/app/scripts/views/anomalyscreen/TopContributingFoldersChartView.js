//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TopContributingFoldersChart is used for showing top folders
// contributing for anomaly.
//
define([
  // Core
  'views/graph/EntityBulletChartView'],
function(
  // Core
  EntityBulletChartView) {

  'use strict';

  var TopContributingFoldersChart = EntityBulletChartView.extend({
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

  // Return TopContributingFoldersChart
  return TopContributingFoldersChart;
});
