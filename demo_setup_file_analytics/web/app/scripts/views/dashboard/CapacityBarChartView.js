//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// CapacityChartView used for capacity fluctuation chart.
//
define([
  // Core
  'views/graph/EntityLinePlusBarChartView',
  // Models
  'models/dashboard/CapacityFluctuationGraphModel',
  // Templates
  'views/base/charts/ChartTemplates',
  // Managers
  'managers/PopupManager',
  // Utils
  'utils/AppConstants',
  'utils/TimeUtil',
  'utils/StyleDescriptor',
  'utils/CommonTemplates',
  'utils/StatsUtil'],
function(
  // Core
  EntityLinePlusBarChartView,
  // Models
  CapacityFluctuationGraphModel,
  // Templates
  ChartTemplates,
  // Managers
  PopupManager,
  // Utils
  AppConstants,
  TimeUtil,
  StyleDescriptor,
  CommonTemplates,
  StatsUtil) {

  // Chart margin for rendering the graph
  const CHART_MARGINS = { top: 5,
    right: 20,
    bottom: 30,
    left: 70
  };

  var CapacityChartView = EntityLinePlusBarChartView.extend({
    model: null,

    interval: '',

    endTime: 0,

    capacity: 0,

    flag: false,

    // Is the chart rendered in a widget?
    isWidget: true,

    // @override
    initialize: function(options) {
      // Creating the instance of the file audit graph model
      this.model = new CapacityFluctuationGraphModel();

      EntityLinePlusBarChartView.prototype.initialize.call(this, options);
    },

    // @private
    // Gets the data for the file modification chart.
    fetchGraphData: function(filterDuration, startTime, endTime, durationUnit) {
      // Hide the error template if it exists.
      this.hideError();
      // If filterDuration is not defined
      // setting it to default value that is 7 (last 7 days)
      let selectedDuration = filterDuration ||
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_7_DAYS;
      this.selectedFilter = selectedDuration;

      // Get start and end time as per midnight
      if (!startTime && !endTime) {
        endTime = TimeUtil.getCurrentTime(false);
        startTime = TimeUtil.getStartTime(selectedDuration, endTime,
          AppConstants.SHOW_CAPACITY_FLUCTUATION);
      }

      this.endTime = endTime;

      // Create the fetch url
      this.createUrl(selectedDuration, startTime, endTime);

      EntityLinePlusBarChartView.prototype.fetchGraphData.call(this,
        filterDuration);
    },

    // @override
    // Actions to be done after the fetch is successful.
    onActionSuccess: function() {
      // Add the legends in the lower section of the template
      this.$el.parents('.capacity-trends')
        .find('.n-column-content-2').html(
          CommonTemplates.LEGEND_TEMPLATE({
            legendClass: 'capacity-legends'
          }));
      // Add legends below the table
      this.addGraphTableLegend(
        StyleDescriptor.DASHBOARD_TABLES.show_capacity_fluctuation_legends,
        'capacity-legends',
        ['Capacity added', 'Capacity removed', 'Net change']);
    },

    // @private
    // Function to create the fetch URL
    createUrl: function(filterDuration, startTime, endTime) {
      const statsFor = TimeUtil.getInterval(filterDuration);
      if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_7_DAYS) {
        this.interval = AppConstants.DAYS;
      } else if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS) {
        this.interval = AppConstants.WEEKS;
      } else if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_1_YEAR) {
        this.interval = AppConstants.MONTHS;
      } else if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_2_YEARS) {
        this.interval = AppConstants.TWO_YEARS;
      } else if (filterDuration ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_3_YEARS) {
        this.interval = AppConstants.THREE_YEARS;
      }

      this.model.getURL(statsFor, startTime, endTime, false);
    },

    // @override
    // Pre-process the data before converting it further.
    getGraphDataForModel: function() {
      let gData = [], addGData = [], deleteGData = [], _this = this;
      if (this.model) {
        this.units = this.getSizeUnit();
        let dataAdded = {}, dataRemoved = {},
            models = this.model.attributes;

        // Set the flag as false when this function is called again,
        // as this flag is maintained just to calculate the total
        // capacity by adding the provided reference capacity just once.
        this.flag = false;

        _.each(models, function(model, i) {
          _this.getReferenceCapacity(model);
          dataAdded = {}, dataRemoved = {};
          dataAdded.name = model.key;
          dataAdded.to = model.to;
          dataAdded.from = model.from;
          dataAdded.count =
            StatsUtil.unitsConversion(model.added || 0, this.units);
          dataAdded.tooltipCount = model.added;
          dataAdded.capacity = this.capacity;
          addGData.push(dataAdded);

          dataRemoved.name = dataAdded.name;
          dataRemoved.to = model.to;
          dataRemoved.from = model.from;
          dataRemoved.count =
            StatsUtil.unitsConversion(model.removed || 0, this.units);
          dataRemoved.tooltipCount = model.removed;
          dataRemoved.capacity = this.capacity;
          deleteGData.push(dataRemoved);
        }, this);

        // Incase 8 keys are returned from api for last 7 days,
        // for last 7 days current day is skipped always as data collection
        // happens in every 24hrs so for most practical purs=pose it will
        // mostly be 0, so we dont show it.
        // Incase 7 keys are returned from api for last 30 days,
        // Incase 13 keys are returned from api for last 1 year, skip the oldest
        if (this.interval === AppConstants.DAYS &&
          addGData.length > 7) {
          addGData.pop();
          deleteGData.pop();
        } else if (((this.interval === AppConstants.MONTHS ||
          this.interval === AppConstants.THREE_YEARS)
          && addGData.length > 12) ||
          (this.interval === AppConstants.WEEKS && addGData.length > 6) ||
          (this.interval === AppConstants.TWO_YEARS && addGData.length > 8)) {
          addGData.shift();
          deleteGData.shift();
        }
        gData.push(addGData);
        gData.push(deleteGData);
        return gData;
      }
    },

    // @private
    // Returns the capacity according to the bars/buckets.
    getReferenceCapacity: function(data) {
      let len = Object.keys(this.model.attributes).length;
      this.capacity = 0;


      // If reference capacity and date is present in the response.
      if (Object.keys(this.model._metadata.reference_capacity).length &&
        this.model._metadata.reference_capacity.date) {
        let refDate = new Date(this.model._metadata.reference_capacity.date),
            barDate = new Date(TimeUtil.formatEpocToShortDate(data.key));

        if (this.interval === AppConstants.DAYS) {
          // In case of last 7 days, the reference capacity returned for the 1st
          // time has the net capacity already added. Hence, we dont need to add
          // anything to it. For rest other days, add net change.

          if (refDate > barDate) {
            // If date of the reference capacity is greater than the current bar
            // date, set capacity for that bar as zero.
            this.capacity = 0;
          } else if (refDate.toDateString() === barDate.toDateString()) {
            // If date of the reference capacity is equal to the current bar
            // date, set capacity for that bar as the reference capacity given.
            this.capacity = this.model._metadata.reference_capacity.capacity;
          } else {
            // Else add the net change.
            this.capacity += data.added - data.removed;
          }
        } else if ($.inArray(this.interval,
          [AppConstants.WEEKS, AppConstants.MONTHS, AppConstants.TWO_YEARS,
            AppConstants.THREE_YEARS]) > -1) {
          // In case of last 30 days/1 year, we will have to add the reference
          // capacity even for the first bucket.
          let duration, interval = null;
          if (this.interval === AppConstants.WEEKS) {
            duration = parseInt(AppConstants.STATS_PER_WEEK[0], 10) - 1;
            interval = AppConstants.STATS_PER_WEEK[1];
          } else if (this.interval === AppConstants.MONTHS) {
            duration = parseInt(AppConstants.STATS_PER_MONTH[0], 10);
            interval = AppConstants.STATS_PER_MONTH[1];
          } else if (this.interval === AppConstants.TWO_YEARS ||
            this.interval === AppConstants.THREE_YEARS) {
            duration = parseInt(AppConstants.STATS_PER_QUARTER[0], 10);
            interval = AppConstants.STATS_PER_QUARTER[1];
          }

          let endDate = TimeUtil.getDateAfter(barDate, duration, interval);

          if (refDate > endDate) {
            // If date of the reference capacity is greater than the current bar
            // end date, set capacity for that bar as zero.
            this.capacity = 0;
          } else if (TimeUtil.isDateBetween(barDate, endDate, refDate)) {
            // If reference capacity date lies in the bucket range,
            // take the capacity into consideration just once, hence the flag.
            if (!this.flag) {
              this.flag = true;
              this.capacity = this.model._metadata.reference_capacity.capacity;
            }
            this.capacity += data.added - data.removed;
          } else {
            // Else add net capacity for that bucket.
            this.capacity += data.added - data.removed;
          }
        } else {
          this.capacity = 0;
        }
      } else {
        // Else set capacity as zero.
        this.capacity = 0;
      }
    },

    _formatBarDataD3: function() {
      this.lineBarData = [];
      this.maxYValue = 0;
      this.minYValue = 0;
      let tooltipData = '', netChange = 0;

      // If there is no data, just return instead of trying to get the bar
      // data. Then the renderChart will just display no data available.
      if (!this.graphData || !this.graphData.length) {
        return;
      }

      for (let i = 0; i < this.graphData.length; i++) {
        let legendData = { title  : '',
          desc   : ''
        };
        legendData.title = this.graphData[i].name;
        legendData.desc = this.graphData[i].name;
        this.lineBarDataOptions.push(legendData);
        this.lineBarData.push({
          key   : this.lineBarDataOptions[i].title,
          values: []
        });
      }

      _.each(this.graphData, function(dataObj, i) {
        _.each(dataObj, function(data, j) {
          if (i === 0) {
            // If customised tooltip values are needed, they are sent as
            // tooltipCount.
            tooltipData = [data.name, data.tooltipCount || data.count,
              this.graphData[1][j].tooltipCount || this.graphData[1][j].count,
              data.capacity];
            this.lineBarData[i].values.push(
              {
                x: data.name,
                y: data.count,
                to: data.to,
                from: data.from,
                tooltip: tooltipData,
                capacity: data.capacity
              }
            );
            this.lineBarData[i].values.push(
              {
                x: data.name,
                y: -this.graphData[1][j].count,
                to: data.to,
                from: data.from,
                tooltip: tooltipData,
                capacity: data.capacity
              }
            );

            // Get the max Y value for the chart
            this.maxYValue = Math.max(data.count, this.maxYValue);
            this.lineBarData[i].bar = true;
          } else if (i === 1) {
            tooltipData = [data.name, data.count, this.graphData[0][j].count];
            netChange = this.graphData[0][j].count - data.count;
            this.lineBarData[i].values.push(
              {
                x: data.name,
                y: netChange,
                to: data.to,
                from: data.from,
                tooltip: tooltipData,
                capacity: data.capacity
              }
            );

            // Get the min Y value for the chart
            this.minYValue = Math.max(data.count, this.minYValue);
          }
        }, this);
      }, this);
    },

    // @private
    // Gets the unit for the graph depending upon the data
    getSizeUnit: function() {
      let values = [];
      _.each(this.model.attributes, function(model, i) {
        if (model.added > -1) {
          values.push(model.added);
        }
        if (model.removed > -1) {
          values.push(model.removed);
        }
      });
      return StatsUtil.determineDataSizeUnit(values);
    },

    // @override
    renderChart: function() {
      // Get the DOM element where your chart is placed
      let chartContainer = this.getChartContainer();

      this.lineBarColors =
        StyleDescriptor.getChartColor(this.options.entityType);

      // Remove previous if already exists
      if (this._svg) {
        this._svg.remove();
        this._svg = null;
        this.graph = null;
      }

      let _this = this;

      this._svg = d3.select(chartContainer)
        .append('svg')
        .attr('class', 'chart');
      // Check if there's data...
      if (this.lineBarData && this.lineBarData.length) {
        // Show the chart element
        this.showChart();

        this.graph =
          /* global nv */
          nv.addGraph(() => {
            var chart = nv.models.linePlusBarChart()
              .margin(CHART_MARGINS)
              .showLegend(false)
              .x(function(d,i) { return i })
              .y(function(d) { return d.y })
              .color(this.lineBarColors);

            chart.xAxis.showMaxMin(false);

            chart.y1Axis.tickFormat(function(d, i) {
              return d + ' ' + _this.units;
            });

            let noOfTicks = 0;

            if (this.interval === AppConstants.DAYS) {
              // If interval is 'last 7 days'
              noOfTicks = 7;
            } else if (this.interval === AppConstants.WEEKS) {
              // If interval is 'Last 30 days'
              noOfTicks = 6;
            } else if (this.interval === AppConstants.MONTHS ||
              this.interval === AppConstants.THREE_YEARS) {
              // If interval is 'Last 1 year' and 'Last 3 years'
              noOfTicks = 12;
            } else if (this.interval === AppConstants.TWO_YEARS) {
              // If interval is 'Last 2 years'
              noOfTicks = 8;
            }

            chart.xAxis.ticks(noOfTicks)
              .tickFormat(function(d) {
                // As bar points is double the line points
                if (d > (noOfTicks - 1)) {
                  d = d - noOfTicks;
                }

                let val = 0, dateFrom = AppConstants.NOT_AVAILABLE,
                    dateTo = AppConstants.NOT_AVAILABLE;

                if ((_this.lineBarData.length > 1) &&
                  _this.lineBarData[1].values[d]) {
                  val = _this.getCapacityValue(
                    _this.lineBarData[1].values[d].capacity);

                  // Display date from and date to for weekly interval
                  dateFrom = TimeUtil.convertDate(
                    _this.lineBarData[1].values[d].from,
                    _this.interval);
                  dateTo = TimeUtil.convertDate(
                    _this.lineBarData[1].values[d].to,
                    _this.interval);
                }

                if (_this.interval === AppConstants.WEEKS) {
                  return dateFrom + '-' + dateTo + ' ' + val;
                } else {
                  return dateFrom + ' ' + val;
                }
              });

            // Align bars and line to same y axis value.
            chart.bars.forceY([-this.minYValue, this.maxYValue]);
            chart.lines.forceY([-this.minYValue, this.maxYValue]);

            // Custom tooltips
            let fnGetTooltip = _.bind(this.getTooltip, this);
            chart.tooltipContent(fnGetTooltip);

            this._svg
              .datum(this.lineBarData)
              .transition().duration(500)
              .call(chart);

            d3.selectAll('.nv-y2.nv-axis').remove();
            d3.selectAll('.nv-bar.negative').style('stroke', '#E67386');
            d3.selectAll('.nv-bar.negative').style('fill', '#E67386');

            // Hides the line parallel to y axis across each bar.
            d3.selectAll('.nv-x g.tick').each(function(xAxis) {
              let axis = d3.select(this);
              axis.select('line').style('opacity', 0);
            });

            // Breaks the x axis ticks into two lines.
            _this.modifyChart();

            nv.utils.windowResize(function() {
              chart.update();
              _this.modifyChart();
            });
            return chart;
          }, function() {
            // Append the total capacity div just once.
            if (!_this.$el.find('.total-capacity').length) {
              _this.$el.find('.chartBody')
                .append('<div class="total-capacity">Total</div>');
            }

            d3.selectAll('.capacity-trends .nv-point-paths').remove();
            d3.selectAll('.capacity-trends .nv-bar').on('click',
              function(e, i) {
                _this.onCapacityBarClick(e);
             });
        });
      } else if (this.lineBarData && !this.lineBarData.length) {
        // Show No Data
        this.showNoData();
      }
    },

    // Helper function to generate the tooltip content for the bar when
    // hovered
    getTooltip: function(key, x, y, e, graph) {
      let displayDate = TimeUtil.convertDate(e.point.from, this.interval);
      let toDate = TimeUtil.convertDate(e.point.to, this.interval);
      // Display date range for weekly interval
      if (this.interval === AppConstants.WEEKS) {
        displayDate = displayDate + ' - ' + toDate;
      }

      let tooltip = '<div class="text-center" ' +
        'style="padding-top:5px">' + displayDate +
        '</div>',
          color, text, val = null,
          units = '';

      if (e && e.point && e.point.tooltip && e.point.tooltip.length === 4) {
        for(let i = 0; i < e.point.tooltip.length; i ++) {
          if (i === 0) {
            units = StatsUtil.determineDataSizeUnit([e.point.tooltip[1]]);
            text = AppConstants.CAPACITY_TREND.CAPACITY_ADDED;
            val = StatsUtil.unitsConversion(e.point.tooltip[1], units) + ' ' +
              units;
            color = this.lineBarColors[0];
          } else if (i === 1) {
            units = StatsUtil.determineDataSizeUnit([e.point.tooltip[2]]);
            text = AppConstants.CAPACITY_TREND.CAPACITY_REMOVED;
            val = StatsUtil.unitsConversion(e.point.tooltip[2], units) + ' ' +
              units;
            color = this.lineBarColors[2];
          } else if (i === 2) {
            text = AppConstants.CAPACITY_TREND.NET_CAPACITY;
            let num = e.point.tooltip[1] - e.point.tooltip[2];
            let numVal = Math.round(num * 100) / 100;
            units = StatsUtil.determineDataSizeUnit([Math.abs(numVal)]);
            val = StatsUtil.unitsConversion(Math.abs(numVal), units) + ' ' +
              units;
            color = this.lineBarColors[1];
          } else {
            text = AppConstants.CAPACITY_TREND.TOTAL_CAPACITY;
            let num = e.point.tooltip[3];
            let numVal = Math.round(num * 100) / 100;
            units = StatsUtil.determineDataSizeUnit([Math.abs(numVal)]);
            val = StatsUtil.unitsConversion(Math.abs(numVal), units) + ' ' +
              units;
            color = this.lineBarColors[3];
          }

          let temp1 =  CommonTemplates.OPERATION_CIRCLE({
            backgroundColor: color,
            border: color
          });

          if (i === 3) {
            temp1 = '';
            tooltip += '<hr style="margin: 4px 8px;">';
          }

          tooltip += ChartTemplates.CAPACITY_TOOL_TIP_TEMPLATE({
            temp1: temp1,
            temp2: text,
            temp3: val
          });

        }
      }

      return tooltip;
    },

    // @private
    // Get the start and end time to pass
    // in the popup.
    getStartEndTime: function(e) {
      let data = this.model.attributes;
      let retVal = {}, endTime = 0;
      let len = Object.keys(data).length;

      for (let i = 0; i < len; i++) {
        if (data[i].key === e.x && i !== (len - 1)) {
          endTime = data[i + 1].key - 1;
          break;
        } else if (i === (len - 1)) {
          endTime = this.endTime;
          break;
        }
      }

      retVal.startTime = e.x;
      retVal.endTime = endTime;
      return retVal;
    },

    // Event based function called on click of a bar.
    onCapacityBarClick: function(e) {
      let displayDate = TimeUtil.convertDate(e.from, this.interval);
      let toDate = TimeUtil.convertDate(e.to, this.interval);
      // Display date range for weekly interval
      if (this.interval === AppConstants.WEEKS) {
        displayDate = displayDate + ' - ' + toDate;
      }

      let options = {};
      options.title = AppConstants.POPUP.CAPACITY_TREND +
        displayDate;

      options.action = AppConstants.ENTITY_CAPACITY_TREND;
      options.actionTarget = AppConstants.ENTITY_CAPACITY_TREND;
      options.startTimeInMs = e.from;
      options.endTimeInMs = e.to;
      options.interval = this.selectedFilter;
      options.totalCapacity = e.capacity || 0;
      options.capacityAdded = e.tooltip[1] || 0;
      options.capacityRemoved = e.tooltip[2] || 0;
      PopupManager.handleAction(options);
    },

    getCapacityValue: function(data) {
      let units = StatsUtil.determineDataSizeUnit([data]),
          dataVal = StatsUtil.unitsConversion(data, units) + units;

      return dataVal;
    },

    // Modify the chart on resize
    modifyChart: function() {
      // Breaks the x axis ticks into two lines.
      d3.selectAll('.nv-x g.tick').each(function(xAxis) {
        let axis = d3.select(this);
        let el = axis.select('text');
        if (el[0][0]) {
          let d = el.text();
          if (d) {
            let words = d.split(' ');
            el.text('');

            for (let i = 0; i < words.length; i++) {
              let tspan = el.append('tspan').text(words[i]);
              if (i > 0) {
                tspan.attr('x', 0).attr('dy', '15');
              }
            }
          }
        }
      });
    }
  });

  // Return CapacityChartView
  return CapacityChartView;
});
