//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// BaseChartView is the parent class of all flotr chart views.
//
define([
  // Core
  'd3',
  'nv',
  'views/base/BaseView',
  'views/base/BaseChartMixin',
  // Utils
  'utils/CommonTemplates',
  'utils/AppConstants',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // References of core
  d3,
  nv,
  BaseView,
  BaseChartMixin,
  // References of utils
  CommonTemplates,
  AppConstants,
  // Templates
  ChartTemplates) {

  'use strict';

  // Extending the BaseView
  let BaseChartView = BaseView.extend(_.extend({}, BaseChartMixin, {

    // Properties (Core)
    //------------------

    // NOTE about this.options:
    // The parent component should pass the following properties in options
    // when intantiating the class:
    // 1) options.entityType
    // 2) options.metricType

    // @private
    // Dynamic Unique ID of the chart container. This is generated on run
    // time when the chart container is called to plot the chart.
    _uniqueDOMId: null,

    // The component that has the graph element
    graph: null,

    // The parsed chart data. Flotr2 has a weird syntax for data members,
    // hence, store the newly parsed data.
    graphData: null,

    // The title of the graph
    title: '',

    // Entity Type
    entityType: null,

    // Entity Id
    entityId: null,

    // Chart height in px
    chartHeight: null,

    // Used by the timer for the resize event handler.
    resizeTimer: null,

    // Use an area fill. Default is true based on Jeremy's design.
    useFill: true,

    // Are these storage stats?
    isStorageStats: false,

    // Is the chart rendered in a widet?
    isWidget: false,

    // Properties (Style)
    //-------------------

    // @inherited
    className: 'n-chart',

    // Main color of the chart
    mainColor: ['#dedede', '#dedede'],

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initialize: function(options) {
      BaseView.prototype.initialize.apply(this, arguments);
      // Set the properties
      if (options.entityType) {
        this.entityType = options.entityType;
      }
      if (options.entityId) {
        this.entityId = options.entityId;
      }
      if (options.chartHeight) {
        this.chartHeight = options.chartHeight;
      }

      this.options = options;

      // Initialize stats properties by the subclass
      this.initializeStatsProperties(options);

      // Handle the resize event to re-render the chart.
      _.bindAll(this, 'onResize', 'preProcessTooltipData',
        'toolTipTrackFormatter');
      $(window).on('resize.app', this.onResize);
    },

    // Render the chart template
    render: function() {
      // Set the contents of the $el
      this.$el.html(
        ChartTemplates.ENTITY_CHART_WITHOUT_HEADER({
          chartWidthP : '100'
        })
      );

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

    // Fetch the data to be rendered in the graph.
    fetchGraphData: function(filterDuration) {
      var _this = this;
      // Hide the error template and show loading on rendering the graph again
      this.showLoading();
      if (this.model) {
        this.model.fetch({
          success : function(data) {
            // Hide loading
            _this.hideLoading();
            _this.showPartition();
            _this.updateChartData(filterDuration);
            if (_this.hasData()) {
              _this.onActionSuccess();
            }
          },
          error: function(model, xhr) {
            console.info('Error fetching data');
            _this.onDataError(xhr);
          }
        });
      }
    },

    // @private
    // Add legend below the graph.
    addGraphTableLegend: function(colorArr, legendClass, textArr) {
      $('.' + legendClass).empty();
      for (let i = 0; i < colorArr.length; i++) {
        let legendSquare = CommonTemplates.OPERATION_CIRCLE({
          backgroundColor: colorArr[i],
          border: colorArr[i]
        });

        $('.' + legendClass).append(legendSquare +
          '<span class="graph-legend">' + textArr[i] +
          '</span>').addClass('text-center');
      }
    },

    // Show the legend at the bottom of the widget.
    onActionSuccess: function() {
      // To be overriden in the child class
    },

    // NOTE: Don't override this
    // Returns the DOM chart container but checks first if id has been set.
    // Set the unique DOM ID for the chart first where it'll be plotted.
    getChartContainer: function() {
      if (!this._uniqueDOMId) {
        // Make a really unique DOM id. For some reason, Flotr needs to get
        // the DOM by id and not through jQuery.
        this._uniqueDOMId = 'chartId' + this.cid + (new Date()).getTime();
        this.$el.find('.chartBody').attr('id', this._uniqueDOMId);
      }
      return document.getElementById(this._uniqueDOMId);
    },

    // Functions (Display)
    //--------------------

    // @override
    // Override onDataError to show error
    // template and hide other elements.
    onDataError(xhr) {
      if (this.isWidget) {
        this.hideLoading();
        this.hidePartition();
      } else {
        this.getDOM('.loading').hide();
        this.getDOM('.chartBody').hide();
        this.getDOM('.chartValue').hide();
      }
      BaseView.prototype.onDataError.call(this, xhr);
    },

    // Shows the partition between two elements in the widget.
    showPartition: function() {
      this.$el.parents('.n-content').find(
        '.n-column-content-2, .n-vertical-content-2').show();
    },

    // Hides the partition between the two elements in the widget.
    hidePartition: function() {
      this.$el.parents('.n-content').find(
        '.n-column-content-2, .n-vertical-content-2').hide();
    },

    // Shows no data view
    showNoData: function() {
      if (this.isWidget) {
        this.hidePartition();
        this.hideLoading();
        this.showNoDataAvailable();
      } else {
        this.getDOM('.loading').hide();
        this.getDOM('.noDataBody').show();
        this.getDOM('.chartBody').hide();
        this.getDOM('.chartValue').hide();
      }
    },

    // Show the chart and hide no data view
    showChart: function() {
      this.getDOM('.loading').hide();
      this.getDOM('.noDataBody').hide();
      if (this.getDOM('.n-error')) {
        this.getDOM('.n-error').hide();
      }
      this.getDOM('.chartBody')
        .show()
        .css('opacity', 1);
      this.getDOM('.chartValue').show();
    },

    // Show the loading state. Flotr is kinda quirky when hiding the graph.
    showLoading: function() {
      if (this.isWidget) {
        const parent = this.$el.parents('.n-vantage-point');
        if (parent.find('.n-error').length) {
          parent.find('.n-error').hide();
        }
        parent.find('.noData').hide();
        parent.find('.n-loading-wrapper').show();
        // Disable dropdown option on the widget title
        parent.find('.dropdown > button').addClass('disabled');
      } else {
        this.getDOM('.n-loading-wrapper').show();
        this.getDOM('.loading').show();
        this.getDOM('.noDataBody').hide();
        if (this.getDOM('.n-error')) {
          this.getDOM('.n-error').hide();
        }
        this.getDOM('.chartBody')
          .show()
          .css('opacity', 0.4);
      }
    },

    // Show the max display value of the Y axis
    showMaxYaxisValue: function() {
      // There's a Flotr bug that sometimes the flotr-grid-label-y is empty.
      // Make sure that the flotr-grid-label-y has value.
      if (this.$('.flotr-labels > div.flotr-grid-label-y').length === 0) {
        var flotrLabelY = $('<div></div>')
          .addClass('flotr-grid-label-y')
          .html(this.getMaxDisplayLabel());
        this.$('.flotr-labels').append($(flotrLabelY));
      }

      // Show the maximum value and adjust its vertical position
      this.$('.flotr-labels > div.flotr-grid-label-y:last').css('top', '0px');
    },


    // Functions (Util)
    //-----------------

    // NOTE: To override
    // Returns the tooltip content
    toolTipTrackFormatter: function(obj) {
      var timestamp = obj.x,
          value = obj.y,
          date = new Date(),
          parsedValue;

      // Set the date
      date.setTime(timestamp);

      // Parse the label value depending on the metric type
      parsedValue = this.rawNumericFormat(value);

      // Form the HTML dislpay
      return parsedValue;
    },

    // Returns true if chart has fill. We have to calculate whether or not
    // fill is used because a Flotr visual bug happens when a spike occurs
    // after consecutive zero and null values. If this happens then the fill
    // is disabled.
    hasFill: function() {
      return this.useFill;
    },

    // Returns the default min value based on the metric type
    getTicks: function() {
      var ticks = [
        [this.getMin(), ''],
        [this.getMax(), this.getMaxDisplayLabel()]
      ];
      return ticks;
    },

    // Update the max, min values based on the chart data. Also determine
    // if fill is needed. We set the max value for padding, plus the display
    // max value.
    updateChartOptions: function() {
      if (!this.graphData) {
        console.log('Chart data should be not be empty');
        return;
      }

      // Set the chart max, min and useFill
      //-----------------------------------
      var dataPoint;
      this.chartDataMaxY = 0;
      this.chartDataMinY = 0;
      this.useFill = true; // Default is true based on design
      this.isStorageStats = false;

      // Loop the graph data only once when it's new. The dataPoint is a
      // tuple [ time, value ]
      for (var i = 0; i < this.graphData.length; i++) {
        dataPoint = this.graphData[i];
        // Figure out the max and min values
        // If there's no value, then continue on. No need to calculate max
        // and min for null value.
        if (dataPoint[1] === null ||
          dataPoint[1] === AppConstants.STATS_NO_VALUE) {
          continue;
        }

        if (dataPoint[1] > this.chartDataMaxY) {
          this.chartDataMaxY = dataPoint[1];
        }
        if (dataPoint[1] < this.chartDataMinY) {
          // Make sure no negative values
          this.chartDataMinY = Math.max(0, dataPoint[1]);
        }
      }

      // Before setting the y-axis max, set the display max value
      // For the storage stats converting back to original values. The values
      // were converted from bytes to Mebibytes (base 2)
      // to account for the Flotr bug.
      this.chartDataMaxYdisplay = this.chartDataMaxY;

      this.setAppropriateMax();
    },

    // Validation
    //-----------

    // Returns true if the new model is valid to be used for chart rendering.
    // Even after the chart data has been rendered, Arithmos master could
    // restart and will return no data. This doesn't happen too often but we
    // have to prevent rendering 'No Available Data'.
    isValidForChartUpdate: function(newModel) {
      // Set the properties
      var isValid = true;

      // Check first if the newModel is the same as the current model because
      // sometimes the model is only instantiated once and not replaced.
      if (this.model && newModel && newModel.cid === this.model.cid) {

        // A) Same instance
        // Check if the chart has existing data and the newModel has no data
        // at all due to an Arithmos master restart.
        if (this.hasData() && newModel.previous &&
          newModel.previous('entityId') === newModel.get('entityId') &&
          newModel.previous('entityType') === newModel.get('entityType') &&
          !this._checkMetricsData(newModel, this.getMetricId())) {
          isValid = false;
        }
      } else {
        // B) Different instance
        // Check if the current chart model entity type and id are the same
        // with the new model. If they're the same, check if the new model
        // has no data at all due to an Arithmos master restart.
        if (this.model && newModel && this.hasData() &&
            this.model.get('entityId') === newModel.get('entityId') &&
            this.model.get('entityType') === newModel.get('entityType') &&
            !this._checkMetricsData(newModel, this.getMetricId())) {
          isValid = false;
        }
      }

      // Log if not valid
      if (!isValid) {
        console.log('Arithmos master restarted as new data is empty. ' +
          ' entityId: ' + this.model.get('entityId') +
          ' | entityType: ' + this.model.get('entityType'));
      }

      return isValid;
    },

    // Returns true if the chart has pre-populated data
    hasData: function() {
      return (this.graphData && this.graphData.length > 0);
    },

    // Convert the data points that have 'null' to be 0. This should help
    // Flotr fill the charts correctly.
    processData: function() {
      var processedData = [];
      _.each(this.graphData, function(dataPoint) {
        if (dataPoint[1] === null) {
          processedData.push([dataPoint[0], 0]);
          return;
        }
        processedData.push(dataPoint);
      }, this);

      // If for some reason, processed data is empty, return original data.
      if (_.isEmpty(processedData)) {
        processedData = this.graphData;
      }
      return processedData;
    },

    // @override
    // Destroy this instance
    destroy: function() {
      if (this.graph) {

        // Call Flotr destroy
        if (this.graph.destroy) {
          this.graph.destroy();
        }

        this.graph = null;
      }

      // Call the base cleanup API
      BaseView.prototype.destroy.apply(this, arguments);
    },

    renderChart: function() {
      // To be overriden in child class
    },

    // Events Listeners
    //-----------------

    // Resize
    onResize: function() {
      // Poor man's resize throttler.
      var _this = this;
      clearTimeout(this.resizeTimer);
      // Chart resize needs to happen after vantage point resize,
      // so increased the timeout.
      this.resizeTimer = setTimeout(function() {
        // Check if chart is shown
        if (this.$('.chartBody').is(':visible')) {
          _this.renderChart();
        }
      }, 300);
    },

    // Functions (Flotr)
    //------------------

    // For Flotr
    // @override
    // Handler for updating the x position of the mouseTrack pane to make
    // sure it stays within the boundary limit.
    // @param n - Flotr options includes the mouse x, y position
    // @param plotOffset - plotOffset
    // @param mouseTrack - the mouseTrack DOM pane
    // @param cHeight - canvasHeight
    // @param cWidth  - canvasWidth
    mouseTrackOverride: function(n, plotOffset, mouseTrack, cHeight, cWidth) {
      var x = n.relX,
          y = n.relY,
          m = n.mouse.margin,
          left = plotOffset.left,
          right = plotOffset.right,
          bottom = plotOffset.bottom,
          top = plotOffset.top,
          mtLeft = Number((mouseTrack.style.left || '').replace('px','')),
          mtRight = Number((mouseTrack.style.right || '').replace('px','')),
          mtWidth = $(mouseTrack).width(),
          boundaryLimit = 30,
          isLimit = ((x - mtWidth - boundaryLimit) < 0);

      // Check if the mouseTrack pane is beyond the limit and swap the
      // position.
      if ( !isNaN(mtRight) && isLimit) {
        mouseTrack.style.right = 'auto';
        mouseTrack.style.left = (m + left + n.xaxis.d2p(n.x)) + 'px';
      } else if ( !isNaN(mtLeft) && isLimit) {
        mouseTrack.style.right = (m - left - n.xaxis.d2p(n.x) + cWidth) + 'px';
        mouseTrack.style.left = 'auto';
      }
    },

    // Pre process data to be shown in the mouse over tooltip in Flotr charts.
    preProcessTooltipData: function(n) {
      // ENG-15341
      var index = n.index;
      // Check if the model data has a null associated with the same index.
      // If yes, return '-'.
      if (this.graphData[index][1] === null) {
        return {
          x: n.x,
          y: AppConstants.STATS_NOT_AVAILABLE
        };
      }
      return null;
    },

    // Functions (Services)
    //---------------------

    // @override
    // Handler when services are started on this view
    onStartServices() {
      // Adjust the position of the details and delegate the window
      // resize event.
      $(window).on('resize.app', this.onResize);
    },

    // @override
    // Handler when services are stopped on this view
    onStopServices() {
      // Undelegate window resize event
      $(window).off('resize.app', this.onResize);
    }
  }));

  // Returns the BaseChartView Class
  return BaseChartView;
});
