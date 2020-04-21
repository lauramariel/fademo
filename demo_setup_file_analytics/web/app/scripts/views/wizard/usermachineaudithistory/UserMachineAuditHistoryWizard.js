//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineAuditHistoryWizard initializes the user machine wizard view.
//
define([
  // Views/Models
  'views/base/wizards/WizardView',
  'views/wizard/usermachineaudithistory/UserMachineAuditHistoryPage'],
function(
  // Views/Models
  WizardView,
  UserMachineAuditHistoryPage) {

  'use strict';

  var USER_MACHINE_AUDIT_HISTORY_PAGE_ID = 'userMachineAudit';

  return WizardView.extend({

    name: 'UserMachineAuditHistoryWizard',

    // Functions
    // ---------

    // @override
    // Override to add additional events
    show: function(options) {
      let pages = [
        {
          id   : USER_MACHINE_AUDIT_HISTORY_PAGE_ID,
          title: 'Audit details',
          klass:  UserMachineAuditHistoryPage,
          actionTargetName: options.machineName,
          actionTargetId: options.machineId
        }
      ];

      this.initializeWizard({
        title     : options.title,
        wizardType: WizardView.WIZARD_TYPES.LINEAR,
        pages     : pages,
        type      : options.type
      });

      this.$el.addClass('wizardviewfileserver audit-history-wizard');
      WizardView.prototype.show.apply(this, arguments);

      // Added only as temporary fix for remove it once done
      // ENG-186961 | View Permission need to be removed from UI for now
      this.$('.btnSave').hide();
    }
  });
});
