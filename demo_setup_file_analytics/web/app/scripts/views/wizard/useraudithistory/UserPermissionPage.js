//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// The UserPermissionPage renders the user permission wizard page view.
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  'views/wizard/useraudithistory/UserPermissionPageView',
  // Utils
  'utils/SubViewHelper'],
function(
  // Views
  BaseWizardPage,
  UserPermissionPageView,
  // References of util
  SubViewHelper) {

  'use strict';

  // View ID to register with the subview helper.
  var SUB_VIEW_REGISTER_ID = 'userpermissionpage';

  // Page Template.
  var pageTemplate = "<div class='auditcontent'></div>";
  var pageTempl = _.template(pageTemplate);

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'UserPermissionPage',

    // Subview helper
    subViewHelper: null,

    // @override
    // Initialize this wizard
    initialize: function(options) {
      BaseWizardPage.prototype.initialize.apply(this, arguments);
      this.subViewHelper = new SubViewHelper();
    },

    // @override
    // Renders the user permission wizard page.
    render: function() {
      // Return if the view has been rendered.
      if (this.isViewRendered) {
        this.subViewHelper.get(SUB_VIEW_REGISTER_ID).render();
        return;
      }
      // Renders the user permission page structure.
      this.$el.html(pageTempl);

      // Renders the user permission page view.
      let userPermission = new UserPermissionPageView({
        el: this.$('.auditcontent'),
        actionTargetName: this.options.actionTargetName
      });
      userPermission.setParentView(this);

      // Registers the user permission page view with subview helper.
      this.subViewHelper.register(SUB_VIEW_REGISTER_ID, userPermission);
      userPermission.render();

      // Sets the render view flag to true so that the view
      // is rendered only once.
      this.isViewRendered = true;
    },

    hideSaveButton: function() {
      return true;
    }
  });
});
