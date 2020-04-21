//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// SMTPModel is the model class of the entity SMTP configuration.
//
define([
  // Utils
  'utils/DataURLConstants',
  // Core
  'models/base/BaseModel'],
function(
  // Constants
  DataURLConstants,
  // References of core
  BaseModel) {
  'use strict';

  var DP = {
    FROM_EMAIL_ID      : 'from_email_id',
    SMTP_HOST          : 'smtp_host',
    SMTP_PASSWORD      : 'smtp_password',
    SMTP_PORT          : 'smtp_port',
    SMTP_USER          : 'smtp_user',
    SMTP_AUTH          : 'smtp_auth',
    TO_EMAIL_ID        : 'to_email_id',
    IS_VERIFIED        : 'is_verified'
  };

  var smtpModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

    idAttribute: DP.FROM_EMAIL_ID,

    // @override
    // Gets the SMTP configuration URL.
    getURL: function() {
      this.url = this.urlRoot + DataURLConstants.SMTP_CONFIG;
      return this.url;
    },

    // gets the test email URL.
    getTestURL: function() {
      this.url = this.urlRoot + DataURLConstants.TEST_EMAIL;
      return this.url;
    },

    // Gets the delete SMTP configuration URL.
    getDeleteURL: function() {
      this.url = this.urlRoot + DataURLConstants.DELETE_SMTP_CONFIG;
      return this.url;
    }
  });
  return smtpModel;
});
