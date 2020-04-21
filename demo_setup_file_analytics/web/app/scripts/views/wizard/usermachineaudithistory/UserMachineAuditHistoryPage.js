//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// The UserMachineAuditHistoryPage renders the user audit history wizard view.
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  'views/wizard/usermachineaudithistory/UserMachineAuditHistoryPageView',
  // Utils
  'utils/SubViewHelper'],
function(
  // Views
  BaseWizardPage,
  UserMachineAuditHistoryPageView,
  // References of util
  SubViewHelper) {

  'use strict';

  // View ID to register with the subview helper.
  var SUB_VIEW_REGISTER_ID = 'usermachineaudithistorypage';

  // Page Template.
  var pageTemplate = "<div class='auditcontent n-modal-content'></div>";
  var auditTemplate = _.template(pageTemplate);

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'UserMachineAuditHistoryPage',

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
      this.$el.html(auditTemplate);
      // Render the user audit page in the page structure.
      let userAudit = new UserMachineAuditHistoryPageView({
        el: this.$('.auditcontent'),
        actionTargetName: this.options.actionTargetName,
        actionTargetId: this.options.actionTargetId
      });
      userAudit.setParentView(this);

      // Register the wizard page view with subview helper.
      this.subViewHelper.register(SUB_VIEW_REGISTER_ID, userAudit);
      userAudit.render();

      // Sets the flag to check if view is rendered so that
      // the view is rendered only once.
      this.isViewRendered = true;
    }
  });
});
