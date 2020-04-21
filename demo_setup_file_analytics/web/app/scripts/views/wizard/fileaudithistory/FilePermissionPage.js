//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// The FilePermissionPage renders the file permission page wizard view.
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  'views/wizard/fileaudithistory/FilePermissionPageView',
  // Utils
  'utils/SubViewHelper'],
function(
  // Views
  BaseWizardPage,
  FilePermissionPageView,
  // References of util
  SubViewHelper) {

  'use strict';

  // View ID to register with the subview helper.
  var SUB_VIEW_REGISTER_ID = 'filepermissionpage';

  // Page Template.
  var pageTemplate = "<div class='auditcontent'></div>";
  var permissionTemplate = _.template(pageTemplate);

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'FilePermissionPage',

    // Subview helper
    subViewHelper: null,

    // @override
    // Initialize this wizard
    initialize: function(options) {
      BaseWizardPage.prototype.initialize.apply(this, arguments);
      this.subViewHelper = new SubViewHelper();
    },

    // @override
    // Renders the file permission wizard page.
    render: function() {
      // Return if the view has been rendered.
      if (this.isViewRendered) {
        this.subViewHelper.get(SUB_VIEW_REGISTER_ID).render();
        return;
      }
      // Renders the file permission page structure.
      this.$el.html(permissionTemplate);

      // Renders the file permission page view.
      let filePermission = new FilePermissionPageView({
        el: this.$('.auditcontent'),
        actionTargetName: this.options.actionTargetName,
        actionTargetId: this.options.actionTargetId
      });
      filePermission.setParentView(this);

      // Registers the file permission page view with subview helper.
      this.subViewHelper.register(SUB_VIEW_REGISTER_ID, filePermission);
      filePermission.render();

      // Sets the render view flag to true so that the view
      // is rendered only once.
      this.isViewRendered = true;
    },

    // Hides the save button.
    hideSaveButton: function() {
      return true;
    }
  });
});
