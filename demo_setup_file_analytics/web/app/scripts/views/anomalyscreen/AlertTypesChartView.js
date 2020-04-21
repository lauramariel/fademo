//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AlertTypesChartView used for alert type chart.
//
define([
  // Core
  'views/graph/EntityDonutChartView',
  // Models
  'models/alertdashboard/AlertDashboardModel',
  // Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/StyleDescriptor',
  'utils/AppUtil',
  'utils/TimeUtil'],
function(
  // Core
  EntityDonutChartView,
  // Models
  AlertDashboardModel,
  // References of utils
  AppConstants,
  CommonTemplates,
  StyleDescriptor,
  AppUtil,
  TimeUtil) {

  'use strict';

  var anomalyTypeTableTempl = _.template('<div class="graph-table">' +
    '<div class="table-col1 table-col"><%= icon %></div>' +
    '<div class="table-col2 table-col"><%= name %></div>' +
    '<div class="table-col3 table-col"><b><%= dataSize %></b></div>' +
    '<div class="table-col4 table-col"><%= percent %>%</div></div>');

  const DONUT_RATIO = 0.9,
        CHART_HEIGHT = 250,
        CHART_MARGIN = {
          top: 20,
          left: 15,
          right: 15 };

  var AlertTypesChartView = EntityDonutChartView.extend({
    // The model for this view.
    model: null,

    // The count of response records.
    count: 0,

    // The total number of anomalies.
    totalValue: 0,

    // Is the chart rendered in a widget?
    isWidget: true,

    // @override
    initialize: function(options) {
      this.model = new AlertDashboardModel();
      // Create the fetch url
      this.model.getURL(AppConstants.ANOMALY_DETAIL_TYPES.ALERT_TYPES,
        options.startTimeInMs, options.endTimeInMs);
      options.donutRatio = DONUT_RATIO;
      options.chartHeight = CHART_HEIGHT;
      options.chartMargin = CHART_MARGIN;
      EntityDonutChartView.prototype.initialize.call(this, options);
    },

    // @override
    // Gets the data for the file modification chart.
    fetchGraphData: function(duration, startTime, endTime) {
      // If Filterduration is not defined
      // setting it to default value that is 30 (last 30 days)
      let selectedDuration = duration ||
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS;

      // Calculate the start and end time as per midnight.
      if (!startTime && !endTime) {
        endTime = TimeUtil.getCurrentTime();
        startTime = TimeUtil.getRoundedStartTime(selectedDuration, endTime);
      }

      // Create the fetch url
      this.model.getURL(AppConstants.ANOMALY_DETAIL_TYPES.ALERT_TYPES,
        startTime, endTime);

      EntityDonutChartView.prototype.fetchGraphData.call(this, selectedDuration,
        startTime, endTime);
    },

    // Updates the column content
    // @param $el - jQuery DOM element containing the table columns.
    // @param content - the HTML content in string format
    // @param columnNumber - the column selected
    updateColumnContent: function($el, content, columnNumber) {
      var $col = $el.find('.n-vertical-content-' + columnNumber);
      $col.html(content);
    },

    // @override
    onActionSuccess: function() {
      let tableTempl = this.createTableTemplate();
      this.updateColumnContent(this.$el.parents('.n-content'),
        tableTempl, 2);
    },

    // @private
    // Create the template of the table to be
    // displayed next to the chart.
    createTableTemplate: function() {
      let data = this.model.attributes,
          temp = '';
      let percent = 0, _this = this;
      // Template to create the legend table.
      _.each(data, function(elem) {
        if (!Number.isNaN(elem.doc_count / _this.totalValue)) {
          percent = Math.round((elem.doc_count / _this.totalValue) * 100);
        }

        temp += anomalyTypeTableTempl({
          icon: CommonTemplates.OPERATION_CIRCLE({
            backgroundColor:
              StyleDescriptor.ALERT_TYPE_COLORS[elem.key],
            border: StyleDescriptor.ALERT_TYPE_COLORS[elem.key]
          }),
          name: AppConstants.ANOMALY_OPERATIONS[elem.key],
          dataSize: elem.doc_count,
          percent: percent
        });
      });

      return temp;
    },

    // @override
    getGraphDataForModel: function() {
      this.totalValue = this.getTotalValue();

      // As API returns key value pair in case of 0 records also,
      // it shows the chart with 0 as the value in the center which
      // is not expected. So adding this hack to show No Data
      // Available in such a case.
      if (!this.totalValue) {
        this.showNoData();
        return;
      }

      let gData = [];

      // Doing this to maintain consistency between
      // the operation icons color in the table and the
      // chart.
      if (this.chartColors.length) {
        this.chartColors = [];
      }

      if (this.model) {
        let models = this.model.attributes;

        _.each(models, function(model, i) {
          let data = {};
          data.name = model.key;
          if (model.doc_count < 0) {
            data.count = 0;
          } else {
            data.count = model.doc_count;
          }
          gData.push(data);

          this.chartColors.push(
            StyleDescriptor.ALERT_TYPE_COLORS[model.key]);
        }, this);
      }

      return gData;
    },

    // @override
    // Get the data value for the tooltip.
    getDataValueForTooltip: function(x) {
      // Return the value wihout decimal point.
      return parseInt(x, 10);
    },

    // @private
    // return totla sum of all values in model
    getTotalValue: function() {
      let data = this.model.attributes,
          totalValue = 0;
      _.each(data, function(elem) {
        totalValue += elem.doc_count;
      });

      return totalValue;
    },

    // @override
    // Return text to display in the middle of donut chart.
    getMiddleText: function() {
      let retArr = [];
      retArr.push('Total Anomalies');
      // Format the number into its proper value. E.g. 10000 = 10k.
      retArr.push(AppUtil.formatSize(this.totalValue));
      return retArr;
    }
  });

  // Return AlertTypesChartView
  return AlertTypesChartView;
});
