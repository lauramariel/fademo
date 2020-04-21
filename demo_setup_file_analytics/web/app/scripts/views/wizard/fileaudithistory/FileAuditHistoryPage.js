//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// The FileAuditHistoryPage renders the file audit history wizard view.
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  'views/wizard/fileaudithistory/FileAuditHistoryPageView',
  // Utils
  'utils/SubViewHelper'],
function(
  // Views
  BaseWizardPage,
  FileAuditHistoryPageView,
  // References of util
  SubViewHelper) {

  'use strict';

  // View ID to register with the subview helper.
  var SUB_VIEW_REGISTER_ID = 'fileaudithistorypage';

  // Page Template.
  var pageTemplate = "<div class='auditcontent n-modal-content'></div>";
  pageTemplate = _.template(pageTemplate);

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'FileAuditHistoryPage',

    // Subview helper
    subViewHelper: null,

    // @override
    // Initialize this wizard
    initialize: function(options) {
      BaseWizardPage.prototype.initialize.apply(this, arguments);
      this.subViewHelper = new SubViewHelper();
    },

    // @override
    // Renders the audit wizard page.
    render: function() {
      // Return if the view has been rendered.
      if (this.isViewRendered) {
        this.subViewHelper.get(SUB_VIEW_REGISTER_ID).render();
        return;
      }

      // Render the wizard page structure.
      this.$el.html(pageTemplate);

      // Render the file audit page in the page structure.
      let fileAudit = new FileAuditHistoryPageView({
        el: this.$('.auditcontent'),
        actionTargetName: this.options.actionTargetName,
        actionTargetId: this.options.actionTargetId,
        actionTargetType: this.options.actionTargetType
      });
      fileAudit.setParentView(this);

      // Register the wizard page view with subview helper.
      this.subViewHelper.register(SUB_VIEW_REGISTER_ID, fileAudit);

      fileAudit.render();

      // Sets the flag to check if view is rendered so that
      // the view is rendered only once.
      this.isViewRendered = true;
    }
  });
});
