//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileAuditHistoryWizard initializes the file audit
// history wizard view.
//
define([
  // Views/Models
  'views/base/wizards/WizardView',
  'views/wizard/fileaudithistory/FileAuditHistoryPage',
  'views/wizard/fileaudithistory/FilePermissionPage'],
function(
  // Views/Models
  WizardView,
  FileAuditHistoryPage,
  FilePermissionPage) {

  'use strict';

  var FILE_AUDIT_HISTORY_PAGE_ID = 'fileAudit',
      FILE_USER_PERMISSION_PAGE_ID = 'filePermission';

  return WizardView.extend({

    name: 'FileAuditHistoryWizard',

    // Functions
    // ---------

    // @override
    // Override to add additional events
    show: function(options) {
      let pages = [
        {
          id   : FILE_AUDIT_HISTORY_PAGE_ID,
          title: 'Audit details',
          klass: FileAuditHistoryPage,
          actionTargetId: options.fileId,
          actionTargetName: options.fileName,
          actionTargetType: options.searchType || ''
        }
        // Commented only as temperory fix for uncomment it once done
        // ENG-186961 | View Permission need to be removed from UI for now
        // {
        //   id   : FILE_USER_PERMISSION_PAGE_ID,
        //   title: 'View Permission',
        //   klass: FilePermissionPage,
        //   actionTargetId: options.fileId,
        //   actionTargetName: options.fileName
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
