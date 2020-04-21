//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// CapacityDataTableGroupView is the class called by the <Entity>PageView to
// render the tables. Based on the pageId passed,
// it will show the tabs need to be shown.
//
define([
  // Datagrid
  'views/base/datatables/DataTableGroupView',
  // Views
  'views/capacitytrend/ShareCapacityDetailTableView',
  'views/capacitytrend/FolderCapacityDetailTableView',
  'views/capacitytrend/CategoryCapacityDetailTableView',
  // Utils
  'utils/AppConstants'],
function(
  // References of datagrid
  DataTableGroupView,
  // Views
  ShareCapacityDetailTableView,
  FolderCapacityDetailTableView,
  CategoryCapacityDetailTableView,
  // References of utils
  AppConstants) {

  'use strict';

  // Extending the BaseView
  var CapacityDataTableGroupView = DataTableGroupView.extend({

    // Properties
    //-----------

    data: [],

    // The subviewHelper for this view.
    subViewHelper: null,

    // Set true for each tab api fetch done or not
    MAP_TABS_API_FETCH: {
      'file_server_share' : false,
      'folder'            : false,
      'category'          : false
    },

    // Functions (Core)
    //-----------------

    // @override
    // Overriden to reinitialise MAP_TABS_API_FETCH values as these are not
    // destroyed
    initialize: function(options) {
      // Set true for each tab api fetch done or not
      this.MAP_TABS_API_FETCH = {
        'file_server_share' : false,
        'folder'            : false,
        'category'          : false
      };

      DataTableGroupView.prototype.initialize.call(this, options);
    },

    // Instantiate a base table view
    createBaseTableView: function(domID, entityType, pageId) {
      var tableOptions = {
        id          : domID,
        entityType  : entityType,
        pageId      : pageId,
        enableDefaultTableFilter : true,
        startTimeInMs: this.options.startTimeInMs,
        endTimeInMs: this.options.endTimeInMs,
        interval: this.options.interval
      };

      let tableView = null;
      switch (entityType) {
        // Share Capacity Table View
        case AppConstants.ENTITY_SHARE:
          tableView = new ShareCapacityDetailTableView(tableOptions);
          break;
        // Folder Capacity Table View
        case AppConstants.ENTITY_FOLDER:
          tableView = new FolderCapacityDetailTableView(tableOptions);
          break;
        // Extension Capacity Table View
        case AppConstants.ENTITY_CATEGORY:
          tableView = new CategoryCapacityDetailTableView(tableOptions);
          break;
      }

      // Set the Entity to show according to Priority
      const newSelectedEntity =
        this.$('.tableGrpHeader  a:first')
          .attr(AppConstants.NAV_ACTION_TARGET); // default (first tab)

      // // Refresh the tab
      this.showTab(newSelectedEntity);

      return tableView;
    },

    // Functions (Event Handlers)
    //---------------------------

    // Called when the one of the tab headers are clicked
    onClickTab: function(e) {
      const target = $(e.currentTarget);
      const actionTarget = target.attr('actiontarget');

      // Remove class active from all tabs.
      $('.buttonTab').closest('li').removeClass('active');

      // Add class active to the currently active tab.
      $('.buttonTab[actionTarget="' + actionTarget + '"]')
        .closest('li').addClass('active');

      this.showTab(actionTarget);
    },

    // Call this function to show the tab and refresh its data table
    showTab: function(newSelectedEntity) {
      // Start services on the selected data table and stop the rest.
      let isTargetViewActive = false;
      _.each(this.subViewHelper.getIds(), function(subViewId) {
        // So that multiple times api/event is not triggered if clicked multiple
        // times or mutiple calls to this function
        isTargetViewActive =
          this.$('#' + subViewId + this._uid).hasClass('active');
        if (subViewId === newSelectedEntity && !isTargetViewActive) {
          // Show the tab
          this.$('.tableGrpHeader a[data-target="#' + subViewId +
            this._uid + '"]').tab('show');

          // Start the services
          if (!this.MAP_TABS_API_FETCH[subViewId]) {
            this.subViewHelper.get(subViewId).onStartServices();
          }
          this.MAP_TABS_API_FETCH[subViewId] = true;

          // Update the current selected entity
          this.selectedEntity = newSelectedEntity;

        }
      }, this);

      // // Update the tab attributes
      this.updateTabAttributes();
    }
  });

  // Returns the CapacityDataTableGroupView Class
  return CapacityDataTableGroupView;
});
