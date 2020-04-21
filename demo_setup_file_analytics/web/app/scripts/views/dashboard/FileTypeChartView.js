//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileTypeChartView used for file type chart.
//
define([
  // Core
  'views/graph/EntityHorizontalStackedBarChartView',
  // Models
  'models/dashboard/FileTypeGraphModel',
  // Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/AntiscrollUtil',
  'utils/StatsUtil',
  'utils/AppUtil',
  // Templates
  'views/base/charts/ChartTemplates'],
function(
  // Core
  EntityHorizontalStackedBarChartView,
  // Models
  FileTypeGraphModel,
  // Utils
  AppConstants,
  CommonTemplates,
  AntiscrollUtil,
  StatsUtil,
  AppUtil,
  // Templates
  ChartTemplates) {
  'use strict';

  var FileTypeChartView = EntityHorizontalStackedBarChartView.extend({
    // this.model is an instance of the entity types collection.
    model: null,

    // Unit of data.
    units: 0,

    // Is the chart rendered in a widget?
    isWidget: true,

    // @override
    initialize: function(options) {
      this.model = new FileTypeGraphModel();
      this.model.getURL();
      EntityHorizontalStackedBarChartView.prototype.initialize.call(this,
        options);
    },

    // @private
    // Creates a template for the file categories table.
    createTableTemplate: function() {
      let data = this.model.attributes, tempDiv = '', units = '',
          count = 0, iconTempl = '', tableTempl = '<div class="fileItems">';

      let tempDivTempl = _.template('<div class="innerItems">' +
        '<%= icon %> <b title="<%= name %>" ' +
        'class="<%= icon ? "" : "no-icon" %>"><%= name %></b> <br>' +
        '<span><%= count %> <%= units %></span></div>');

      // If there is no data, hide the details links.
      if (!Object.keys(data).length) {
        this.getDOM('.vpTitleOptions').hide();
      }

      _.each(this.tableData, function(elem, key) {
        units = StatsUtil.determineDataSizeUnit([elem.count]);
        count = StatsUtil.unitsConversion(elem.count, units);
        iconTempl = '';
        if (this.chartColors[key]) {
          iconTempl = CommonTemplates.OPERATION_CIRCLE({
            backgroundColor: this.chartColors[key],
            border: this.chartColors[key]
          });
        }
        tempDiv = tempDivTempl({
          icon: iconTempl,
          name: elem.name,
          count: count,
          units: units
        });
        tableTempl += tempDiv;
      }, this);

      tableTempl += '</div>';

      return tableTempl;
    },

    // @override
    // Renders the table template in the widget.
    onActionSuccess: function() {
      let tableTempl = this.createTableTemplate();
      this.updateColumnContent(this.$el.parents('.n-content'),
        tableTempl, 2, true);
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
    // Override onDataError function to show error
    // template and align with other widgets and make
    // view file details link disabled.
    onDataError(xhr) {
      $('#viewFileDetails').css('display', 'none');
      EntityHorizontalStackedBarChartView.prototype.onDataError
        .call(this, xhr);
    },

    // @private
    // Push data to chart data in required format
    formatData: function() {
      this.tableData = [];
      _.each(this.model.attributes, function(category, index) {
        if (category.count) {
          this.tableData.push({
            name: AppUtil.getCategoryDisplayName(category.name),
            count: category.size
          });
        } else {
          // remove categories where count is 0
          delete this.model.attributes[index];
        }
      }, this);
      this.tableData.sort(function(category1, category2) {
        return category2.count - category1.count;
      });

      // Table Data will have complete list, whereas chart will show top 19
      // i.e. the default category configuration list count as per FA 2.0 bcz
      // starting from FA 2.1 we giving user flexibility to define categories
      // and there can be n number so will limit number of categories to be
      // displayed in the graph.
      this.chartData = _.first(this.tableData,
        Object.keys(AppConstants.CATEGORIES).length);
    },

    // @override
    // Pre-process the data before converting it further.
    getGraphDataForModel: function() {
      // Update data in the format required for it to rendered on chart
      this.formatData();
      if (this.chartData.length) {
        // Show detail button if there are categories to be displayed
        $('#viewFileDetails').show();
      }
      return this.chartData;
    },

    // Helper function to generate the tooltip content for the bar when
    // hovered
    getTooltip: function(key, x, y, e, graph) {
      let tooltip = '', title = '',
          units = StatsUtil.determineDataSizeUnit([e.point.tooltip[1]]);

      if (e.point.tooltip[0] && e.point.tooltip[1]) {
        tooltip = ChartTemplates.TOOL_TIP_TEMPLTE({
          entityName: title,
          dataTitle: e.point.tooltip[0],
          dataValue: StatsUtil.unitsConversion(e.point.tooltip[1], units) + ' '
            + units
        });
      }
      return tooltip;
    },

    // Show tooltip at defined positions
    tooltipShow: function(e, offsetElement) {
      var left = e.pos[0] - 100,
          top = e.pos[1],
          content = this.getTooltip(e.series.key, 0, 0, e, null);

      nv.tooltip.show([left, top], content, 's', -1, offsetElement);
    },

    // Update chart colors as per file type
    _formatBarDataD3: function() {
      this.barData = [];
      // If there is no data, just return instead of trying to get the bar
      // data. Then the renderChart will just display no data available.
      if (!this.graphData || !this.graphData.length) {
        return;
      }

      for (let i = 0; i < this.graphData.length; i++) {
        let legendData = {
          title: '',
          desc: ''
        };
        legendData.title = this.graphData[i].name;
        legendData.desc = this.graphData[i].name;

        this.barDataOptions.push(legendData);
        this.barData.push({
          key: this.barDataOptions[i].title,
          values: []
        });
      }

      _.each(this.graphData, function(dataObj, i) {
        this.barData[i].values.push(
          {
            x: 0,
            y: dataObj.count,
            tooltip: [dataObj.name, dataObj.count]
          });

      }, this);
    },

    // @override
    // Get file sizes for categories
    fetchGraphData: function(filterDuration) {
      var _this = this;
      if (this.model) {
        this.model.save(null, {
          success: function(data) {
            // Remove the restriction of pointer-events as the
            // fetch is complete now.
            // $('#viewFileDetails').removeAttr('style');
            // Hide loading
            _this.hideLoading();
            // Render chart template
            _this.updateChartData(filterDuration);
            if (_this.hasData()) {
              _this.onActionSuccess();
            }
          },
          error: function(model, xhr) {
            _this.onDataError(xhr);
          }
        });
      }
    }
  });

  // Return FileTypeChartView
  return FileTypeChartView;
});
