//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FilePermissionTableView enables the user to view the table with
// the file audit history.
//
define([
  // Views
  'views/base/BaseTableView',
  // Collection
  'collections/filepermission/FilePermissionCollection'],
function(
  // Views
  BaseTableView,
  // Collection
  FilePermissionCollection) {

  'use strict';

  var FilePermissionTableView = BaseTableView.extend({

    el: $('.n-base-data-table'),

    // Model for file permission.
    model: null,

    // @override
    initialize: function(options) {
      this.$el = options.el;
      this.dataTableSettings.searching = true;
      // Initialize the model.
      this.model = new FilePermissionCollection();

      this.setUrlParams(options.actionTargetId);

      options.actionTarget = 'permission';
      // Add extra events
      this.addExtraEvents({
        'click  .n-settings-container'  : 'handleDropdownToggle',
        'click  .btnExport'             : 'onExport'
      });
      BaseTableView.prototype.initialize.call(this, options);
    },

    // @override
    // Render the DOM
    render: function(){
      BaseTableView.prototype.render.call(this);
      // Remove the page navigation container.
      // this.$('.n-page-nav-container').remove();
      // Show the download reports button for this table
      // this.$el.find('.n-settings-container').show();
      // this.$el.find('.n-settings-container').hide();
      // this.$el.find('.n-page-info').hide();
      this.$el.find('.n-header').hide();
    },

    // @private
    // Handles the Cancel button click on the dropdown.
    // Closes the table dropdown if already opened.
    handleDropdownToggle: function(e) {
      // Check if download is in progress
      if (localStorage.getItem('download') !== 'enabled') {
        if (this.$('.settings-dropdown').hasClass('open')) {
          this.$('.settings-dropdown').removeClass('open');
        } else {
          this.$('.settings-dropdown').addClass('open');
        }
      }
    },

    // @private
    // Export as CSV or JSON
    onExport: function(e) {
      // // Check if download is in progress
      // if (localStorage.getItem('download') === 'enabled') {
      //   return;
      // }

      // let target = $(e.currentTarget);

      // var type = 'json';
      // if (target.hasClass('csv')) {
      //   type = 'csv';
      // }

      // // Disabled export option
      // localStorage.setItem('download', 'enabled');

      // var exportCollection = new FileAuditHistoryExportCollection();
      // let chunkCount = this.model._metadata.total;

      // // Get count of number of call to be made to export complete data set
      // let recursiveCallCount = 1, exportChunkCount = chunkCount;
      // if (chunkCount > AppConstants.DEFAULT_EXPORT_COUNT) {
      //   let exportChunk = AppConstants.DEFAULT_EXPORT_COUNT + 1;
      //   recursiveCallCount = Math.floor(chunkCount / exportChunk);
      //   if ((chunkCount % exportChunk)) {
      //     recursiveCallCount += 1;
      //   }
      //   exportChunkCount = exportChunk;
      // }

      // exportCollection.getURL(this.options.fileName, exportChunkCount,
      //   this.startTimeInMs, this.endTimeInMs);

      // var filter = this.getOperationFilter();
      // if (filter.length > 0) {
      //   exportCollection.setFilterUrl(filter);
      // }

      // // Make the progress on each fetch success
      // let progressStep = (1 / recursiveCallCount),
      //     progressBar = this.prepareProgressLoader();

      // // Export the data
      // this.exportData(type, exportCollection, recursiveCallCount, progressBar,
      //   progressStep);
    },

    // @private
    // Sets the parameter to create the URL.
    setUrlParams: function(searchVal) {
      this.model.getURL(searchVal);
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      var _this = this;
      var retArray = [
        {
          'sTitle'  : 'User / Group Name',
          'mData'   : function(source, type, val) {
            if (Object.keys(source).length) {
              return Object.keys(source)[0];
            }
          },
          'bSearchable' : true
        },
        {
          'sTitle'  : 'Permission',
          'mData'   : function(source, type, val) {
            if (Object.keys(source).length) {
              return source[Object.keys(source)[0]];
            }
          },
          'bSearchable' : true
        }];

      return retArray;
    }
  });

  return FilePermissionTableView;
});
