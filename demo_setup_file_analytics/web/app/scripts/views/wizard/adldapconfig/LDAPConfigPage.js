//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// The LDAPConfigPage renders the LDAP form
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  // Templates
  'text!templates/popup/fileserver/FileServerLDAPTemplate.html'],
function(
  // Views
  BaseWizardPage,
  // Templates
  fileserverLDAPTemplate) {

  'use strict';

  // Page Template.
  var fileserverLDAPTempl = _.template(fileserverLDAPTemplate);

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'LDAPConfigPage',

    // @override
    // Initialize this wizard
    initialize: function(options) {
      BaseWizardPage.prototype.initialize.apply(this, arguments);

      this.addExtraEvents({
        'keyup input': 'onKeyUp',
        'keyup .ldapFields': 'onLdapChange',
        'focus .bindDN': 'onFocusBindDN',
        'blur  .bindDN': 'onBlurBindDN'
      });

      if (this.model) {
        this.fileserver = this.model[0];
        this.fsSubscriptionModel = this.model[1];
      }
    },

    // @override
    // Renders the config wizard page.
    render: function() {
      // Return if the view has been rendered.
      if (this.isViewRendered) {
        return;
      }

      let ldapInfo = this.fileserver.getLdapDetails(),
          forceUpdate = false;
      if (!ldapInfo || !Object.keys(ldapInfo).length) {
        ldapInfo = this.fsSubscriptionModel.getLdapDetails();
        forceUpdate = true;
      }

      let baseDn = '', bindDn = '', serverUrl = '';
      if (ldapInfo && ldapInfo.base_dn) {
        baseDn = ldapInfo.base_dn;
      }
      if (ldapInfo && ldapInfo.bind_dn) {
        bindDn = ldapInfo.bind_dn;
      }
      if (ldapInfo && ldapInfo.server_url) {
        serverUrl = ldapInfo.server_url;
      }

      let msg = 'Enter password to update config';
      if (forceUpdate) {
        msg = 'Enter password to save config';
      }

      let ldapTempl = fileserverLDAPTempl({
        showTitle: false,
        baseDn: baseDn || '',
        bindDn: bindDn || '',
        serverUrl: serverUrl || '',
        msg: msg
      });

      this.$el.html(ldapTempl);

      // Sets the flag to check if view is rendered so that
      // the view is rendered only once.
      this.isViewRendered = true;
    },

    // If any LDAP fields are updated, show hint
    onLdapChange: function() {
      const bindDn = this.$('#bindDN').val();
      if (bindDn) {
        this.$('#hintLdapPassword').show();
      }
    },

    // @private
    // Event handler for making Bind password active.
    onFocusBindDN() {
      this.$('#bindPassword').removeAttr('disabled');
    },

    // @private
    // Event handler when lost focus of Bind DN input.
    // If there is no value for Bind DN input, disable the Bind password
    // field, otherwise, make the Bind password field active.
    onBlurBindDN(e) {
      if ($.trim($(e.currentTarget).val()).length) {
        return;
      }
      this.$('#bindPassword').val('');
      this.$('#hintLdapPassword').hide();
      this.$('#bindPassword').attr('disabled', true);
    },

    // @private
    // Onkey up event
    onKeyUp: function() {
      this.clearHeader();
    }
  });
});
