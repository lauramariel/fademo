//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// The BaseAuditHistoryWizardView enables the user to view the audit history page.
//
define([
  // Views/Models
  'views/base/BaseSubView',
  'views/base/DataTableTemplates',
  'views/filter/AuditFilterBarView',
  // Utils
  'utils/SubViewHelper',
  'utils/AppConstants',
  'utils/SVG',
  'utils/TimeUtil',
  // Components
  'components/Components',
  // Template
  'text!templates/AuditFilter.html'],
function(
  // Views/Models
  BaseSubView,
  DataTableTemplates,
  AuditFilterBarView,
  // References of util
  SubViewHelper,
  AppConstants,
  SVG,
  TimeUtil,
  // Components
  Components,
  // View Template
  filterTemplate) {

  'use strict';

  filterTemplate = _.template(filterTemplate);

  var viewTemplate = '<div class="graphWrapper"></div>' +
    '<hr><div class="tableWrapper n-base-data-table"></div>';

  viewTemplate = _.template(viewTemplate);

  // Extending the BaseSubView
  return BaseSubView.extend({

    name: 'BaseAuditHistoryWizardView',

    // Events
    events: {
      'click #reset_filter'           : 'resetFilters',
      'click .btnDateFilter'          : 'getDataFilteredByOperationAndTime',
      'keyup #searchInput'            : 'filterFunction',
      'click #audit_operatoin_filter' : 'toggleDropdown',
      'click .btnDropdownCancel'      : 'toggleDropdown',
      'click .btnDropdownOk'          : 'filterByOperations',
      'click .btnExport '             : '_closeCurrentMenu',
      'click .n-settings-container'   : 'onMenuClick',
      'click #selectAllOperations'    : 'selectAllOperations',
      'click .operation_chk'          : 'operationChkClick',
      'click .close-btn'              : 'onRemoveFilter',
      'click .reset-filters'          : 'onClearFilters'
    },

    // Check if operation dropdown is opened or closed.
    operationToggleValue: false,

    // Subview helper for this view.
    subViewHelper: null,

    // Check if view is rendered.
    viewRendered: false,

    // @override
    // initialize the view.
    initialize: function(options) {
      BaseSubView.prototype.initialize.apply(this, arguments);
      this.subViewHelper = new SubViewHelper();
    },

    // @override
    // Render the page.
    render: function() {
      // If view is already rendered, return.
      if (this.viewRendered) {
        return;
      }

      this.$el.html(viewTemplate);

      this.addFilterCheckboxes();

      this.$('.tableWrapper').append(DataTableTemplates.LOADING);

      // Get the audit history data for last one month
      this.getDefaultAuditHistory();
      this.viewRendered = true;
    },

    // @private
    // Fetches the audit history graph and table data for the
    // default time period i.e. last one month for the the operations.
    getDefaultAuditHistory: function() {
      // Start Date is the date before one month.
      let startDate = new Date();
      startDate = new Date(startDate.setDate(new Date().getDate() - 30));

      // Start date epoc time.
      let startTimeInMs = startDate.getTime();

      //  End date is today's date.
      let endDate = new Date();

      // End date epoch time.
      let endTimeInMs = endDate.getTime();

      // Set the start date to the date before one month.
      this.$('.n-int-input-start').datepicker('setDate', startDate);

      // Set the end date to today's date.
      this.$('.n-int-input-end').datepicker('setDate', endDate);

      // Render the audit history graph and table.
      this.renderAuditHistoryData(startTimeInMs, endTimeInMs);
    },

    // @private
    // Renders the audit history data in the graph as well as the table.
    // @param startTimeInMs - start time in ms.
    // @param endTimeinMs - end time in ms.
    renderAuditHistoryData: function(startTimeInMs, endTimeInMs) {
      // Plot the audit history graph.
      this.plotGraph(startTimeInMs, endTimeInMs);

      // Draw the audit history table.
      this.addAuditHistoryTable(startTimeInMs, endTimeInMs);
    },

    // @private
    // Render the filter bar area - filter bar area and fav-queries view
    // filtering/grouping options
    // @param filterOperations - Selected operation filter.
    renderFilterBar(filterOperations) {
      let operations = this.buildOperations(filterOperations);
      let filterBarView = this.subViewHelper.get('filterBarView');

      if (!filterBarView) {
        // If view is not already registered to subview helper
        filterBarView = new AuditFilterBarView({
          el : this.$('.query-bar')
        });

        // Register the view to subview helper.
        this.subViewHelper.register('filterBarView', filterBarView);
      }

      filterBarView.render(operations);
    },

    // @private
    // Build the operation dictionary.
    // @param filterOperations - Selected operation filter.
    buildOperations: function(filterOperations) {
      let operations = [];

      _.each(filterOperations, function(operation) {
        operations.push({
          filterId: operation,
          labelString: AppConstants.OPERATION[operation],
          tooltip : operation,
          Components : Components
        });
      });
      return operations;
    },

    // @private
    // Shows or closes the operation dropdown.
    toggleDropdown: function() {
      if (!this.operationToggleValue) {
        this.$('#audit_operatoin_filter_options').show();
        this.operationToggleValue = true;
        // Clear the input box and show all filter fields
        $('#searchInput').val('');
        this.$('#audit_operatoin_filter_options li').show();
        // Enable the OK button
        if (this.$('.btnDropdownOk').attr('disabled')) {
          this.$('.btnDropdownOk').removeAttr('disabled');
        }
      } else {
        this.$('#audit_operatoin_filter_options').hide();
        this.operationToggleValue = false;
      }
    },

    // Add the operation filter checkboxes.
    addFilterCheckboxes: function(auditOperations) {
      // Taking all the operations
      // Need to use for loop to iterate over a dictionary
      let operations = [], operation = [];
      for (let key in auditOperations) {
        operation = [];
        operation.push(key);
        operation.push(auditOperations[key]);
        operations.push(operation);
      }

      // Appends the operation template
      // And setting up the default values in the Date Range Filter
      // And gets the start/end time accordingly
      this.$('.graphWrapper').parent().prepend(filterTemplate({
        dropdown: SVG.SVGIcon('z', '-mini'),
        Components: Components,
        operations: operations
      }));

      this.$('.date-range-filter').datepicker({
        inputs         : this.$('.datepicker'),
        keepEmptyValues: false,
        autoclose      : true
      }).datepicker('update', '');
    },

    // @private
    // Applies filter by operation.
    filterByOperations: function() {
      this.getDataFilteredByOperationAndTime();
      this.toggleDropdown();
    },

    // @private
    // Validate the entered date i.e. the input start date should
    // not be greater than the input end date.
    validateDate: function() {
      let startDate = new Date(this.$('.n-int-input-start').val()),
          endDate = new Date(this.$('.n-int-input-end').val()),
          currentDate = new Date();

      // Date in format mm/dd/yyyy.
      let currentShortDate = TimeUtil.formatCurrentShortDate();

      if (endDate < startDate) {

        // If end date is smaller than the start date,
        // set the end date to the start date.
        this.$('.n-int-input-end').datepicker('setDate',
          this.$('.n-int-input-start').val());

      } else if (endDate > currentDate || startDate > currentDate) {
        if (endDate > currentDate) {
          // If end date is greater than current date, set the end date
          // as the current date.
          this.$('.n-int-input-end').datepicker('setDate', currentShortDate);
        }

        if (startDate > currentDate) {
          // If the start date is greater than the current date, set the
          // current date as the start date.
          this.$('.n-int-input-start').datepicker('setDate', currentShortDate);
        }
      }
    },

    // @private
    // Get the selected operations.
    getSelectedOperations: function() {
      let selectedOperations = [], val = null, _this = this;
      let totalOperations = this.$('.operations input');
      _.each(totalOperations, function(operation) {
        if (_this.$(operation).is(':checked')) {
          val = _this.$(operation).attr('name');
          selectedOperations.push(val);
        }
      });
      return selectedOperations;
    },

    // @private
    // Fetch the audit history data filtered on the basis of
    // date and operations.
    getDataFilteredByOperationAndTime: function() {
      let selectedOperations = this.getSelectedOperations();

      // Render the filter bar on the top.
      this.renderFilterBar(selectedOperations);

      this.getDataFilteredByTime();
    },

    // @private
    // Render the audit history data filtered on the basis of date.
    getDataFilteredByTime: function() {
      if (!(this.$('.operations input:checkbox:checked').length)) {
        this.$('.reset-filters').remove();
      }

      // Start and end date validation.
      this.validateDate();

      // Start date
      let startDateVal = this.$('.start-date-filter .n-int-input-start').val();
      let startTimeInMs = new Date(startDateVal).getTime();

      // End date
      let endDateVal = this.$('.end-date-filter .n-int-input-end').val();
      let endTimeInMs = new Date(endDateVal).getTime();

      // End-date time correction
      // Taking Today's date
      let todayDate = new Date();
      // Converting it to MM/DD/YYYY format
      let todayDateToDateString = todayDate.toLocaleDateString();
      // Making Date object from the input DateVal string
      let endDate = new Date(endDateVal);
      // Converting it to MM/DD/YYYY format
      let endDateToDateString = endDate.toLocaleDateString();

      if (todayDateToDateString === endDateToDateString) {
        // When end-date and current-date are same
        // taking the exact current time to get the results till that time
        endTimeInMs = todayDate.getTime();
      } else {
        // When end-date and current-date are not same, the end day's data
        // should be considered as well. So add the one day difference to the
        // end date so that it can be included in the calculation. If we don't
        // do so, we will miss out on the end day's data.
        let tomorrow = new Date();
        tomorrow.setDate(todayDate.getDate() + 1);
        // Taking difference of one day in milliseconds and subracting 2 ms so
        // that we can get the data till the end days 11:59.998 PM.
        let oneDayDiff = tomorrow - todayDate - 2;
        // Adding it to the end-date time to get the results of that day as well
        endTimeInMs += oneDayDiff;
      }

      this.renderAuditHistoryData(startTimeInMs, endTimeInMs);
    },

    // @override
    // Renders the file audit history graph.
    // @param startTimeInMs - the start time in milliseconds.
    // @param endTimeInMs - the end time in milliseconds.
    plotGraph: function(startTimeInMs, endTimeInMs) {
      // To be overridden in the child class.
    },

    // Fetches the table data again.
    redrawTable: function(filter) {
      // To be overridden in the child class.
    },

    // Remove all the applied filters.
    resetFilters: function() {
      this.unselectOperations();

      // Remove all filter tags
      this.$('.filter-box, .reset-filters').remove();

      // Get audit history for the default period i.e last one month.
      this.getDefaultAuditHistory();
    },

    // Remove the operation filters
    onClearFilters: function() {
      this.unselectOperations();

      // Remove all filter tags
      this.$('.filter-box, .reset-filters').remove();

      // Get audit history just on the basis of the time period selected.
      this.getDataFilteredByTime();
    },

    // Event handler -- remove button on a filter
    onRemoveFilter : function(e) {
      let filterId = $(e.currentTarget).attr('data-id');

      // Uncheck the removed filter.
      this.$('#' + filterId + 'id').prop('checked', false);

      // Uncheck the 'select all' filter.
      this.$('#selectAllOperations').prop('checked', false);

      this.$('.' + filterId).remove();

      if (!(this.$('.operations input:checkbox:checked').length)) {
        this.$('.reset-filters').remove();
      }

      this.getDataFilteredByTime();
    },

    // @private
    // Unselect the operation checkbox from the operation filter.
    unselectOperations: function() {
      let checkboxes = this.$('.op-filter').find('.dropdown-menu')
        .find('.n-checkbox');

      let _this = this;

      _.each(checkboxes, function(checkbox) {
        _this.$(checkbox).attr('checked', false);
      });
    },

    // @private
    // Select all the operation checkboxes from the operation filter.
    selectAllOperations: function(e) {
      let currentTarget = $(e.currentTarget);
      let checkedVal = currentTarget.prop('checked');

      this.$('.op-filter').find('.operations')
        .find('input[type="checkbox"]')
        .prop('checked', checkedVal);
    },

    // @private
    // Selects/unselects the select all checkbox based on the
    // other operation checkboxes.
    operationChkClick: function() {
      let checkboxes = this.$('.op-filter').find('.operations')
        .find('input[type="checkbox"]');
      let isChecked = true, _this = this;

      _.each(checkboxes, function(checkbox) {
        if (!_this.$(checkbox).prop('checked')) {
          isChecked = false;
        }
      });

      this.$('.op-filter').find('.dropdown-menu')
        .find('#selectAllOperations')
        .prop('checked', isChecked);
    },

    // Dropdown predictive filter function
    filterFunction: function() {
      let input, filter, li, div;
      input = document.getElementById('searchInput');
      filter = input.value.toUpperCase();
      div = document.getElementById('audit_operatoin_filter_options');
      li = div.getElementsByTagName('li');
      _.each(li, function(item) {
        if (item.innerText.toUpperCase().indexOf(filter) > -1) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      }, filter);
      // Disable the Ok button if no search string is present
      let hiddenEl = div.querySelectorAll('li[style="display: none;"]').length;
      if (hiddenEl === li.length) {
        $('.btnDropdownOk').attr('disabled', true);
      } else {
        $('.btnDropdownOk').removeAttr('disabled');
      }
    },

    // Fetches and renders the audit history table.
    addAuditHistoryTable: function(startTimeInMs, endTimeInMs) {
      // To be overrideen in the child class.
    },

    // @override
    // Destroy this view
    destroy: function() {
      // Destroy the sub views
      this.subViewHelper.destroy();
      // Call the super to destroy.
      BaseSubView.prototype.destroy.apply(this);
    },

    // @private
    // Close current menu and return a boolean indicating if the currently
    // open menu was the menu clicked.
    _closeCurrentMenu: function() {
      // Check the menus
      if ($('.dropdown').hasClass('open')) {
        $('.n-settings-container').find('.dropdown').removeClass('open');
      }
    },

    // @private
    // Handle clicking on show/hide menu button.
    onMenuClick: function(event) {
      event.stopPropagation();
      // Register click handler for mouse click outside of menus
      $(document).off('click', this._closeCurrentMenu)
        .on('click', this._closeCurrentMenu);
    },

    // Registers the subview if it  doesn't exist already.
    // @param pageId is the Id of view to register.
    // @param pageClass is the class of the view to register.
    registerSubview: function(pageId, pageClass) {
      if (this.subViewHelper.get(pageId)) {
        this.subViewHelper.remove(pageId);
      }
      this.subViewHelper.register(pageId, pageClass);
    },

    // Clears the local storage and sets download icon back to original state
    clearDownloadCache: function() {
      localStorage.setItem('download', '');
      this.$el.find('.n-settings-container .btnSettings')
        .removeAttr('title')
        .removeAttr('style');
      // Clear header message on popup once download is complete
      this.clearBaseHeader();
    },

    // Update the settings gear icon to show download is not available
    disableDownloadGear: function() {
      localStorage.setItem('download', 'enabled');
      this.$el.find('.n-settings-container .btnSettings')
        .css('color', 'lightgrey')
        .css('cursor', 'initial')
        .attr('title', 'Download is in progress');
    },

    // @private
    // Ask for confirmation to begin download when records are more than
    // permissible count
    // @param message - string - the message that should be displayed on popup
    // @param actionMethod - function - to be called when selection is yes
    // @param param - the parameter to be passed while calling the function
    openConfirmationPopup: function(message, actionMethod, param) {
      $.nutanixConfirm({
        msg: message,
        yes: function() {
          actionMethod(param);
        },
        context: this
      });
    }
  });
});
