//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// BaseTableView is the base class of all the table views.
//
define([
  // Core
  'datatable',
  'views/base/BaseView',
  'views/base/DataTableTemplates',
  'views/base/datatables/DataTableColResizeMixin',
  // Managers
  'managers/PopupManager',
  // Data
  'data/DataProperties',
  // Views
  'utils/DataExportUtil',
  'utils/AppConstants'],
function(
  // Core
  datatable,
  BaseView,
  DataTableTemplates,
  DataTableColResizeMixin,
  // Managers
  PopupManager,
  // Data
  DataProp,
  // Views
  DataExportUtil,
  AppConstants) {

  // Template for showing popover tooltip on cell hover.
  var tablePopoverTemplate = _.template(
    '<div class="n-details-table-tip">' +
      ' <%= tipText %>' +
      '</div>');

  var BaseTableView = BaseView.extend(_.extend({

    // Enable hover or not
    hoverEnabled: false,

    // Datatable initial settings object.
    dataTableSettings: {
      // Properties
      'sDOM'              : 'rt',
      'bProcessing'       : true,
      'bLengthChange'     : false,
      'bPaginate'         : true,
      'bFilter'           : true,
      'bInfo'             : false,
      'bScrollCollapse'   : true,
      'bAutoWidth'        : false,
      'oLanguage'         : { 'sEmptyTable': '&nbsp;',
                              'sZeroRecords': '' },
      // Styling of the jQuery UI widget
      'bJQueryUI'         : false
    },

    // The dataTable DOM element
    dataTable: null,

    // Show settings option
    showSettings: false,

    model: null,
    defaultMinRows: 10,
    currentFetchPage: 1,
    currentPageLength: 10,

    // Show/hide header options
    leftHeader: true,
    rightHeader: true,
    tableHeader: true,

    // Search box in the header
    headerSearchBox: false,

    // Page id list, need to maintain in case pagination is handled using
    // next_page_id instead of standard page count
    PAGE_ID_LIST: [],

    // @override
    className: 'n-base-data-table',

    // @override
    events: {
      'click .btnPrevious'             : 'goToPreviousPage',
      'click .btnNext'                 : 'goToNextPage',
      'input .tableFilter'             : 'onTableFilter',
      'input .tableFilterChange'       : 'onTableFilterChange',
      'click .n-table-filter-wrapper > .n-icon-search' : 'onClearClicked',
      'click .auditHistory'            : 'handleAuditHistoryClick',
      'click .baseDataTable th'        : 'resetModelData',
      'click .page-select-dropdown a'  : 'handleChangeRangeClick'
    },

    // Hover mouse event for popover supports
    hoverMouseEvents: {
      'mouseenter .baseDataTable tbody tr td:has("[data-toggle=popover]")' :
        'onPopoverCellMouseEnter',
      'mouseleave  .baseDataTable tbody tr td:has("[data-toggle=popover]")' :
        'onPopoverCellMouseLeave'
    },

    // @override
    modelEvents: {
      // 'reset    model' : 'onDataChange',
      // 'reset    model' : 'updateTable',
      // 'error    model' : 'onDataError',
      // 'remove model': 'onDataChange'
      // 'pending  model' : 'onDataLoading'
    },

    // @override
    initialize: function(options) {
      this.currentPage = 0;
      if (options.defaultMinRows) {
        this.defaultMinRows = options.defaultMinRows;
        this.currentPageLength = this.defaultMinRows;
      }

      BaseView.prototype.initialize.call(this);
    },

    // @private
    // Initialize the datatable settings object.
    initializeDataTableSettings: function(options) {
      var _this = this;
      // By default UI show pages navigation controls
      this.dataTableSettings.bPaginate = true;
      if (this.options.bProcessing !== '') {
        this.dataTableSettings.bProcessing = this.options.bProcessing;
      }

      if (options) {
        this.defaultMinRows = options.defaultMinRows;
      }
      _.extend(this.dataTableSettings, {
        'iDisplayLength': this.defaultMinRows,
        'aaSorting': this.getDefaultSort(),
        'aoColumns': this._getDefaultColumnsWrapper(),
        // Callback Functions:
        // Draws minimum rows of the table
        'fnDrawCallback': function(oSettings) {
          _this._dataTableDrawCallback(oSettings, this);
        },
        // Adds attributes to the row and updates the row selection
        'fnRowCallback': function(nRow, aData, iDisplayIndex) {
          _this._dataTableRowCallback(nRow, aData, iDisplayIndex);
        }
      }, DataTableColResizeMixin.getColResizeDataTableSettings(this));
    },

    // @private
    // Render views
    render: function(){
      this.initializeDataTableSettings();
      // First add the template setting the view's template

      // Commenting the below code as a fix for ENG-181975.
      // if (this.options.isPageSizeChanged) {
      //   this.$el[0].style.minHeight = this.$el[0].clientHeight + 'px';
      //   this.options.isPageSizeChanged = false;
      // }
      this.$el.empty();
      this.$el.append(DataTableTemplates.BAR_HEADER)
          .append(DataTableTemplates.DATATABLE)
          .append(DataTableTemplates.NO_DATA)
          .append(DataTableTemplates.LOADING);

      this.dataTable =
        this.$('.baseDataTable').dataTable(this.dataTableSettings);

      this.renderSubViews();
      if (this.dataTableSettings.bLengthChange) {
        this.$('.dataTables_length select').fancySelect();
      }

      return this;
    },

    // Method to reset model data when sorting is applied on datatable.
    // When datatable sorts the data it reset the page to first page, so need
    // to remove the model data for other pages as clicking on pagination next
    // btn, data is fetched for that page
    resetModelData: function() {
      let oSettings = this.dataTable.fnSettings();
      let pagingInfo = this.getPagingInfo(oSettings);
      // Check if sorting is applied to datatable
      if (oSettings.aaSorting.length > 0 && pagingInfo.iPage === 1
        && pagingInfo.iStart === 1) {
        let modelData = this.model.models;
        if (modelData.length > this.currentPageLength) {
          modelData.splice(this.currentPageLength);
        }
        // Set the current page to 0 as the data table is now at first page
        this.currentPage = 0;
        // Update the pagination settings to enable/disable previous/next btns.
        this.updatePaginator(oSettings);
      }
    },

    // @private
    // Fetch data
    fetchModel: function(options) {
      this.showLoading();
      let _this = this,
          params = options && options.params ? options.params : {
            success : function(data) {
              // Update default rows if number of total records is less than
              // the default min rows selected, this prevents from adding blank
              // rows, default min rows should not be less than 10
              if (_this.defaultMinRows > 10 &&
                _this.defaultMinRows > _this.model.getMetaDataTotalCount()) {
                _this.defaultMinRows =
                  _this.model.getMetaDataTotalCount() < 10 ?
                    10 : _this.model.getMetaDataTotalCount();
              }
              _this.onActionSuccess(data);
            },
            error: function(model, xhr) {
              _this.onDataError(xhr);
            }
          };
      // Add params if type is 'POST' call
      if (options && options.type === 'POST') {
        params.type = 'POST';
        const payload = this.model.getRequestPayload();
        if (options && options.data && Array.isArray(options.data)) {
          params.data = (options && options.data.length) ?
            _.extend(payload, options.data[0]) : payload;
        } else if (options && options.data) {
          params.data = options.data || {};
        }
      } else if (options && options.data) {
        this.model.setFilterUrl(options.data);
      }

      this.model.fetch(params);
    },

    // @private
    // On successful fetch insert data into rows
    onActionSuccess: function(data) {
      this.resetSettings();

      var finalData = this.model.toJSON();

      // Prepend "DataTableTemplates.HEADER_LEFT" only once
      if (this.$el.find('.n-header .n-header-left').length === 0) {
        this.$('.n-header').prepend(_.template(DataTableTemplates.HEADER_LEFT, {
          totalRecords: this.model.getMetaDataTotalCount()
        }));
      }

      this.insertDataRows(finalData);

      // Show or hide header options
      this.customiseTableHeader();
    },

    // @override
    // Overriden to clear the table in case of any error
    onDataError: function(xhr) {
      // Clear the table
      this.dataTable.fnClearTable();
      BaseView.prototype.onDataError.call(this, xhr);
    },

    // @private
    // Show or hide header options
    customiseTableHeader: function() {
      // To show/hide table header.
      if (!this.tableHeader) {
        this.$el.find('.n-header').hide();
        return;
      }

      // To show/hide left section of the table header.
      if (!this.leftHeader) {
        this.$el.find('.n-header .n-header-left').hide();
      }

      // To show/hide right section of the table header.
      if (!this.rightHeader) {
        this.$el.find('.n-header .n-header-right').hide();
      }

      // Hide search in the header
      if (!this.headerSearchBox) {
        this.$el.find('.n-header .n-header-right .n-sep, \
          .n-header .n-header-right  .n-table-filter-container').hide();
      }
    },

    // @private
    // Reset setting as required
    resetSettings: function() {
      this.currentPage = 0;
      this.totalViewablePages = Math.ceil(
        this.model.getMetaDataTotalCount() / this.defaultMinRows);
    },

    // @private
    // Render subviews
    renderSubViews: function() {
      // Header: Set the Paginator (highly coupled with this component)
      this.$('.n-header').prepend(_.template(DataTableTemplates.HEADER_RIGHT, {
        defaultMinRows: this.defaultMinRows
      }));

      if (!this.showSettings) {
        this.$('.n-settings-container').hide();
      }
    },

    // @private
    // Returns a list of data columns based on the entity type
    getDefaultSort: function() {
      return [];
    },

    // @private
    // function to get the columns for the entityType and prepend cluster
    // column if needed.
    _getDefaultColumnsWrapper: function() {
      var retArray = this.getDefaultColumns();
      this.addSortParameter(retArray);
      return retArray;
    },

    // @private
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function(entityType, pageId) {
      return this.getDataColumns();
    },

    // @private
    // Function called to return an array of data objects describing the
    // data columns of the entity type.
    getDataColumns: function(entityType, pageId) {
      // Default Columns
      //----------------
      var retArray = [
        // Name
        {
          'sTitle' : 'name',
          'sWidth' : '70%'
        },
        {
          'sTitle' : 'Action',
          'sWidth' : '30%'
        }];

      return retArray;
    },

    // @private
    // Callback for Datatable fnDrawCallback setting.
    _dataTableDrawCallback: function(oSettings, dataTable) {
      var fnUpdatePaginator = _.bind(this.updatePaginator, this);
      // Add rows if result is less than the minimum # of rows
      var numcolumns = dataTable.oApi._fnVisbleColumns(oSettings);
      this.fnAddRows(dataTable, numcolumns, this.defaultMinRows);

      // Update the paginator
      fnUpdatePaginator(oSettings);
      this.onDrawCallback(oSettings);
    },

    // Function called to make sure that the minimum rows in the dataTable
    // appears even though the data returned is less than the minimum rows.
    // The DataTable component doesn't do this by default.
    fnAddRows: function(obj, numberColumns, targetRows) {
      // data rows objects currently in the DOM
      var tableRows = obj.find('tbody tr'),
        numberNeeded = 0;

      // how many blank rows are needed to fill up to targetRows
      if (targetRows === this.defaultMinRows) {
        numberNeeded = targetRows - tableRows.length;
      } else {
        numberNeeded = this.defaultMinRows - tableRows.length;
      }

      // cache the last data row
      var lastRow = tableRows.last(),
      // how many visible columns are there?
      lastRowCells = lastRow.children('td'),
      cellString,
      highlightColumn,
      rowClass;

      // The first row to be added actually ends up being the last row of
      // the table. Check to see if it should be odd or even. Expand logic
      // if more than even/odd needed.
      if (targetRows % 2) {
        rowClass = "odd";
      } else {
        rowClass = "even";
      }

      // We only sort on 1 column, so let's find it based on its classname
      lastRowCells.each(function(index) {
        if ($(this).hasClass('sorting_1')) {
          highlightColumn = index;
        }
      });

      // Iterate through the number of blank rows needed, building a string
      // that will be used for the HTML of each row. Another iterator inside
      // creates the desired number of columns, adding the sorting class to
      // the appropriate TD.
      var i, j;
      for (i=0; i < numberNeeded ; i++) {
        cellString = "";
        for (j=0; j < numberColumns; j++) {
          if (j === highlightColumn) {
            cellString += '<td class="sorting_1">&nbsp;</td>';
          } else {
            cellString += '<td>&nbsp;</td>';
          }
        }

        // Add the TR and its contents to the DOM, then toggle the even/odd
        // class variable in preparation for the next. Add 'row_blank' to
        // make sure row is not selected when clicked.
        lastRow.after('<tr class="' + rowClass + ' row_blank">' +
          cellString + '</tr>');
        rowClass = (rowClass === "even") ? "odd" : "even";
      }
    },

    // @private
    // Draw data rows
    insertDataRows: function(source) {
      if (source.length > 0) {
        this.dataTable.fnAddData(source, false);

        // Redraw the table and keep the page and filter.
        this.standingRedraw(this.dataTable.fnSettings());
        this.$('.noData').hide();
        this.$('.n-header-right').show();
        this.$('.dataTables_length').show();
      } else {
        this.$('.noData').show();
        this.$('.n-header-right').hide();
        this.$('.dataTables_length').hide();
      }
      this.hideLoading();
    },

    // @private
    // Drawing of the table is complete.
    onDrawCallback: function(oSettings) {
      //By default we do nothing
      // To be overridden as necessary
      var pagingInfo = this.getPagingInfo(oSettings);
      this.preFetchPageCount = 10;
      this.currentPageLength = pagingInfo.iLength;
    },

    // @private
    // Redraw the table (i.e. fnDraw) to take account of sorting and
    // filtering, but retain the current pagination settings.
    standingRedraw: function(oSettings) {
      if(oSettings && oSettings.oFeatures.bServerSide === false) {
        var before = oSettings._iDisplayStart;

        oSettings.oApi._fnReDraw(oSettings);

        // iDisplayStart has been reset to zero - so lets change it back
        oSettings._iDisplayStart = before;
        oSettings.oApi._fnCalculateEnd(oSettings);
      }

      // draw the 'current' page
      if(oSettings.oApi) {
        oSettings.oApi._fnDraw(oSettings);
      }

      // If the current page doesn't have rows after a redraw, then proceed
      // to the first page. It could mean that the only displayed last
      // element was deleted at the last page.
      if (this.$('.baseDataTable  tbody  tr').length === 0) {
        this.goToFirstPage();
      }
    },

    // @private
    // Call back for Datatable fnRowCallback setting.
    _dataTableRowCallback: function(nRow, aData, iDisplayIndex) {
      return nRow;
    },

    // @private
    // Changes the page info and the page buttons
    updatePaginator: function(oSettings) {
      if (this.model.models.length === 0) {
        return;
      }

      // If this.bPaginate setted to false - hide pagination controls
      // and return. Else show pagination controls and proceed function.
      this.changePaginatorVisibility(this.dataTableSettings.bPaginate);
      if (!this.dataTableSettings.bPaginate) {
        return;
      }

      var pagingInfo = this.getPagingInfo(oSettings),
          totalResults = this.model.getMetaDataTotalCount();

      pagingInfo.iTotalPages = Math.ceil(
        this.model.getMetaDataTotalCount() / this.defaultMinRows);

      // Calculate the end value as it data is fetched when we move to next
      // page but not on previous page
      // var currentEndVal = (this.defaultMinRows * (this.currentPage + 1));
      // var end = (totalResults - currentEndVal + this.defaultMinRows) >
      //   this.defaultMinRows ? currentEndVal : totalResults;

      var templateInfo,
          entity        = 'Results',
          currentPage   = pagingInfo.iPage,
          totalPages    = pagingInfo.iTotalPages,
          start         = pagingInfo.iStart,
          filteredTotal = pagingInfo.iFilteredTotal,
          filteredTotal = totalResults,
          end = pagingInfo.iEnd,
          total         = totalResults;

      // Determine if previous button should be enabled or not
      if (this.totalViewablePages <= 1 || this.currentPage <= 0) {
        this.$('.btnPrevious').addClass('n-disabled');
      } else {
        this.$('.btnPrevious').removeClass('n-disabled');
      }
      // Determine if next button should be enabled or not
      if (this.totalViewablePages <= 1 ||
        this.currentPage >= (this.totalViewablePages - 1)) {
        this.$('.btnNext').addClass('n-disabled');
      } else {
        this.$('.btnNext').removeClass('n-disabled');
      }

      // Total number of entities available with the current filter.
      this.totalFilteredRows = filteredTotal;

      // Choose the page info template based on the min rows
      if (filteredTotal > this.defaultMinRows) {
        // For multiple paging
        templateInfo = DataTableTemplates.PAGE_INFO_PAGES;
      } else {
        // Only 1 page
        templateInfo = DataTableTemplates.PAGE_INFO_PAGE;
      }

      // Update the page info
      this.$('.n-page-info').html( templateInfo({
        start  : start,
        end    : end,
        total  : filteredTotal,
        entity : entity,
        entityType: 'Results'
      }));

      if (filteredTotal < total) {
        // Show that the total on the table is filtered.
        var filterText = " (filtered from " + total + ")";
        this.$('.n-page-info').append(filterText);
      }
    },

    // @private
    // Returns the paging info
    getPagingInfo: function (oSettings) {
      oSettings = oSettings || this.dataTable.fnSettings();
      return {
        "iStart"  :       oSettings._iDisplayStart + 1,
        "iEnd"    :       oSettings.fnDisplayEnd(),
        "iLength" :       oSettings._iDisplayLength,
        "iTotal"  :       oSettings.fnRecordsTotal(),
        "iFilteredTotal": oSettings.fnRecordsDisplay(),
        "iPage"   :       (oSettings._iDisplayLength === -1 ?
                            0 : Math.ceil( oSettings._iDisplayStart /
                              oSettings._iDisplayLength )) + 1,
        "iTotalPages":    oSettings._iDisplayLength === -1 ?
                            0 : Math.ceil( oSettings.fnRecordsDisplay() /
                              oSettings._iDisplayLength )
      };
    },

    // Function changes visibility of paginator controls
    // @param Boolean isVisible
    changePaginatorVisibility: function(isVisible) {
      var controls = ['.n-page-info', '.right-header-wrapper'];
      _.each(controls, function(selector) {
        if (isVisible) {
          this.$(selector).removeClass('hide');
        } else {
          this.$(selector).addClass('hide');
        }
      }, this);
    },

    // @private
    // Show previous page
    goToPreviousPage: function() {
      if (this.totalViewablePages <= 1 || this.currentPage <= 0) {
        return;
      }

      this.currentPage --;
      this.dataTable.fnPageChange('previous');
      this.removeDataFromModel();
    },

    // @private
    // Remove last page data from model. Need to do this because
    // clicking on next we retrieve the records and concatenate in model,
    // so clicking on previous should remove the records from model
    removeDataFromModel: function() {
      let modelData = this.model.models;
      // Get the last page rows count
      let remainder = (modelData.length % this.currentPageLength);
      let rowsToRemove;
      // Check to get the number of rows to remove from model.
      // If the remainder is > 0 then we need to remove the remainder rows.
      // If the remainder is 0 then we need to remove the current page
      // length number of rows
      if (remainder > 0) {
        rowsToRemove = remainder;
      } else {
        rowsToRemove = this.currentPageLength;
      }
      // remove the rows from model
      modelData.splice(modelData.length - rowsToRemove, rowsToRemove);
    },

    // @private
    // Show next page
    goToNextPage: function() {
      // Show loading
      this.showLoading();

      // this.currentPage starts from 0
      // Check for max records that can be returned from API.
      // If total records exceeds max records then show alert popup
      // with appropriate message.
      if (this.isMaxRecordsReached()) {
        this.showMaxRecordsAlertPopup();
        return;
      }

      if (this.totalViewablePages <= 1 ||
        this.currentPage >= (this.totalViewablePages - 1)) {
        this.hideLoading();
        return;
      }
      // Return if next button is disabled
      if (this.$('.btnNext').hasClass('n-disabled')) {
        return;
      }

      // Disable next button untill API response is successful
      this.$('.btnNext').addClass('n-disabled');

      // Fetching on each page
      this.currentPage ++;
      this.refreshData();
    },

    // Checks whether max records have reached for table
    isMaxRecordsReached: function() {
      return this.model.models.length >= AppConstants.DEFAULT_MAX_TABLE_ROWS &&
        this.model.getMetaDataTotalCount() >
        AppConstants.DEFAULT_MAX_TABLE_ROWS;
    },

    // Shows the alert popup when max records are reached.
    showMaxRecordsAlertPopup: function() {
      let options = {
        action : AppConstants.ENTITY_ALERT,
        actionTarget : AppConstants.ENTITY_ALERT,
        actionRouteOverlay : true,
        message   : AppConstants.DEFAULT_MAX_TABLE_ROWS + ' records' +
                  ' retrieved. Modify the search text/parameter to improve' +
                  ' the search results'
      };
      PopupManager.handleAction(options);
    },

    // @private
    // Returns the current columns of table
    getCurrentColumns: function() {
      return this.dataTable.fnSettings().aoColumns;
    },

    // @private
    // Export data in different formats
    // @param: type - type of format in which the user wants data.
    // Ex: csv, json etc
    // @param: model - data model to be exported
    exportData: function(type, model, options) {
      let _this = this,
          params = {
            success: function() {
              if (type === 'csv') {
                DataExportUtil.exportTableCSV(
                  model.toJSON({ includeAttribute : true,
                    includeCustomAttributes: true }),
                  _this.getCurrentColumns()
                );
              } else if (type === 'json') {
                DataExportUtil.exportTableJSON(
                  model.toJSON({ includeAttribute : true,
                    includeCustomAttributes: true }),
                  _this.getCurrentColumns()
                );
              }
            },
            error: function(model, xhr) {
              _this.onDataError(xhr);
            }
          };

      // Add params if type is 'POST' call
      if (options && options.type === 'POST') {
        params.type = 'POST';
        params.data = options.data || {};
      }
      model.fetch(params);
    },

    // @private
    // Returns the table data JSON for the model
    // idAttribute and nameAttribute must be included in the JSON.
    // @return the the table data - this.model.toJSON()
    modelToJSON: function(){
      // NOTE: Set the 'includeAttribute' to true so that the dynamic
      // attributes can be included in the JSON array.
      // includeCustomAttributes is currently used for getting the
      // right usage stats.  See HostModel, StoragePoolModel,
      // DiskModel and ContainerModel toJSON methods.
      return this.model.toJSON({ includeAttribute : true ,
          includeCustomAttributes: true});
    },

    // @private
    // Re-draws the table with latest data
    onDataChange: function() {
      // Hide loading and error
      this.hideLoading();
      this.$('.n-error').hide();

      // Destroy any table popover
      this._removePopovers();

      // Clear the table
      this.dataTable.fnClearTable();

      var source = this.modelToJSON();

      // Refresh the dataTable with new data if there's any
      if (this.model && source.length) {
        // Add the data but don't redraw the table yet because
        // we want to keep the page.
        this.dataTable.fnAddData(source, false);
        // Redraw the table and keep the page and filter.
        this.standingRedraw(this.dataTable.fnSettings());
      }
    },

    // @private
    // Jump to next page and update the table with data for next page
    switchNextPage: function() {
      this.onDataChange();
      // this.updatePaginator();
      // var oSettings = this.dataTable.fnSettings();
      // oSettings._iDisplayStart = this.currentPage * oSettings._iDisplayLength;
      // this.initializeDataTableSettings();
      // this.updatePaginator(oSettings);
      this.dataTable.fnPageChange('next');
    },

    // @private
    // Return true if the client side page position went past
    // the current server prefetched page.
    isFetchNeeded: function() {
      // Calculate the mapping of the server side page based on client
      // side page position.
      var newPageNum =
        Math.floor((this.currentPage  - 1) / this.preFetchPageCount)  + 1;

      if (newPageNum === this.currentFetchPage) {
        return false;
      }

      // The new page is different then the current server page.
      this.currentFetchPage = newPageNum;
      return true;
    },

    // @private
    // Fetch data. NOTE: this will always cancel any pending request and
    // force a new fetch.
    refreshData: function(options) {
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
      // Add params if type is 'POST' call
      if (options && options.type === 'POST') {
        params.type = 'POST';
        params.data = options.data || {};
        params.data.page = this.currentPage;
      } else {
        let filter = [];
        filter.push({ 'page' : this.currentPage });
        this.model.setFilterUrl(filter);
      }

      this.model.fetch(params);
      // this.$('.n-loading-wrapper').show();
      // var filter = [];
      // filter.push({ 'page' : this.currentPage });
      // this.model.setFilterUrl(filter);
      // var modelData = this.model.models;
      // this.model.fetch({
      //   success: function(data) {
      //     data.models = modelData.concat(data.models);
      //     _this.switchNextPage();
      //   }
      // });
    },

    // @private
    // Show first page
    goToFirstPage: function() {
      this.dataTable.fnPageChange('first');
    },

    // @private
    // Show last page
    goToLastPage: function() {
      this.dataTable.fnPageChange('last');
    },

    // @private
    // Handler for table filter input.
    onTableFilter: function(event) {
      var text = $(event.currentTarget).val();
      this.dataTable.fnFilter(text);
      this.updatePaginator(this.dataTable.fnSettings());
    },

    // @private
    // Clear table filter input and triggers handler for it
    onClearClicked: function(event) {
      this.$('.tableFilter').val('');
      // Trigger onTableFilter function
      this.$('.tableFilter').trigger('input');
    },

    // @private
    // Handler for updateTableFilterIconState
    onTableFilterChange: function(event) {
      var text = $(event.currentTarget).val();
      this.updateTableFilterIconState(text);
    },

    // @private
    // Changes spotlight icon to clear icon if table filter
    // input contains a value
    updateTableFilterIconState: function(text) {
      var iconEl = this.$('.n-table-filter-wrapper > .n-icon-search');

      // If empty - change to spotlight icon
      if (text === '') {
        iconEl.attr('data-icon','B');
        iconEl.removeClass('n-icon-clear');
      }
      // If not empty - change to clear icon
      else {
        iconEl.attr('data-icon','v');
        iconEl.addClass('n-icon-clear');
      }
    },

    // @private
    // Update the table based on filtered data received
    updateTable: function(source) {
      // Clear the table
      this.dataTable.fnClearTable();
      var finalData = this.model.toJSON();
      this.resetSettings();
      this.updatePaginator(this.dataTable.fnSettings());
      this.insertDataRows(finalData);
    },

    // @private
    // Event handler -- Add button on a filter
    // filterId: id to access the filter when action performed
    // filterTitle: type of filter operation performed by user, visible to user
    // operator: separator between filterTitle and fDispVal
    // fDispVal: filter value selected by user, visible to user
    // filterVal: value of filter performed to be used to make query to backend
    onAddFilter: function(filterId, filterTitle, operator, fDispVal,filterVal) {
      var filterTags = DataTableTemplates.FILTER_EQUALS_TEMPLATE({
            filterId: filterId,
            filterTitle: filterTitle,
            operator : operator,
            displayFilterVal: fDispVal,
            filterVal : filterVal
          });
      if (!this.$('.query-bar')[0]) {
        this.$('.n-header').append(DataTableTemplates.QUERY_BAR);
      }
      if(filterId === 'start-date' || filterId === 'end-date') {
        if (!this.$('.query-bar .' + filterId)[0]) {
          this.$('.query-bar').append(filterTags);
        }
      } else {
        if (!this.$('.query-bar .' + filterVal + '_tag .' + filterId)[0]) {
          this.$('.query-bar').append(filterTags);
        }
      }
    },

    // @private
    // Event handler -- remove button on a filter
    onRemoveFilter : function(e) {
      var filterType = $(e.currentTarget).attr('data-id');
      var filterVal = $(e.currentTarget).attr('data-val');
      var filterTag = $(e.currentTarget).parent('.filter-box');
      filterTag.remove();
    },

    // @override
    handleAuditHistoryClick: function(e) {},

    // @private
    // Displays number of rows to show in the table based on selected range
    handleChangeRangeClick: function(e) {
      this.defaultMinRows = parseInt($(e.currentTarget).attr('data-id'), 10);

      // Reset all settiings and page count to 0
      const filter = [];
      filter.push({
        [DataProp.COUNT]: this.defaultMinRows,
        [DataProp.PAGE]: 0,
        [DataProp.NEXT_PAGE_ID]: '',
        [DataProp.NEXT_BATCH_ID]: ''
      });

      // Update table settings
      this.dataTable.fnSettings()._iDisplayLength = this.defaultMinRows;
      this.dataTable.fnSettings()._iDisplayStart = 0;
      this.updatePaginator(this.dataTable.fnSettings());

      // Update range dropdown
      this.$('.page-size-option').removeClass('selected');
      this.$('.page-size-option .page-size-link[data-id="' +
        this.defaultMinRows + '"]') .parent('.page-size-option')
        .addClass('selected');

      // Clear the table
      this.dataTable.fnClearTable();

      // For a POST call, update the old request payload with new
      if (this.model.hasOwnProperty('payload')) {
        let oldRequestPayload = this.model.getRequestPayload();
        _.extend(oldRequestPayload, filter[0]);
        this.fetchModel();
      } else {
        // For a GET call, pass the filter
        this.fetchModel({ 'data': filter });
      }
    },

    // @override
    onStartServices: function() {
      this.delegateEvents();

      this.delegateModelEvents();

      // Check if this is a shared model/collection and if the initial fetch
      // has completed.
      this.fetchModel();
      // this.model.startPolling( this.getOptions() );
      // this.subViewHelper.iterate('startServices');
    },

    // Cancel the currently ongoing fetch, if any, that is part of the
    // regular polling and was initialized by onStartServices
    cancelCurrentModelFetch: function() {
      if (this.model) {
        this.model.stopFetch();
      }
    },

    // @override
    onStopServices: function() {
      this._removePopovers();
      this.undelegateEvents();
      this.undelegateModelEvents();
      // Shared model polling isn't started in this class.
      // if ( !this.sharedModel) {
      //   this.model.stopPolling();
      // }
      // this.subViewHelper.iterate('stopServices');
    },

    // Show loading
    showLoading: function() {
      this.$('.n-loading-wrapper').show();
      // Disable dropdown option on the widget title
      this.$('table').parents('.n-vantage-point')
        .find('.dropdown > button')
        .addClass('disabled');
    },

    // Hide loading
    hideLoading: function() {
      this.$('.n-loading-wrapper').hide();
      // Enable dropdown option on the widget title
      this.$('table').parents('.n-vantage-point')
        .find('.dropdown > button')
        .removeClass('disabled');
    },

    // Functions (Popover Tooltip)
    // ---------------------------

    // Enable the column popover on hover over for this table, and
    // register related mouse events for controlling the popover.
    // Make sure column needs hover must provide a column attribute
    // 'tmplHover' with a compiled template as a value, and the mRender
    // must return an element including an attribute 'data-toggle=popover'
    // which use to control the popover.
    // Example for the column
    // {  'sTitle': 'Hover Column',
    //    'tmplHover' : _template('<div>Column Info: <%= cellData %></div>'),
    //    'mRender': function (data, type, full) {
    //                return '<span data-toggle="popover">'+data+'</span>';
    //                // or call this.renderHoverCell(data);
    //               }
    // }
    enablePopoverOnHover: function() {
      this.hoverEnabled = true;
      // If the hover is enabled for this table than register
      // the mouse over and mouse out event
      this.addExtraEvents(this.hoverMouseEvents);
    },

    // Pause the popover on hover
    // @param pause - true to stop showing popover on hover,
    //                false to resume showing popover on hover
    pausePopoverOnHover: function(pause) {
      this.hoverEnabled = !pause;
    },

    // Returns the compiled hover template.
    // The column must have an attribute 'tmpHover' with a compiled
    // template as a value.
    // Subclass can override this to return the template based on the
    // cell data.
    // @param column - table column
    // @param cellData - cell data for the column
    // @return - compiled template for the column,
    //           null or undefined means no popover tooltip
    getHoverTemplate: function(column, cellData) {
      return column.tmplHover;
    },

    // Returns the evaluated string from the compiled tooltip template.
    // Subclass can override this if its compiled template has its
    // own data evaluation for rendering.
    // @param hoverTemplate - compiled template
    // @param rowData - model for the row
    // @param column - column of the cell data
    // @param cellData - cell data
    getHoverTooltip: function(hoverTemplate, rowData, column, cellData) {
      return hoverTemplate({
        rowData : rowData,
        mData   : column.mData,
        cellData: cellData });
    },

    // Returns the Hover placement for the column
    // @return hover over placement - top, bottom, left, right
    getHoverPlacement: function(column) {
      return 'top';
    },

    // Returns the hover title for the column.
    // @param column - column
    // @return       -  column's title by default or 'Details' if no title
    getHoverTitle: function(column) {
      let title = column.sTitle;
      return (title.length <= 0) ? 'Details' : title;
    },

    // Returns the element for the popover to be contained within
    getPopoverContainer: function() {
      return $('body');
    },

    // Returns a column renderer which rendering the data with popover
    // control attribute data-toggle="popover" and optional
    // data-id="<%=dataId%>" and class='<%=customClassName%>"
    // @param data - column data to be displayed
    // @param dataId - column data id (optional)
    // @param customClassName - custom data class name (optional)
    // @return - cell render
    renderHoverCell: function(data, dataId, customClassName) {
      let dataIdAttr = (dataId) ? 'data-id="' + dataId + '"' : '';
      return DataTableTemplates.HOVER_TABLE_CELL({
        value          : data,
        dataIdAttr     : dataIdAttr,
        customClassName: customClassName || ''
      });
    },

    // Returns the template for table popover
    // @return tablePopoverTemplate
    getTablePopoverTemplate: function() {
      return tablePopoverTemplate;
    },

    // Functions (Popover Event Handlers)
    // --------------------------------

    // Event handler for cell mouse over
    onPopoverCellMouseEnter: function(e) {
      if (!this.hoverEnabled) {
        return;
      }

      var cellElement = e.currentTarget;

      var linkElement = $(cellElement).find('[data-toggle=popover]');

      if (linkElement && linkElement.length > 0) {
        // Destroy the previous popover
        $(linkElement).popover('destroy');
      } else {
        // No popover control element for this cell
        return;
      }

      // Get cell position in the format of
      // [row index, column index (visible), column index (all)]
      var aPos = this.dataTable.fnGetPosition(cellElement);
      if (!aPos) {
        return;
      }

      // Get the cell data
      var cellData = this.dataTable.fnGetData(cellElement);
      // Get the data array for this row
      var rowData = this.dataTable.fnGetData(aPos[0]);
      // Extract column from the position
      var column = this.getCurrentColumns()[aPos[2]];

      // Check if it's a valid column and row has data
      if (!rowData || !column) {
        return;
      }

      var hoverTemplate = this.getHoverTemplate(column, cellData);
      // Check if there's a cell hover template available
      if (!hoverTemplate) {
        return;
      }

      if (!this.canShowTooltip(rowData)) {
        return;
      }

      // Generate the popover tooltip
      var tipHTML = tablePopoverTemplate({
        tipText: this.getHoverTooltip(hoverTemplate, rowData,
          column, cellData)
      });

      // Dynamically create the popover
      linkElement.popover({
        title: this.getHoverTitle(column),
        content: tipHTML,
        placement: this.getHoverPlacement(column),
        trigger: 'manual',
        html: true,
        container: this.getPopoverContainer()
      });

      linkElement.popover('show');

      // Bind event on popover shown
      this.setPopoverArrowPosition();
    },

    // This function has to be overriden in the child class.
    // It decides if the tooltip has to be shown for a particular row
    // or not.
    // @return - true if tooltip has to be shown
    //         - false if no tooltip needed.
    canShowTooltip: function(rowData) {
      return true;
    },

    // Event handler for cell mouse out
    onPopoverCellMouseLeave: function(e) {
      if (!this.hoverEnabled) {
        return;
      }
      // Destroy the popover
      $(e.currentTarget).find('[data-toggle=popover]').popover('destroy');
    },

    // @private
    // Remove all known popovers from the table
    _removePopovers : function() {
      this.$('[alert-popover="true"]').popover('destroy');
      this.$('[data-toggle="popover"]').popover('destroy');
    },

    // Sorts the columns that are converted to human readable units
    addSortParameter: function(returnArray) {
      $.each(returnArray, function(key, value) {
        let originalRender = typeof value.mRender !== 'undefined'
          ? value.mRender : null;
        let originalSort = typeof value.mSort !== 'undefined'
          ? value.mSort : null;
        let sType = typeof value.sType !== 'undefined'
          ? value.sType : null;

        if (sType && originalRender) {
          let render = function(data, type, full) {
            if (value.sType === 'numeric') {
              // if type is display or filter render DisplayFn
              if (type === 'display' || type === 'filter') {
                return originalRender(data, type, full);
              } else {
                // if sortFn exists, render the function else return raw data
                if (originalSort) {
                  return originalSort(data, type, full);
                }
                return data;
              }
            }
          };

          // update the column attribute with updated render function
          value.mRender = render;
        }
      });
    },

    // @private
    // Bind an event to bring the arrow of tooltip at appropriate position
    setPopoverArrowPosition: function() {
      const _this = this;
      $('[data-toggle=popover]').on('shown.bs.popover', function() {
        _this.resetPopoverArrowPosition();
      });
    },

    // @private
    // Bring the arrow of tooltip at appropriate position
    resetPopoverArrowPosition: function() {
      if ($('.popover').height() > 40) {
        $('.popover .arrow').css('top', parseInt(20, 10) + 'px');
      }
    }
  }, DataTableColResizeMixin.getDataTableColResizeMixin()));

  return BaseTableView;
});
