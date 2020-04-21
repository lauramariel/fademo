//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FolderCapacityDetailTableView views the table with
// the details of capacity trend.
//
define([
  // Views
  'views/base/BaseTableView',
  // Utils
  'utils/StatsUtil',
  'utils/TimeUtil',
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/FilesUtil',
  // Data
  'data/DataProperties',
  // Models/Collections
  'collections/capacitytrend/CapacityTrendCollection'],
function(
  // Views
  BaseTableView,
  // Utils
  StatsUtil,
  TimeUtil,
  AppConstants,
  CommonTemplates,
  FilesUtil,
  // Data
  DataProp,
  // Models/Collections
  CapacityTrendCollection) {

  'use strict';

  var FolderCapacityDetailTableView = BaseTableView.extend({

    // Hide the left section of the header.
    leftHeader: false,

    // Hide search
    headerSearchBox: false,

    // The model for the view.
    model: null,

    // Object having the file paths
    filePaths: {},

    // Page id list, need to maintain in case pagination is handled using
    // next_page_id instead of standard page count
    PAGE_ID_LIST: [],

    className: 'n-base-data-table n-tab tab-pane',

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new CapacityTrendCollection();
      this.createUrl(this.options.interval,
        this.options.startTimeInMs, this.options.endTimeInMs);
      this.PAGE_ID_LIST = [];

      BaseTableView.prototype.initialize.call(this, options);

      // Enable popover on cell hover for this table
      this.enablePopoverOnHover();
    },

    // @private
    // Function to create the fetch URL
    createUrl: function(filterDuration, startTime, endTime) {
      let interval = TimeUtil.getInterval(filterDuration);
      this.model.getURL(interval, startTime, endTime, DataProp.FOLDER);
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      var retArray = [
        {
          'sTitle'  : 'Name',
          'mData'   : DataProp.CAPACITY_ENTITY_DETAILS,
          'tmplHover' : CommonTemplates.POPOVER_TEMPLATE,
          'bSearchable' : true,
          'mRender' : function(data, type, full) {
            const returnData =
              data[DataProp.NAME] || AppConstants.NOT_AVAILABLE;
            const retVal = '<span class="inline-popover" actionTargetFile = ' +
                  data[DataProp.ID] + ' data-toggle="popover">' +
                  returnData + '</span>';
            return retVal;
          }
        },
        {
          'sTitle'  : 'Share Name',
          'mData'   : DataProp.CAPACITY_ENTITY_DETAILS,
          'mRender' : function(data, type, full) {
            return data[DataProp.SHARE] || AppConstants.NOT_AVAILABLE;
          }
        },
        {
          'sTitle': 'Net Capacity Change',
          'mData': DataProp.CAPACITY_ADDED,
          'sType': 'numeric',
          'mSort': function(data, type, full) {
            return full.added - full.removed;
          },
          'mRender': function(data, type, full) {
            let change =
              full[DataProp.CAPACITY_ADDED] - full[DataProp.CAPACITY_REMOVED];
            let units = StatsUtil.determineDataSizeUnit([Math.abs(change)]);
            return StatsUtil.unitsConversion(change, units)
              + ' ' + units;
          }
        },
        {
          'sTitle'  : 'Capacity Added',
          'mData'   : DataProp.CAPACITY_ADDED,
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;
          }
        },
        {
          'sTitle'  : 'Capacity Removed',
          'mData'   : DataProp.CAPACITY_REMOVED,
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            let units = StatsUtil.determineDataSizeUnit([data]);
            return StatsUtil.unitsConversion(data, units)
              + ' ' + units;
          }
        }
      ];

      return retArray;
    },

    // @override
    // Overriden to update the fetch url with the next page id instead of
    // page count
    refreshData: function(options) {
      // Get meta data and update the new url with next page id
      const modelMetaData = this.model.getMetaData();
      if (Object.keys(modelMetaData).length &&
        modelMetaData[DataProp.NEXT_PAGE_ID]) {
        // Check if next page id is already in the list or not
        // if in the list dont push else push
        let indexOfNextPageId =
          this.PAGE_ID_LIST.indexOf(modelMetaData[DataProp.NEXT_PAGE_ID]);
        if (indexOfNextPageId < 0) {
          this.PAGE_ID_LIST.push(modelMetaData[DataProp.NEXT_PAGE_ID]);
        }
        this.model.updateUrl(this.PAGE_ID_LIST[this.currentPage - 1]);
      }

      let _this = this,
          modelData = this.model.models,
          params = options && options.params ? options.params : {
            success : function(data) {
              data.models = modelData.concat(data.models);
              _this.switchNextPage();
            },
            error: function(model, xhr) {
              _this.onDataError(xhr);
            }
          };

      this.model.fetch(params);
    },

    // @private
    // Return the file path of the file corresponding to file id.
    getFilePath: async function(e) {
      const currentTarget = $(e.currentTarget).find('[data-toggle="popover"]');
      let _this = this,
          fileTmpl = '',
          fileId = currentTarget.attr('actionTargetFile'),
          filePathTemplate = _.template('<span><%= path %></span>'),
          popOverId = $('div#' + currentTarget.attr('aria-describedby') +
            ' .n-details-table-tip');

      if (this.filePaths.hasOwnProperty(fileId)) {
        // If ID exists in the local object, no need to hit the API again.
        // The tooltip text template.
        fileTmpl = filePathTemplate({
          path: _this.filePaths[fileId]
        });
        $(popOverId).html(fileTmpl);
        $(popOverId).html(fileTmpl);
      } else if (fileId.indexOf('_') < 0) {
        // This condition is to check if the folder(virtual folder i.e.
        // all files at TLDs are aggregated into single entity and treated as
        // '/' folder) is at root - ENG-264516
        // The tooltip text template.
        fileTmpl = filePathTemplate({
          path: AppConstants.ROOT_FOLDER
        });

        // Store it in the local object.
        _this.filePaths[fileId] = AppConstants.ROOT_FOLDER;

        // Update the path in the tooltip on success.
        $(popOverId).html(fileTmpl);
      } else {
        // If ID doesn't exist, hit the API to get the file path.
        const path = await FilesUtil.getFilePath(fileId);

        // The tooltip text template.
        fileTmpl = filePathTemplate({
          path: path
        });

        // Store it in the local object.
        _this.filePaths[fileId] = path;

        // Update the path in the tooltip on success.
        $(popOverId).html(fileTmpl);
      }
    },

    // @override
    // Overriding it to get the placement on the right
    // Returns the Hover placement for the column
    // @return hover over placement - top, bottom, left, right
    getHoverPlacement: function(column) {
      return 'right';
    },

    // @override
    // Returns the hover title for the column.
    // @param column - column
    // @return       - '' by default always
    getHoverTitle: function(column) {
      return '';
    },

    // @override
    // Returns the file path when mouse enters the element
    onPopoverCellMouseEnter: async function(e) {
      BaseTableView.prototype.onPopoverCellMouseEnter.call(this, e);
      await this.getFilePath(e);
      this.resetPopoverArrowPosition();
    }
  });

  return FolderCapacityDetailTableView;
});
