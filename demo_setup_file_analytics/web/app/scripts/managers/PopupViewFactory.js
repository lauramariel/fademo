//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// PopupViewFactory is responsible for creating all the popup views
// for the Nutanix Prism UI
//
// jsHint options on the next line
/*global $: false, _: false, require: false, define: false */
//
define([
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'text!app/scripts/popups.json'],
function(
  // References of utils
  AppConstants,
  AppUtil,
  popups) {

  'use strict';

  var popupsConfig;
  try {
    popupsConfig = JSON.parse(popups);
  } catch (e) {
    AppUtil.log('PopupViewFactory: Failed to parse popups module config: ' +
      e);
  }

  // PopupViewFactory
  // -----------------
  return {
    // Shows the popup. Inline require is used here.
    // NOTE: The file name/path parameter to require needs to be unbroken
    // so in this case it's ok to exceed the width limit of 79 chars.
    showPopup: function(action, actionTarget,
                        renderPopupView,
                        renderMultiplePopupView) {

      // Get the popup class based on the action and actionTarget.
      var popupClass = this.getPopupClass(action, actionTarget);
      // Check if multiple popup. We are considering it as false for now.
      var isMultiplePopup = false;

      // Load the popup.
      this.loadPopupView(popupClass, isMultiplePopup,
        renderPopupView, renderMultiplePopupView);
    },

    // Loads the popup via require.
    loadPopupView: function(popupClass, isMultiplePopup,
                            renderPopupView,
                            renderMultiplePopupView) {
      if (isMultiplePopup === true) {
        require([ popupsConfig.modules[popupClass] ],
          renderMultiplePopupView);
      } else {
        require([ popupsConfig.modules[popupClass] ], renderPopupView);
      }
    },

    // Returns the popup class
    getPopupClass: function(action, actionTarget) {
      var popupClass;

      switch (actionTarget) {
        // SMTP popup
        case AppConstants.ENTITY_SMTP:
          popupClass = 'SMTPPopupView';
          break;

        // Alert Popup
        case AppConstants.ENTITY_ALERT:
          popupClass = 'AlertPopupView';
          break;

        // Policy Popup
        case AppConstants.ENTITY_ANOMALY_POLICY:
          popupClass = 'PolicyPopupView';
          break;

        // Data Retention Popup
        case AppConstants.ENTITY_DATA_RETENTION:
          popupClass = 'DataRetentionPopupView';
          break;

        // Capacity Trend popup
        case AppConstants.ENTITY_CAPACITY_TREND:
          popupClass = 'CapacityTrendPopupView';
          break;

        // File distribution by type detail popupo
        case AppConstants.ENTITY_FILE_TYPE:
          popupClass = 'FileTypePopupView';
          break;

        // File Server Enable popup
        case AppConstants.ENTITY_FILE_SERVER_ENABLE:
          popupClass = 'FileServerEnablePopupView';
          break;

        // Trigger metadata collection popup
        case AppConstants.ENTITY_TRIGGER_MDATA:
          popupClass = 'TriggerMetaDataPopupView';
          break;

        // Active User popup
        case AppConstants.ENTITY_ACTIVE_USER:
          popupClass = 'ActiveUserPopupView';
          break;

        // Accessed File popup
        case AppConstants.ENTITY_ACCESSED_FILES:
          popupClass = 'AccessedFilesPopupView';
          break;

        // Permission Denials popup
        case AppConstants.ENTITY_PERMISSION_DENIALS:
          popupClass = 'MaliciousActivityPopupView';
          break;

        // Anamoly User popup
        case AppConstants.ENTITY_ANOMALY_USER:
          popupClass = 'AnamolyUserPopupView';
          break;

        // Anamoly Folder popup
        case AppConstants.ENTITY_ANOMALY_FOLDER:
          popupClass = 'AnamolyFolderPopupView';
          break;

        // About AFS popup
        case AppConstants.ENTITY_ABOUT_AFS:
          popupClass = 'AboutAFSPopupView';
          break;

        // Collect logs popup
        case AppConstants.ENTITY_LOG_COLLECTION:
          popupClass = 'LogCollectorPopupView';
          break;

        // ActionTarget: Entity File Server
        case AppConstants.ENTITY_FILE_SERVER:
          // Temp fix, need to move towards entity level
          // where fileserver, shares will be treated as entites
          // and other action will fall under them. In that case showPopup()
          // will pass first param as 'action' i.e
          // 'actionRoute[AppConstants.NAV_ACTION]'
          if (action[AppConstants.NAV_ACTION] ===
            AppConstants.ACTION_UPDATE_FILE_CATEGORY) {
            popupClass = 'FSUpdateFileCategoryPopupView';
          }
          break;

        // Define blacklist rules popup
        case AppConstants.ENTITY_BLACKLIST:
          popupClass = 'BlacklistRulesPopupView';
          break;
      }

      return popupClass;
    }
  };
});
