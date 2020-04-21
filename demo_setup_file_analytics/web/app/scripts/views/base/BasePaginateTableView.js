//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// BasePaginateTableView is a subclass of BaseTableView and is for
// server side pagination.
//
define([
  // Core
  'views/base/BaseTableView'],
function(
  // Core
  BaseTableView) {

  'use strict';

  var BasePaginateTableView = BaseTableView.extend({

    // set renderChart default to true, if value is set to false then
    // table is not redrawn during refreshData function call
    initialize: function(options) {
      if (options) {
        this.renderChart = typeof options.renderChart !== 'undefined'
          ? options.renderChart : true;
      }
      BaseTableView.prototype.initialize.call(this, options);
    },

    refreshData: function(page) {
      // Dont fetch
      this.dataTable.fnPageChange('next');
      // Do not override pagination settings and redraw table
      // if renderChart is set to false
      if (this.renderChart) {
        const oSettings = this.dataTable.fnSettings();
        const records = this.model.toJSON();
        oSettings.oApi._fnDraw(oSettings);
        // redraw the table to show charts
        this.dataTable.fnAddData(records, false);
        // Get the no of records that need to be displayed on page
        // Below functions are called at standingRedraw in BaseTableView
        // Since it calls _fnCalculateEnd in jquery.dataTables.js
        // to calculate the last page rows, we are overriding it here
        // when the pagination is local
        this.dataTable.fnSettings().aiDisplay =
          this.dataTable.fnSettings().aiDisplayMaster =
            Array.from(Array(records.length).keys());
      }
      this.hideLoading();
    },

    // @private
    // Update the table based on filtered data received
    updateTable: function(source) {
      // Clear the table
      this.dataTable.fnClearTable();
      const finalData = source || this.model.toJSON();
      this.resetSettings();
      this.updatePaginator(this.dataTable.fnSettings());
      this.insertDataRows(finalData);
    },

    // @private
    // Displays number of rows to show in the table based on selected range
    handleChangeRangeClick: function(e) {
      this.defaultMinRows =
        parseInt($(e.currentTarget).attr('data-id'), 10);
      this.currentPageLength = this.defaultMinRows;
      this.dataTable.fnSettings()._iDisplayLength = this.defaultMinRows;
      this.dataTable.fnSettings()._iDisplayStart = 0;
      this.updateTable(this.model.toJSON());
      // Update range dropdown
      this.$('.page-size-option').removeClass('selected');
      this.$('.page-size-option .page-size-link[data-id="' +
        this.defaultMinRows + '"]').parent('.page-size-option')
        .addClass('selected');
    },

    // @override
    // Show previous page should not remove the models
    goToPreviousPage: function() {
      if (this.totalViewablePages <= 1 || this.currentPage <= 0) {
        return;
      }
      this.currentPage--;
      this.dataTable.fnPageChange('previous');
    }
  });

  return BasePaginateTableView;
});
