//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// Manage wizards within the application
//
define([
  // Manager
  'managers/PopupManager',
  // Utils
  'utils/AppConstants'],
function(
  // Manager
  PopupManager,
  // Utils
  AppConstants) {

  'use strict';

  // Wizard Manager
  // --------------
  return _.extend({}, PopupManager, {

    // @override PopupManager.showPopup()
    // Override to show entity in wizard popup
    // @param actionRoute - action route has the following attributes
    // (1) actionTarget      - the action's target
    //                         AppConstants.ENTITY_*
    showPopup: function(options, actionTarget) {
      this.currentActionRoute = options;
      this._showWizardPopup(actionTarget);
    },

    // @private
    // Show the wizard popup using PopupManager.renderWizardPopupView()
    // @param actionTarget - action Target for the wizard
    _showWizardPopup: function(actionTarget) {
      // Wrapper to let the PopupManager handles the rendering of the wizard,
      // and hiding of the wizard on ESC key
      var renderPopupView = _.bind(
        function(WizardPopupView) {
          this.renderWizardPopupView(WizardPopupView,
            this.currentActionRoute);
        }, this);
      // Show the wizard popup using the PopupManager
      switch (actionTarget) {
        case AppConstants.ENTITY_FILE_AUDIT_HISTORY:
          // Show the wizard popup using the PopupManager
          require(['views/wizard/fileaudithistory/FileAuditHistoryWizard'],
            renderPopupView);
          break;
        case AppConstants.ENTITY_USER_AUDIT_HISTORY:
          // Show the wizard popup using the PopupManager
          require(['views/wizard/useraudithistory/UserAuditHistoryWizard'],
            renderPopupView);
          break;
        case AppConstants.ENTITY_FILE_SERVER_AD_LDAP_CONFIG:
          // Show the wizard popup using the PopupManager
          require(['views/wizard/adldapconfig/FileServerADLDAPConfigWizard'],
            renderPopupView);
          break;
        case AppConstants.ENTITY_USER_MACHINE_AUDIT_HISTORY:
          // Show the wizard popup for machine name using PopupManager
          require(['views/wizard/usermachineaudithistory/UserMachineAuditHistoryWizard'],
            renderPopupView);
          break;
        // NOTE: Adding a new wizard? Please update entitiesThatUseWizard.
        // TODO: append new wizard here.
      }
    }
  });
});
