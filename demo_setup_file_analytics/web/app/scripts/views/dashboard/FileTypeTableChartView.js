//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileTypeTableChartView used to show bullet chart for file type.
//
define([
  // Core
  'views/graph/EntityBulletChartView',
  // Utils
  'utils/StyleDescriptor'],
function(
  // Core
  EntityBulletChartView,
  // References of utils
  StyleDescriptor) {
  'use strict';

  var FileTypeTableChartView = EntityBulletChartView.extend({
    // Default color
    defaultColor: StyleDescriptor.DEFAULT_FILE_TYPE_COLORS,

    // @override
    initialize: function(options) {
      this.colorIndex = options.colorIndex;
      EntityBulletChartView.prototype.initialize.call(this, options);
    },

    // @override
    fetchGraphData: function() {
      this.updateChartData();
    },

    // @override
    getGraphDataForModel: function() {
      let gData = [],
          barColor = this.barColors[this.colorIndex] || this.defaultColor;

      let data = {
        title: '',
        subtitle: '',
        ranges: [0, 0, this.options.totalValue],
        measures: [this.options.data.size],
        markers: [],
        barColor: barColor
      };

      gData.push(data);
      return gData;
    }
  });

  // Return FileTypeTableChartView
  return FileTypeTableChartView;
});
