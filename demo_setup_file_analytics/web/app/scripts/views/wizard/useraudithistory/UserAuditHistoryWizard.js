//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AnomalyWizard initializes the anomaly wizard view.
//
define([
  // Views/Models
  'views/base/wizards/WizardView',
  // 'views/wizard/useraudithistory/UserPermissionPage',
  'views/wizard/useraudithistory/UserAuditHistoryPage'],
function(
  // Views/Models
  WizardView,
  // UserPermissionPage,
  UserAuditHistoryPage) {

  'use strict';

  var USER_AUDIT_HISTORY_PAGE_ID = 'userAudit',
      USER_FILE_PERMISSION_PAGE_ID = 'userPermission';

  return WizardView.extend({

    name: 'UserAuditHistoryWizard',

    // Functions
    // ---------

    // @override
    // Override to add additional events
    show: function(options) {
      let pages = [
        {
          id   : USER_AUDIT_HISTORY_PAGE_ID,
          title: 'Audit details',
          klass:  UserAuditHistoryPage,
          actionTargetName: options.userName,
          actionTargetId: options.userId
        }
        // Commented only as temperory fix for uncomment it once done
        // ENG-186961 | View Permission need to be removed from UI for now
        // {
        //   id   : USER_FILE_PERMISSION_PAGE_ID,
        //   title: 'View Permission',
        //   klass:  UserPermissionPage,
        //   actionTargetName: options.userName
        // }
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
