//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileTypeOverTimeChartView used for file type over the time chart.
//
define([
  // Core
  'views/graph/EntityStackedAreaChartView',
  // Models
  'models/dashboard/FileTypeGraphModel',
  // Utils
  'utils/StatsUtil',
  'utils/TimeUtil',
  'utils/AppUtil',
  'utils/AppConstants',
  // Components
  'components/Components',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // Core
  EntityStackedAreaChartView,
  // Models
  FileTypeGraphModel,
  // Utils
  StatsUtil,
  TimeUtil,
  AppUtil,
  AppConstants,
  // Components
  Components,
  // Templates
  ChartTemplates) {
  'use strict';

  var FileTypeChartView = EntityStackedAreaChartView.extend({
    // this.model is an instance of the entity types collection.
    model: null,

    // Needs explicit value formatter function
    hasCustomValueFormatter: true,

    // Unit of data.
    units: 0,

    duration: null,

    graphStackData: [],

    events: {
      'click .graphbtnDropdownAction' : 'handleFilterDropdownActionClick'
    },

    // @override
    initialize: function(options) {
      this.metricType = options.entityType;
      this.fileTypeModel = options.model;
      this.model = new FileTypeGraphModel();
      this.model.getFileTypeUrl();
      EntityStackedAreaChartView.prototype.initialize.call(this,
        options);
    },

    // @private
    // Render the graph in the container.
    render: function() {
      // Render the chart.
      this.$el.html(ChartTemplates.ENTITY_CHART_WITH_BORDER_AND_FILTER({
        title       : this.title,
        chartId     : this.options.chartId,
        chartClass  : 'stackedAreaChart',
        chartWidthP : '100',
        no_data     : AppConstants.NO_DATA_AVAILABLE
      }));

      // Dropdown data
      let dropDownOptions = AppUtil.constructDropDownData('graph', false,
        this.options.fsId);

      let filterDropDown = Components.dropdown({
        classes   : 'action-dropdown pull-right fileTrendDropdown',
        text      : AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_30_DAYS,
        options   : dropDownOptions,
        rightAlign: true
      });

      // Append the dropdown.
      this.getDOM('.filter-data').html(filterDropDown);

      // Fetching the graph data as soon as the
      // chart structure is rendered hence using
      // setTimeout. Introducing delay for rendering those
      // charts that dont get data from model but instead data
      // is passed to them explicitly. In case of using model
      // to get data for rendering charts, API fetching does
      // the functionality of setTimeout i.e. introducing delay.
      const _this = this;
      setTimeout(function() {
        _this.fetchGraphData();
      }, 300);

      return this;
    },

    // @private
    // Gets the data for the file modification chart.
    fetchGraphData: function(filterDuration, startTime, endTime) {
      // If filterDuration is not defined
      // setting it to default value that is 30 days (last 30 days)
      let selectedDuration = filterDuration ||
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS;
      this.duration = selectedDuration;
      if (!startTime && !endTime) {
        endTime = new Date().getTime();
        startTime = TimeUtil.getStartTime(selectedDuration, endTime);
      }

      // Show loading
      this.showLoading();

      // Create the fetch url
      this.createUrl(selectedDuration, startTime, endTime);

      // Get data to be displayed on graph
      var _this = this;
      if (this.model) {
        this.model.save(this.model.payload, {
          success: function(data) {
            // Render chart template
            _this.updateChartData(filterDuration);
          },
          error: function(xhr) {
            _this.onDataError(xhr);
          }
        });
      }
    },

    // @private
    // Function to create the fetch URL
    createUrl: function(filterDuration, startTime, endTime) {
      let statsFor = '';

      if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_7_DAYS) {
        this.interval = AppConstants.DAYS;
        statsFor = AppConstants.STATS_PER_DAY;
      } else if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS) {
        this.interval = AppConstants.WEEKS;
        statsFor = AppConstants.STATS_PER_WEEK;
      } else {
        this.interval = AppConstants.MONTHS;
        statsFor = AppConstants.STATS_PER_MONTH;
      }

      this.model.getFileTypeUrl();

      // set payload to be sent for fetching graph data
      const time = {
        'interval': statsFor,
        'start_time_in_ms': startTime,
        'end_time_in_ms': endTime
      };

      let categories = [];
      _.each(this.fileTypeModel.attributes, function(category, index) {
        if (typeof category.name !== 'undefined' && category.count) {
          categories.push(category);
        }
      });

      categories.sort(function(category1, category2) {
        return category2.count - category1.count;
      });

      // Fetch top5 categories only while displaying it on Chart
      const top5 = categories.slice(0, 5).map(function(category) {
        return category.name;
      });

      this.model.setRequestPayload(top5, time);
    },

    // @override
    // Updates the chart data, gets the data in the format required and
    // renders it.
    updateChartData: function(filterDuration) {
      // Check if chart is valid for update
      if (!this.isValidForChartUpdate(filterDuration)) {
        return;
      }

      // Now that we have our data, lets get it in the format we want for
      // rendering the line chart as expected by nvd3
      this.stackedAreaData = this._formatstackedAreaDataD3();

      // Re-render the chart
      this.renderChart();
    },

    // @override
    // Set the x and y axis tick format
    // @param chart - the chart object.
    setAxisFormat: function(chart) {
      let _this = this;
      chart.xAxis
        .tickValues(
          this.stackedAreaData[0].values.map(function(d) { return d.x; }))
        .tickFormat(function(d) {
          return TimeUtil.convertDate(d, _this.interval);
        });

      chart.yAxis.tickFormat(function(d) {
        return Math.trunc(d) + _this.unit;
      });
    },

    // @private
    // Aggregate data according to the categories of file type.
    // @param categoryArray - data to perform aggregation on.
    aggregateData: function(data) {
      let finalData = [];
      // update data to display metric in title case
      _.each(data, function(category, index) {
        if (typeof category.metric !== 'undefined') {
          category.metric = AppUtil.getCategoryDisplayName(category.metric);
          finalData.push(category);
        }
      });

      this.graphStackData = this.convertSize(finalData);
    },

    // @private
    // Converts the data to appropriate units.
    convertSize: function(data) {
      let tempArr = [], retArr = {};
      _.each(data, function(val, i) {
        _.each(data[i].values, function(sizeVal, key) {
          tempArr.push(sizeVal.size);
        });
      });

      this.unit = StatsUtil.determineDataSizeUnit(tempArr);

      _.each(data, function(value, key) {
        retArr[key] = {};
        retArr[key].metric = value.metric;
        _.each(value.values, function(v, k) {
          // Do not roundoff the value, to get the smallest unit of
          // entity in chart
          v.size = StatsUtil.unitsConversion(v.size, this.unit, false);
        }, this);
        retArr[key].values = value.values;
      }, this);

      return retArr;
    },

    // @override
    // Format data as required by the chart.
    _formatstackedAreaDataD3: function() {
      let gData = [], tempData = {}, _this = this, textArr = [], colorArr = [];
      this.strokeColor = [];
      this.aggregateData(this.model.attributes);

      _.each(this.graphStackData, function(data, j) {
        let valArr = [];
        _.each(data.values, function(val, i) {
          valArr.push({
            x: val.epoch_time,
            y: val.size
          });
        });

        tempData = {
          values: valArr,
          key: data.metric,
          color: _this.stackColors[j]
        };

        textArr.push(data.metric);
        colorArr.push(_this.stackColors[j]);
        gData.push(tempData);
      });

      // Incase 8 keys are returned from api for last 7 days,
      // Incase 7 keys are returned from api for last 30 days,
      // Incase 13 keys are returned from api for last 1 year,
      // skip the oldest
      if ((this.interval === AppConstants.DAYS && (gData.length &&
        gData[0].values.length > 7)) ||
        (this.interval === AppConstants.WEEKS && (gData.length &&
        gData[0].values.length > 6)) ||
        ((this.interval === AppConstants.MONTHS) && (gData.length &&
        gData[0].values.length > parseInt(this.duration, 10)))
      ) {
        _.each(gData, function(rec) {
          rec.values.shift();
        });
      }

      // Add the legends at the bottom of the chart.
      this.addGraphTableLegend(colorArr, 'legend-wrap', textArr);
      return gData;
    },

    // @private
    // Handles the click on a filter in the table.
    handleFilterDropdownActionClick: function(e) {
      let elem = $(e.currentTarget);
      let numberOfDays =
        TimeUtil.setDuration(elem.attr(AppConstants.NAV_ACTION),
          this.options.fsId);
      this.duration = elem.attr(AppConstants.NAV_ACTION);
      this.handleChartFilter(numberOfDays);
    },

    // @private
    // Handle the capacity chart filter.
    handleChartFilter: function(duration) {
      let noOfDays = duration ||
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_1_YEAR;
      let currentTime = new Date().getTime(),
          startTime = TimeUtil.getStartTime(noOfDays, currentTime);
      // Update graph data based on the selected value
      this.fetchGraphData(duration, startTime, currentTime);
    },

    // Update chart tooltip to show smaller units
    getTooltipValue: function(size) {
      size *= StatsUtil.STORAGE_UOM[this.unit];
      return StatsUtil.formatBytes(size);
    },

    // @override
    // Dont need to any stroke color
    setStrokeColor: function() {
      // Need not to do anything
    }
  });

  // Return FileTypeChartView
  return FileTypeChartView;
});
