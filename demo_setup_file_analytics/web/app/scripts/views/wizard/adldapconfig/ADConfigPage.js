//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// The AdConfigPage renders the Active Directory form
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  // Utils
  'utils/AppConstants',
  'utils/FileAnalyticsEnableUtil',
  // Templates
  'text!templates/popup/fileserver/FileServerADTemplate.html'],
function(
  // Views
  BaseWizardPage,
  // References of util
  AppConstants,
  FileAnalyticsEnableUtil,
  // Templates
  fileserverADTemplate) {

  'use strict';

  // Page Template.
  var fileserverADTempl = _.template(fileserverADTemplate);

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'ADConfigPage',

    // Events
    events: {
      'keyup input': 'onKeyUp',
      'keyup .adFields': 'onAdChange',
      'change .userNameOptions': 'onChangeUsername'
    },

    // @override
    // Initialize this wizard
    initialize: function(options) {
      BaseWizardPage.prototype.initialize.apply(this, arguments);
      if (this.model) {
        this.fileserver = this.model[0];
        this.fsSubscriptionModel = this.model[1];
      }
    },

    // @override
    // Render the page.
    render: function() {
      // Return if the view has been rendered.
      if (this.isViewRendered) {
        return;
      }

      const adUserTooltip = 'User needs to be configured with File Server \
        Admin role under Manage Roles in Prism File Server page.';

      let userTempl = '', forceUpdate = false;
      let fsProtocol = this.fsSubscriptionModel.getProtocol();
      let adInfo = this.fileserver.getAdDetails();
      if (!adInfo || !Object.keys(adInfo).length) {
        adInfo = this.setAdFromSubscription();
        forceUpdate = true;
      }

      let username = adInfo.username || '';

      // In case of NFS or NFS_SMB, username is filled from
      // admin users as a dropdown
      if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB ||
        fsProtocol === AppConstants.FS_PROTOCOLS.SMB) {
        userTempl = FileAnalyticsEnableUtil.getUserNameTemplate(
          this.fsSubscriptionModel, username);
      }

      let msg = 'Enter password to update config';
      if (forceUpdate) {
        msg = 'Enter password to save config';
      }

      let adTempl = fileserverADTempl({
        protocol: null,
        adDomain: adInfo.domain || '',
        userName: username || '',
        titleClass: '',
        showAdUserTooltip: true,
        adUserTooltip: adUserTooltip,
        userTempl: userTempl,
        msg: msg
      });

      this.$el.html(adTempl);

      if (!forceUpdate) {
        this.$('#hintAdPassword').hide();
      }

      // Enable tooltip
      this.$('.nutanixMoreInfo').nutanixMoreInfo({
        parseDataAttrs: true,
        placement: 'top'
      });

      // Sets the flag to check if view is rendered so that
      // the view is rendered only once.
      this.isViewRendered = true;
    },

    // @private
    // Event handler for select change of username.
    // if password is filled and username is changed from select
    // make the password field empty.
    onChangeUsername: function(e) {
      const fsProtocol = this.fsSubscriptionModel.getProtocol();
      if (fsProtocol === AppConstants.FS_PROTOCOLS.SMB ||
        fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB) {
        this.$('#adPassword').val('');
        this.$('#hintAdPassword').show();
      }
    },

    // If any AD fields are updated, show hint
    onAdChange: function() {
      this.$('#hintAdPassword').show();
    },

    // @private
    // Onkey up event
    onKeyUp: function() {
      this.clearHeader();
    },

    // Setup AD details in current model from file subscription model
    setAdFromSubscription() {
      const ad = {
        domain: this.fsSubscriptionModel.getAdDomain(),
        protocol_type: this.fsSubscriptionModel.getProtocol(),
        rfc2307_enabled: this.fsSubscriptionModel.getRFC2307()
      };
      this.fileserver.setAdDetails(ad);
      return ad;
    }
  });
});
