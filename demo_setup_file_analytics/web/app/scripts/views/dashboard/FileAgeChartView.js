//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileAgeChartView used for file age chart.
//
define([
  // Core
  'views/graph/EntityDonutChartView',
  // Models
  'models/dashboard/FileAgeGraphModel',
  // Utils
  'utils/AppConstants',
  'utils/StatsUtil',
  'utils/CommonTemplates',
  'utils/StyleDescriptor',
  'utils/AntiscrollUtil'],
function(
  // Core
  EntityDonutChartView,
  // Models
  FileAgeGraphModel,
  // References of utils
  AppConstants,
  StatsUtil,
  CommonTemplates,
  StyleDescriptor,
  AntiscrollUtil) {

  'use strict';

  var fileAgeTableTempl = _.template('<div class="graph-table">' +
    '<div class="table-col1 table-col"><%= icon %></div>' +
    '<div class="table-col2 table-col"><%= name %></div>' +
    '<div class="table-col3 table-col"><b><%= dataSize %>' +
    ' <%= unit %></b></div>' +
    '<div class="table-col4 table-col"><%= percent %>%</div></div>');

  var FileAgeChartView = EntityDonutChartView.extend({
    model: null,

    count: 0,

    // Total amount of data.
    totalValue: 0,

    // Unit of data.
    units: 0,

    // Is the chart rendered in a widget?
    isWidget: true,

    // @override
    initialize: function(options) {
      this.model = new FileAgeGraphModel();
      this.model.getURL();
      EntityDonutChartView.prototype.initialize.call(this, options);
    },

    // @override
    onActionSuccess: function() {
      let tableTempl = this.createTableTemplate();
      this.updateColumnContent(this.$el.parents('.n-content'),
        tableTempl, 2, true);
    },

    // @private
    // Create the template of the table to be
    // displayed next to the chart.
    createTableTemplate: function() {
      let data = this.model.attributes, temp = '';
      let _this = this;

      // Template to create the legend table.
      _.each(data, function(elem) {
        let dataSize = 0, percent = 0;
        if (!Number.isNaN(elem.actual_size / _this.totalValue)) {
          percent = Math.round((elem.actual_size / _this.totalValue) * 100);
        }
        let units = StatsUtil.determineDataSizeUnit([elem.actual_size]);
        dataSize = StatsUtil.unitsConversion(elem.actual_size, units);

        temp += fileAgeTableTempl({
          icon: CommonTemplates.OPERATION_CIRCLE({
            backgroundColor:
              StyleDescriptor.DORMANT_DATA_COLORS[elem.name],
            border: StyleDescriptor.DORMANT_DATA_COLORS[elem.name]
          }),
          name: AppConstants.DORMANT_DATA[elem.name],
          dataSize: dataSize,
          unit: units,
          percent: percent
        });
      });

      return temp;
    },

    // @private
    // Get the data points for rendering the chart and table.
    getDataPoints: function() {
      let data = this.model.attributes;

      _.each(data, function(elem, i) {
        if (i < Object.keys(data).length - 1) {
          elem.actual_size = elem.size - data[++i].size;
        } else {
          elem.actual_size = elem.size;
        }
      });
    },

    // Updates the column content
    // @param $el - jQuery DOM element containing the table columns.
    // @param content - the HTML content in string format
    // @param columnNumber - the column selected
    // @param applyAntiScroll - boolean to apply antiscroll
    updateColumnContent: function($el,content,columnNumber,applyAntiScroll) {
      var $col = $el.find('.n-column-content-' + columnNumber);
      // Check for antiScroll
      if (applyAntiScroll) {
        // Check if antiscroll template has been added
        if (!$col.find('.n-content-inner').length) {
          $col.html(CommonTemplates.ANTISCROLL);
        }

        // Add the centerbox
        let contentNew = CommonTemplates.CONTENT_COLUMN_CELL_CENTERBOX({
          content : content
        });

        $col.find('.n-content-inner').html(contentNew);
        AntiscrollUtil.applyAntiScroll($el.find('.antiscroll-wrap'));
      } else {
        $col.html(content);
      }
    },

    // @override
    getGraphDataForModel: function() {
      this.getDataPoints();
      this.totalValue = this.getTotalValue();
      this.units = this.getSizeUnit();
      let gData = [];
      let data = this.model.attributes;
      if (!this.count && this.model) {
        let models = this.model.attributes;
        _.each(models, function(model, i) {
          let data = {};
          data.name = AppConstants.DORMANT_DATA[model.name];
          if (model.count < 0) {
            data.count = 0;
          } else {
            data.count = StatsUtil.unitsConversion(model.actual_size,
              this.units);
          }

          gData.push(data);

          this.chartColors.push(
            StyleDescriptor.DORMANT_DATA_COLORS[model.name]);
        }, this);
      }

      return gData;
    },

    // Gets the unit for the graph depending upon the data
    getSizeUnit: function() {
      let values = [];
      _.each(this.model.attributes, function(model, i) {
        values.push(model.actual_size);
      });
      return StatsUtil.determineDataSizeUnit(values);
    },

    // @override
    // Get the data value for the tooltip.
    getDataValueForTooltip: function(x) {
      return x + ' ' + this.units;
    },

    // @private
    // return totla sum of all values in model
    getTotalValue: function() {
      let data = this.model.attributes,
          totalValue = 0;
      _.each(data, function(elem) {
        totalValue += elem.actual_size;
      });

      return totalValue;
    },

    // @override
    // Return text to display in the middle of donut chart.
    getMiddleText: function() {
      let retArr = [];
      let units = StatsUtil.determineDataSizeUnit([this.totalValue]);
      retArr.push('Total Data');
      retArr.push(StatsUtil.unitsConversion(this.totalValue,
        units) + ' ' + units);
      return retArr;
    }
  });

  // Return FileAgeChartView
  return FileAgeChartView;
});
