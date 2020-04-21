//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// The UserPermissionPageView enables the user to view the user permission page.
//
define([
  // Views/Models
  'views/base/BaseSubView',
  'views/wizard/useraudithistory/UserPermissionTableView',
  // Utils
  'utils/SubViewHelper',
  'utils/CommonTemplates',
  // Components
  'components/Components',
  // Template
  'text!templates/dashboard/AlertView.html'],
function(
  // Views/Models
  BaseSubView,
  UserPermissionTableView,
  // References of util
  SubViewHelper,
  CommonTemplates,
  // Components
  Components,
  // View Template
  alertTemplate) {

  'use strict';

  var alertTempl = _.template(alertTemplate);
  var viewTemplate = '<div class="permissionTable"><div class="searchWrapper">\
    </div><div class="tableWrapper n-base-data-table"></div></div>';
  viewTemplate = _.template(viewTemplate);

  return BaseSubView.extend({

    name: 'UserPermissionPageView',

    // Subview helper for this view.
    subViewHelper: null,

    // Check if view is already rendered.
    viewRendered: false,

    events: {
      'keyup input.tableFilter' : 'onKeyUpSearch'
    },

    // @override
    initialize: function (options) {
      BaseSubView.prototype.initialize.apply(this, arguments);
      this.subViewHelper = new SubViewHelper();
    },

    // @override
    // Render the page.
    render: function () {
      if (this.viewRendered) {
        return;
      }

      this.$el.html(viewTemplate);
      this.$('.searchWrapper').append(CommonTemplates.SEARCH_TEMPLATE({
        Components: Components
      }));
      this.addUsersResultTable();
      this.viewRendered = true;
    },

    // @private
    // Adds the file search data to the table.
    addUsersResultTable: function(data) {
      if (this.permissionTableView) {
        this.permissionTableView.remove();
      }
      this.permissionTableView = new UserPermissionTableView({
        el : this.$('.tableWrapper'),
        actionTargetName: this.options.actionTargetName
      });
    },

    // Function called on keydown in search box, filters results based on
    // search.
    onKeyUpSearch: function(e) {
      this.permissionTableView.onTableFilter(e);
    },

    // @private
    // Shows alert message on the top of modal.
    // @param message is the error message to be shown.
    showAlert: function(message) {
      $('.n-modal-alert-header').html(alertTempl({
        message: message
      }));
      $('.n-modal-alert-header').show();
    },

    // @private
    // Hides the alert message shown on the top of the modal.
    hideAlert: function() {
      $('.n-modal-alert-header').hide();
    },

    // @override
    // Destroy this view
    destroy: function() {
      // Destroy the sub views
      this.subViewHelper.destroy();
      // Call the super to destroy.
      BaseSubView.prototype.destroy.apply(this);
    }
  });
});
