//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileTypeTableView enables the user to view the table with
// the file type categories.
//
define([
  // Views
  'views/base/BaseTableView',
  'views/base/DataTableTemplates',
  'views/dashboard/FileTypeTableChartView',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/StatsUtil',
  // Data
  'data/DataProperties',
  // Models
  'collections/capacitytrend/CapacityTrendCollection',
  'models/dashboard/FileTypeCategoryModel'],
function(
  // Views
  BaseTableView,
  DataTableTemplates,
  FileTypeTableChartView,
  // Utils
  AppConstants,
  AppUtil,
  StatsUtil,
  // Data
  DataProp,
  // Models
  CapacityTrendCollection,
  FileTypeCategories) {
  'use strict';

  var FileTypeTableView = BaseTableView.extend({

    // The model for the view.
    model: null,

    totalVal: 0,

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.remove();
      this.model.models = options.model.attributes;
      // The max number of categories is the number of records in categories
      // of json file.
      this.defaultMinRows = Object.keys(this.model.models).length;
      BaseTableView.prototype.initialize.call(this, options);
    },

    // @override
    // Fetch data for the table. But here as we are getting the data in the
    // options, we dont need to fetch it explicitly. Hence overriding it.
    fetchModel: function() {
      let tooltipHTML = 'Capacity for the current day is not included. \
        Capacity detail in terms of file category is calculated based on \
        the latest configuration, whereas the old data is not modified.';

      // Adding tooltip on hover of the '?' symbol in the column head.
      $('.nutanixMoreInfo').nutanixMoreInfo({
        html: true,
        title: tooltipHTML,
        placement: 'top',
        container: 'body',
        renderMethod: 'append',
        classes: ['qtip']
      });
      this.onActionSuccess();
    },

    // @private
    // Push data to chart data in required format.
    // @param categoryArray - the array of categorised objects.
    formatData: function(categoryArray) {
      this.tableData = [];
      let _this = this;

      // Put the net capacity of respective categories based on
      // their extensions
      _.each(_this.model.models, function(fileType, index) {
        if (fileType.name === AppConstants.OTHER_FILE_TYPES ||
          fileType.name === AppConstants.NO_EXTENSIONS) {
          fileType.extensions = [];
        } else {
          $.each(this.fileTypeCategories.attributes, function(key, category) {
            if (fileType.name === category.metric) {
              fileType.extensions = category.values;
            }
          });
        }
        fileType.net_capacity = categoryArray[fileType.name];
        fileType.category = AppUtil.getCategoryDisplayName(fileType.name);
        _this.tableData.push(fileType);
      }, this);

      this.tableData.sort(function(category1, category2) {
        return category2.count - category1.count;
      });
    },

    // @private
    // Fetches the capacity of different file extensions.
    // @param finalData - the data to be rendered in the table.
    // @param interval - the interval.
    // @param startTimeInMs - the start time in ms.
    // @param endTimeInMs - the end time in ms.
    fetchCapacity: function() {
      let _this = this,
          interval = this.options.interval,
          startTimeInMs = this.options.startTimeInMs,
          endTimeInMs = this.options.endTimeInMs;

      this.capacityModel = new CapacityTrendCollection();
      this.capacityModel.getURL(interval, startTimeInMs, endTimeInMs,
        DataProp.CATEGORY);
      this.capacityModel.fetch({
        success: function(data) {
          _this.getFileTypeCategories();
        },
        error: function(model, xhr) {
          _this.onDataError(xhr);
          // On error, show alert at the top of the popup.
          _this.options.parent.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Error fetching capacity data.');
        }
      });
    },

    // @override
    // Called on success of table data fetching.
    onActionSuccess: function() {
      this.resetSettings();
      this.fetchCapacity();
      this.$('.n-header').prepend(_.template(DataTableTemplates.HEADER_LEFT, {
        totalRecords: 0
      }));
      this.$('.n-header .n-header-left').html(
        '<strong>Details of file distribution</strong>');

      this.$('.n-header .n-header-right').remove();
    },

    // @private
    // Get Filetype categories
    getFileTypeCategories: function() {
      let _this = this;
      this.fileTypeCategories = new FileTypeCategories();
      this.fileTypeCategories.getURL();
      this.fileTypeCategories.save(
        this.fileTypeCategories.getRequestPayload(), {
          success: function(data) {
            _this.netCapacityByType();
            _this.insertDataRows(_this.tableData);
          },
          error: function(model, xhr) {
            _this.onDataError(xhr);
            // On error, show error at the top of the popup.
            _this.options.parent.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
              'Error fetching file type categories.');
          }
        });
    },

    netCapacityByType: function() {
      let categoryArray = {};
      const categories = this.capacityModel.toJSON();
      _.each(categories, function(block) {
        if (block.details.name) {
          categoryArray[block.details.name] = block.added - block.removed;
        }
      });

      this.formatData(categoryArray);
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      let period = this.options.duration, _this = this, i = 0;

      var retArray = [
        // Name
        {
          'sTitle' : 'File Type',
          'mData'   : 'category',
          'mRender' : function(data, type, full) {
            return data;
          }
        },
        {
          'sTitle' : 'Current Space Used',
          'mData'   : 'size',
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            let entityType = AppConstants.SHOW_FILE_DISTRIBUTION_BY_TYPE;
            if (!_this.totalVal) {
              _.each(_this.model.models, function(val) {
                _this.totalVal += val.size;
              });
            }
            let customClass = full.category;
            customClass = customClass.replace(/\s/g, '');
            customClass = AppUtil.removeSpecialCharacters(customClass);

            let templ = '<div class="fileTypeTableChart' + customClass +
              ' file-type-bullet-chart top-user-chart"></div>';

            // Need to set/pass index to get color for the bar in the table
            let fileTypeTableChart = new FileTypeTableChartView({
              entityType : entityType,
              data       : full,
              totalValue : _this.totalVal,
              colorIndex : i
            });
            i = (type === 'filter') ? ++i : i;

            _this.$('.fileTypeTableChart' + customClass).html(
              fileTypeTableChart.render().el);
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units + templ;
          }
        },
        {
          'sTitle' : 'Current Number of Files',
          'mData'   : 'count',
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            return '<span title="' + data + '" >' +
              AppUtil.formatSize(data) + '</span>';
          }
        },
        {
          'sTitle' : 'Change (In ' + period + ')\
            <span class="nutanixMoreInfo"></span>',
          'mData'   : 'net_capacity',
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([Math.abs(data)]);

            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;
          }
        }
      ];

      return retArray;
    }
  });

  return FileTypeTableView;
});
