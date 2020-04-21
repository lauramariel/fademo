//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// DataTableGroupView is the class called by the <Entity>PageView to render the
// tables. Based on the pageId passed, it will show the tabs need to be shown.
//
//
define([
  // Core
  'views/base/BaseView',
  'views/base/DataTableTemplates',
  'views/base/BaseTableView',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/SubViewHelper'],
function(
  // References of core
  BaseView,
  DataTableTemplates,
  BaseTableView,
  // References of utils
  AppConstants,
  AppUtil,
  SubViewHelper) {

  'use strict';

  var MAP_TABS = {};

  MAP_TABS[AppConstants.ENTITY_CAPACITY_TREND] = [
    'file_server_share',
    'folder',
    'category'
  ];

  // Extending the BaseView
  var DataTableGroupView = BaseView.extend({

    // Properties
    //-----------

    // NOTE: The el property was not set here so this view component can be
    // reused in other pages. Its el should be set by the parent class.

    // NOTE about this.options:
    // The parent component should pass the following properties in options
    // when instantiating the class:
    // 1) options.pageId - to know what entity tab datagrids need to show

    // Entities to be shown in tab format. The key should match in the
    // AppConstants.PAGE_<n>. The key should be a string format because it's
    // a variable. On the other hand, values should match in the
    // AppConstants.ENTITY_<n>. The order of the array takes into account.
    MAP_TABS :  null,

    // The current selected tab entity
    selectedEntity: null,

    // @private
    // Creates a unique ID for the tab HTML DOM. This will be appended to all
    // the header and body tab entities for uniqueness.
    _uid: null,

    // Contains the activated BaseTableView components
    subViewHelper: null,

    // The event bus to talk to sibling views
    eventBus: null,

    // Events Listeners
    //-----------------

    // @inherited
    events: {
      'click  .tableGrpHeader  .buttonTab' : 'onClickTab'
    },


    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initialize: function(options) {
      BaseView.prototype.initialize.apply(this, arguments);

      // Create a uniqueId for the DOM
      this._uid = 'datatable' + this.cid + new Date().getTime();

      // Initialize subViewHelper
      this.subViewHelper = new SubViewHelper();

      // Create a deep cloned copy for each instance.
      this.MAP_TABS = $.extend(true, {}, MAP_TABS);

      // Start rendering
      if (options && options.pageId && this.MAP_TABS[options.pageId]) {
        this.render();
      }
    },

    // @override
    // Render the tabs
    render: function() {
      // Empty the el and subViews
      this.$el.empty();

      // Get the tabs
      var pageId = this.options.pageId,
          entityTypes = this.MAP_TABS[pageId],
          entityType;


      // Place the group header where the tabs will go.
      this.$el.append(DataTableTemplates.TABLE_GRP_HEADER);
      this.getDOM('.tableGrpHeader').show();

      // Place the group body
      this.$el.append(DataTableTemplates.TABLE_GRP_BODY);

      // Create the tabs with datatables
      var domID;
      var tabEntityType;
      for (var i = 0; i < entityTypes.length; i++) {
        entityType = entityTypes[i];
        tabEntityType = entityTypes[i];
        domID = entityType + this._uid;

        // Create the tab header
        var tabTemp = DataTableTemplates.ENTITY_TAB({
          domID: domID,
          entity: entityType,
          entityName: AppConstants.ENTITY_NAMES[tabEntityType]
        });
        this.getDOM('.tableGrpHeader').append(tabTemp);

        // Create the tab body and register to subview helper
        // By passing the entity type the table view will automatically
        // render the datagrid columns.
        this.subViewHelper.register(entityType,
          this.createBaseTableView(domID, entityType, pageId));

        // Append the newly initialized datatable
        this.getDOM('.tableGrpBody')
          .append(this.subViewHelper.get(entityType).render().el);

      }
    },

    // Instantiate a base table view
    createBaseTableView: function(domID, entityType, pageId) {
      var tableOptions = {
        id         : domID,
        entityType : entityType,
        el         : this.getDOM('.tableGrpBody'),
        pageId     : pageId,
        enableDefaultTableFilter : true
      };

      let tableView = null;
      switch (entityType) {
        // All other entities
        default:
          tableView = new BaseTableView(tableOptions);
      }

      // Set the Entity to show according to Priority
      var newSelectedEntity = this.$('.tableGrpHeader  a:first')
        .attr(AppConstants.NAV_ACTION_TARGET); // default (first tab)

      // Refresh the tab
      this.showTab(newSelectedEntity);

      return tableView;
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
          this.subViewHelper.get(subViewId).onStartServices();

          // Update the current selected entity
          this.selectedEntity = newSelectedEntity;

        } else {
          // Stop the services
          this.subViewHelper.get(subViewId).onStopServices();
        }
      }, this);

      // Update the tab attributes
      this.updateTabAttributes();
    },

    // Based on the given options, update the tab attributes to make sure
    // that tab selection provides the correct selected details.
    updateTabAttributes: function() {
      var actionTarget = this.selectedEntity;

      // Remove active class from all the tabs.
      this.$('.tableGrpBody .n-tab').removeClass('active');

      // Assign active class to the currently selected tab.
      this.$('#' + actionTarget + this._uid).addClass('active');
    },

    // @override
    // Destroy this instance
    destroy: function() {
      AppUtil.debug('DataTableGroupView : destroy: ',
        ' | viewid     : ' + this.cid);

      // Destroy all the tabs and tables
      this.subViewHelper.removeAll();
      this.subViewHelper = null;

      // Call the base cleanup API
      BaseView.prototype.destroy.apply(this, arguments);
    },


    // Functions (Event Handlers)
    //---------------------------

    // Called when the one of the tab headers are clicked
    onClickTab: function(event) {
      // Commented in case in future we need to update each action in the url
      // NavigationManager.updateRouteOption(event.currentTarget);
    },


    // Functions (View Update)
    //------------------------

    // @override
    // Update this view and its children views with new data
    refreshView: function() {
      if (this.subViewHelper.get(this.selectedEntity)) {
        this.subViewHelper.get(this.selectedEntity)
          .refreshData(this.getOptionsObject());
      }
    },

    // Functions (Services)
    //---------------------

    // @override
    onStartServices: function() {
      this.delegateEvents();
      if (this.subViewHelper.get(this.selectedEntity)) {
        this.subViewHelper.get(this.selectedEntity).startServices();
      }
    },

    // @override
    onStopServices: function() {
      this.undelegateEvents();
      this.subViewHelper.iterate('stopServices');
    }

  });

  // Returns the DataTableGroupView Class
  return DataTableGroupView;
});
