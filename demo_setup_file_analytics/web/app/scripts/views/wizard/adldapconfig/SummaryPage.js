//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// The SummaryPage renders summary info
//
define([
  // Views
  'views/base/wizards/BaseWizardPage',
  // Utils
  'utils/AppConstants',
  // Templates
  'text!templates/popup/fileserver/FileServerSummaryTemplate.html'],
function(
  // Views
  BaseWizardPage,
  // Utils
  AppConstants,
  // Templates
  SummaryPageTemplate) {

  'use strict';

  var summaryTemplate = _.template(SummaryPageTemplate);

  return BaseWizardPage.extend({

    // Properties
    // -----------

    // Module Name
    name: 'SummaryPage',

    // @override
    // Renders summary of AD and LDAP changes
    render: function() {
      let msg = 'No details changed to be updated';
      let ad = this.model.getAdDetails(),
          ldap = this.model.getLdapDetails(),
          local = this.model.getLocalDetails();
      let protocolName = this.model.getProtocol();
      if (protocolName === AppConstants.FS_PROTOCOLS.NFS_SMB) {
        protocolName = 'NFS, SMB';
      }

      let summary = summaryTemplate({
        protocol: protocolName,
        domain: ad ? ad.domain : '',
        username: ad ? ad.username : '',
        server_url: ldap ? ldap.server_url : '',
        base_dn: ldap ? ldap.base_dn : '',
        bind_dn: ldap ? ldap.bind_dn : '',
        showAdDetails: !!ad,
        showLdapDetails: !!ldap,
        showLocalDetails: !!local,
        msg: msg
      });
      this.$el.html(summary);
    },

    // @override
    // Update save button label
    getSaveButtonLabel: function() {
      return AppConstants.BUTTON_TEXT.BTN_UPDATE;
    }
  });
});
