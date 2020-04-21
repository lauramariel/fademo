//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AppEvents contains custom event constants.
//
define([],
  function() {
    'use strict';

    return {

      // APP
      //----
      APP_VIEW_IS_RENDERED : 'APP_VIEW_IS_RENDERED',

      // NAVIGATION
      // ----
      ROUTE_CHANGE : 'ROUTE_CHANGE',

      // SPOTLIGHT
      //----------
      SPOTLIGHT_SELECT  : 'SPOTLIGHT_SELECT',
      SPOTLIGHT_CLEANUP : 'SPOTLIGHT_CLEANUP',

      // POPUP EVENTS
      //------------
      POPUP_CLOSE       : 'POPUP_CLOSE',
      POPUP_OPEN        : 'POPUP_OPEN',

      // AUTO RESIZE
      //------------
      AUTO_RESIZE_HEIGHT : 'AUTO_RESIZE_HEIGHT',
      AUTO_RESIZE_WIDTH  : 'AUTO_RESIZE_WIDTH',

      // TUTORIAL
      //--------

      TUTORIAL_STEP_FINISH    : 'tutorialStepFinish',
      TUTORIAL_TOOLTIP_CLOSE  : 'tutorialTooltipClose',
      PROMPT_TUTORIAL_CLOSE   : 'promptTutorialClose',

      // GENERAL ENTITY EVENTS
      //----------------------
      // Data for the events is a hash of entityType and entityIds
      // eg:
      // AppEvents.triggerAppEvent(
      //    AppEvents.ENTITIES_DELETED, {entityType:'vm', entityIds:[]});
      ENTITIES_CREATED : 'entitiesCreated',
      ENTITIES_DELETED : 'entitiesDeleted',
      ENTITIES_UPDATED : 'entitiesUpdated',

      // PENDING ENTITIES EVENTS
      //------------------------

      // Event for refreshing pending entities.
      REFRESH_PENDING_ENTITIES: 'refreshPendingEntities',

      // BANNER EVENTS
      //--------------
      BANNER_CLOSE: 'bannerClose',

      // COMPONENTS EVENTS
      //------------------
      CB_SET_PARTIAL_SELECT : 'checkboxSetPartialSelect',
      CB_UNSET_PARTIAL_SELECT : 'checkboxUnsetPartialSelect',

      // MULTISELECT TABLE VIEW
      //-----------------------
      RENDER_MULTISELECT_TABLEVIEW: 'renderMultiSelectTableView',

      // Intent
      //-------
      INTENT_SAVE_SUCCESS       : 'intentSaveSuccess',
      INTENT_LOCAL_SAVE_SUCCESS : 'intentLocalSaveSuccess',
      INTENT_SAVE_ERROR         : 'intentSaveError',
      INTENT_VIEW_RENDER        : 'intentViewRender',
      INTENT_FETCH_ERROR        : 'intentFetchError',
      INTENT_POPUP_CLOSE        : 'intentPopupClose',
      INTENT_POPUP_NOTIFY       : 'intentPopupNotify',
      // See EntityStateTracker.js comment on the usage of this.
      // When there are entities changes this will be triggered.
      INTENT_ENTITIES_STATE_CHANGED : 'intentEntitiesStateChanged',
      // When entities has been added to the tracking list this
      // will be triggered.
      INTENT_ENTITIES_TRACKING_INITIATED   : 'intentEntitiesStateAdded',

      // User Details
      //-------------
      REFRESH_V3_USER_DETAILS : 'refreshV3UserDetails',

      // Prism Extensions
      EXTENSION_CLOSE: 'extensionClose',
      SWITCH_TABS    : 'switchTabs',

      // IQ Search
      QUERY_EXAMPLE : 'queryExample',

      // Async bundle loading
      ASYNC_SCRIPT_LOAD: 'asyncScriptLoad',

      // Node conversion in progress
      NODE_CONVERSION_IN_PROGRESS: 'nodeConversionProgress',

      // Functions
      //----------

      // Central function to trigger an app event
      triggerAppEvent(eventName, eventData) {
        $('body').trigger(eventName, eventData);
      },

      // Register an App event handler
      onAppEvent(eventName, eventHandler) {
        $('body').on(eventName, eventHandler);
      },

      // Register an one-time App event handler.
      onAppEventOnce(eventName, eventHandler) {
        $('body').one(eventName, eventHandler);
      },

      // Unregister an App event handler
      offAppEvent(eventName, eventHandler) {
        $('body').off(eventName, eventHandler);
      }
    };
  }
);
