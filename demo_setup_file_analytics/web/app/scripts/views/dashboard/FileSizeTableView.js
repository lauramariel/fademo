//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileSizeTableView enables the user to view the table with
// the file distribution by size.
//
define([
  // Views
  'views/base/BaseTableView',
  'views/dashboard/FileSizeChartView',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/StatsUtil',
  // Collections
  'collections/dashboard/FileSizeGraphCollection'],
function(
  // Views
  BaseTableView,
  FileSizeChartView,
  // Utils
  AppConstants,
  AppUtil,
  StatsUtil,
  // Collections
  FileSizeGraphCollection) {
  'use strict';

  var FileSizeTableView = BaseTableView.extend({

    // The model for the view.
    model: null,

    totalVal: 0,

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new FileSizeGraphCollection();
      this.model.getURL();
      BaseTableView.prototype.initialize.call(this, options);
    },

    // @override
    // Remove DOM elements that are not required
    renderSubViews: function() {
      BaseTableView.prototype.renderSubViews.call(this);
      this.$('.n-header').remove();
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      let _this = this;
      var retArray = [
        // Name
        {
          'mData'   : 'key',
          'mRender' : function(data, type, full) {
            if (full.from === 0) {
              data = '< ' + StatsUtil.formatBytes(full.to);
            } else if (full.from === 1073741824.01) {
              data = '> ' + StatsUtil.formatBytes(full.from)
            } else {
              data = StatsUtil.formatBytes(full.from) + ' to '
                + StatsUtil.formatBytes(full.to);
            }
            return '<span title="' + data + '" >' +
              data + '</span>';
          }
        },
        {
          'mData'   : 'doc_count',
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            return '<span title="' + data + '" >' +
              AppUtil.formatSize(data) + '</span>';
          }
        },
        {
          'mData'   : 'doc_count',
          'sWidth': '45%',
          'mRender' : function(data, type, full) {
            let entityType = AppConstants.SHOW_FILE_DISTRIBUTION_BY_SIZE;
            if (!_this.totalVal) {
              _.each(_this.model.models, function(val) {
                _this.totalVal += val.attributes.doc_count;
              });
            }
            let random = full.key.split('.').join('-').replace('*', 's');
            let templ = '<div class="file-size-chart-' + random +
              ' file-size-chart"></div>';
            let fileSizeChart = new FileSizeChartView({
              entityType  : entityType,
              data        : data,
              totalValue  : _this.totalVal
            });
            _this.$('.file-size-chart-' + random).html(
              fileSizeChart.render().el);
            return templ;
          }
        }
      ];

      return retArray;
    },

    // @override
    // Drawing of the table is complete.
    onDrawCallback: function(oSettings) {
      BaseTableView.prototype.onDrawCallback.apply(this, arguments);
      this.$('thead').remove();
    }
  });

  return FileSizeTableView;
});
