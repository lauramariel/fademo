//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileServerSubscriptionModel is the model class of the entity file server
// to get information related to fileserver subscription
//
define([
  // Core
  'models/base/BaseModel',
  // Utils
  'utils/DataURLConstants'],
function(
  // References of core
  BaseModel,
  // Utils
  DataURLConstants) {

  'use strict';

  var DP = {
    FILESERVER_NAME   : 'fileserver_name',
    FILESERVER_UUID   : 'fileserver_uuid',
    AD_DOMAIN         : 'ad_domain',
    PROTOCOL_TYPE     : 'protocol_type',
    NFS_AUTH_TYPE     : 'nfs_auth_type',
    LDAP_DETAILS      : 'ldap_details',
    RFC_2307_ENABLED  : 'rfc2307_enabled',
    ldap_details      : {
      BASE_DN     : 'base_dn',
      BIND_DN     : 'bind_dn',
      SERVER_URL  :'server_url'
    },
    DNS_DOMAIN_NAME   : 'dns_domain_name',
    ADMIN_USERS       : 'admin_users'
  };

  var FileServerSubscriptionModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

    idAttribute: DP.FILESERVER_UUID,

    // @override
    // Builds the URL structure
    getURL: function(options) {
      let templ = '', optTempl = '';
      if (options) {
        if (options.username) {
          const usrTempl = _.template(DataURLConstants.APPEND_USER_NAME, {
            userName: options.username
          });
          optTempl = usrTempl;
        }
        if (options.fsId) {
          const fsTempl = _.template(DataURLConstants.APPEND_FILE_SERVER, {
            fileServer: options.fsId
          });
          if (optTempl) {
            optTempl += '&' + fsTempl;
          } else {
            optTempl = fsTempl;
          }
        }
        templ = DataURLConstants.FILE_SERVERS_SUBSCRIPTION + '?' + optTempl;
      } else {
        templ = DataURLConstants.FILE_SERVERS_SUBSCRIPTION;
      }
      this.url = this.urlRoot + templ;
      return this.url;
    },

    // Get Ldap Details
    getLdapDetails: function() {
      return this.getUnescapedValue(`${this.DP.LDAP_DETAILS}`);
    },

    // Get protocol
    getProtocol: function() {
      return this.getUnescapedValue(`${this.DP.PROTOCOL_TYPE}`);
    },

    // Get rfc2307
    getRFC2307: function() {
      return this.getUnescapedValue(`${this.DP.RFC_2307_ENABLED}`);
    },

    // Get AD domain
    getAdDomain: function() {
      return this.getUnescapedValue(`${this.DP.AD_DOMAIN}`);
    },

    // Get AD domain users
    getAdminUsers: function() {
      return this.getUnescapedValue(`${this.DP.ADMIN_USERS}`) || [];
    },

    // Get Ad details as an object
    getAdDetails: function() {
      return {
        domain: this.getAdDomain(),
        protocol_type: this.getProtocol(),
        rfc2307_enabled: this.getRFC2307()
      };
    }
  });

  // Returns the FileServerSubscriptionModel class
  return FileServerSubscriptionModel;
});
