//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// AnamolyFolderPopupView enables a user to view the top 50 anamoly folder.
//
define([
  // Core classes
  'views/base/BasePopupView',
  'views/anomalyscreen/TopContributingFoldersTableView',
  // Utils
  'utils/AppConstants',
  'utils/TimeUtil',
  'utils/AppUtil',
  // Components
  'components/Components'],
function(
  // Core classes
  BasePopupView,
  TopContributingFoldersTableView,
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
    name: 'AnamolyFolderPopupView',

    el: '#anamolyFolderPopupView',

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
        title        : AppConstants.POPUP.FOLDERS_ANAMOLY_POPUP,
        bodyContent  : viewTemplate,
        footerButtons: ''
      }));
      this.$('.more-record-popup-content').append(dataTableTemplate);
      this.addTopAnomalyFolderTable();
      this.addFilter();
    },

    // Put duration filter in header of datatable to fetch new records within
    // selected range
    addFilter: function() {
      // Dropdown data
      let defaultDataDisplay = AppUtil.constructDropDownData('table', false,
        this.options.fsId, AppConstants.ANOMALY_PAGE_ID);

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
    // Add top 50 folder table to popup.
    addTopAnomalyFolderTable : function(duration) {
      let currentTime = new Date().getTime(),
          noOfDays = duration || this.options.actionRoute.duration,
          startTime = TimeUtil.getStartTime(noOfDays, currentTime);
      // Render the table
      const topContributingFoldersTableView = new
      TopContributingFoldersTableView({
        count : AppConstants.MORE_RECORDS_COUNT,
        viewType : AppConstants.MORE_RECORD_POPUP_VIEW,
        startTimeInMs : parseInt(startTime, 10),
        endTimeInMs   : parseInt(currentTime, 10)
      });

      // Append the newly initialized datatable
      this.getDOM('.more-record-data-table')
        .html(topContributingFoldersTableView.render().el);

      // Start Fetch
      topContributingFoldersTableView.onStartServices();
    },

    // @private
    // Remove popover tooltip and destroy popup-view.
    destroyPopup : function() {
      this.remove();
      $('.popover').remove();
    },

    // Handles the click on a filter in the table.
    handleFilterDropdownActionClick : function(e) {
      let elem = $(e.currentTarget);
      let numberOfDays =
      TimeUtil.setDuration(elem.attr(AppConstants.NAV_ACTION));
      this.addTopAnomalyFolderTable(numberOfDays);
      // Set the updated selection of dropdown as text for date range
      this.options.actionRoute.filterText = elem.text();
      // render the dropdown again once the data is updated
      this.addFilter();
    }
  });
});
