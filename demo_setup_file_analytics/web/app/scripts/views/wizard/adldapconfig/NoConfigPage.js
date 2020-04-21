//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// The NoConfigPage renders no configuration message
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  // Utils
  'utils/AppConstants'],
function(
  // Views
  BaseWizardPage,
  // Utils
  AppConstants) {

  'use strict';

  // No protocol configured
  var noProtocolTemplate = _.template('<div data-ntnx-section="type-text" \
  class="noProtocol"><%= noProtocolText %></div>');

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'NoConfigPage',

    // @override
    // Initialize this wizard
    initialize: function(options) {
      BaseWizardPage.prototype.initialize.apply(this, arguments);
      if (this.model) {
        this.showSave = this.model[0];
        this.fsSubscriptionModel = this.model[1] ? this.model[1] : null;
      }
    },

    // @override
    // Renders no config page.
    render: function() {
      // Check if any model is passed while initializing
      const hasProtocol = this.fsSubscriptionModel ?
        this.fsSubscriptionModel.getProtocol() : false;
      // No protocol configured
      let msg = 'File server does not have any AD or LDAP directory services \
            configured.';
      if (hasProtocol) {
        msg = 'File server is configured with NFS protocol with \
          Unmanaged auth type, so no configuration available.';
        if (this.showSave) {
          msg = 'File server configuration has been updated with \
            NFS protocol Unmanaged auth type, so no AD/LDAP configuration \
            available. Please continue and click Update to save this \
            configuration in File Analytics.';
        }
      } else if (this.showSave) {
        msg += ' Please continue and click Update to save this \
          configuration in File Analytics.';
      }
      const template = noProtocolTemplate({
        noProtocolText: msg
      });
      this.$el.html(template);
    },

    // @override
    // Update save button label
    getSaveButtonLabel: function() {
      return AppConstants.BUTTON_TEXT.BTN_UPDATE;
    }
  });
});
