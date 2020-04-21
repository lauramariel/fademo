//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// MaliciousActivityPopupView enables a user to view the top 50 malicious activity.

define([
  // Core classes
  'views/base/BasePopupView',
  'views/dashboard/MaliciousActivityTableView',
  // Utils
  'utils/AppConstants',
  'utils/TimeUtil',
  'utils/AppUtil',
  // Components
  'components/Components'],
function(
  // Core classes
  BasePopupView,
  MaliciousActivityTableView,
  // Utils
  AppConstants,
  TimeUtil,
  AppUtil,
  // Components
  Components) {

  'use strict';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner> \
    <div class="more-record-popup-content n-base-data-table"> \
    </div> \
  </div>';

  var dataTableTemplate = '<div class="more-record-data-table"></div>';

  return BasePopupView.extend({
    name: 'MaliciousActivityPopupView',

    el: '#maliciousActivityPopupView',

    // Events
    events: {
      'click .modal-header .close:not(.disabled)' : 'hide',
      'click [data-dismiss="alert"]'              : 'clearHeader',
      'click .btnCancel'                          : 'hide',
      'click .auditHistory'                       : 'destroyPopup',
      'click .filter-dropdown li a'               : 'handleFilterDropdownActionClick'
    },

    // render table in popup with filter to change duration
    render: function() {
      this.$el.html(this.defaultTemplate({
        title        : AppConstants.POPUP.PERMISSION_DENIALS_POPUP,
        bodyContent  : viewTemplate,
        footerButtons: ''
      }));
      this.$('.more-record-popup-content').append(dataTableTemplate);
      this.addTopMaliciousActivityTable();
      this.addFilter();
    },

    // Put duration filter in header of datatable to fetch new records within
    // selected range
    addFilter: function() {
      // Dropdown data
      let defaultDataDisplay = AppUtil.constructDropDownData('table', false,
        this.options.fsId, AppConstants.DASHBOARD_PAGE_ID);

      // Add filter dropdown component
      let filterDropDown = Components.dropdown({
        classes: 'filter-dropdown action-dropdown pull-right',
        text: this.options.actionRoute.filterText,
        options: defaultDataDisplay,
        variants: '-compact'
      });
      this.$('.n-header').append(filterDropDown);
    },

    // @private
    // Add top 50 malicious activity table to popup.
    addTopMaliciousActivityTable : function(duration) {
      let currentTime = new Date().getTime(),
          noOfDays = duration || this.options.actionRoute.duration,
          startTime = TimeUtil.getStartTime(noOfDays, currentTime);
      // Render the table
      const maliciousActivityTableView = new MaliciousActivityTableView({
        count: AppConstants.MORE_RECORDS_COUNT,
        viewType : AppConstants.MORE_RECORD_POPUP_VIEW,
        startTimeInMs : parseInt(startTime, 10),
        endTimeInMs : parseInt(currentTime, 10)
      });

      // Append the newly initialized datatable
      this.getDOM('.more-record-data-table')
        .html(maliciousActivityTableView.render().el);

      // Start Fetch
      maliciousActivityTableView.onStartServices();
    },

    // @private
    // Destroy popup-view.
    destroyPopup : function() {
      this.remove();
    },

    // Handles the click on a filter in the table.
    handleFilterDropdownActionClick : function(e) {
      let elem = $(e.currentTarget);
      let numberOfDays =
      TimeUtil.setDuration(elem.attr(AppConstants.NAV_ACTION));
      this.addTopMaliciousActivityTable(numberOfDays);
      // Set the updated selection of dropdown as text for date range
      this.options.actionRoute.filterText = elem.text();
      // render the dropdown again once the data is updated
      this.addFilter();
    }
  });
});
