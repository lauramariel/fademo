//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileServerModel is the model class of the entity file server
//
define([
  // Core
  'models/base/BaseModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // References of core
  BaseModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var DP = {
    FILESERVER_NAME: 'fileserver_name',
    FILESERVER_UUID: 'fileserver_uuid',
    DATA_RETENTION_PERIOD: 'data_retention_months',
    PRISM_HOST_IPS: 'prism_host_ips',
    NOTIFICATION_RECEIVER_LIST: 'notification_receiver_list',
    DIRECTORY_SERVICES: 'directory_services',
    directory_services: {
      AD: 'ad',
      ad: {
        DOMAIN: 'domain',
        PROTOCOL_TYPE: 'protocol_type',
        RFC_2307_ENABLED: 'rfc2307_enabled',
        USERNAME: 'username'
      },
      LDAP: 'ldap',
      ldap: {
        BASE_DN: 'base_dn',
        BIND_DN: 'bind_dn',
        SERVER_URL: 'server_url',
        PROTOCOL_TYPE: 'protocol_type'
      },
      LOCAL: 'local',
      local: {
        PROTOCOL_TYPE: 'protocol_type'
      }
    },
    DNS_DOMAIN_NAME: 'dns_domain_name',
    ANALYTICS_ACTIVE: 'is_analytics_active',
    FILESERVER_ACTIVE: 'is_fileserver_active',
    SHARES: 'shares'
  };

  var FileServerModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

    // @override
    // Builds the URL structure
    getURL: function(username) {
      let templ = '';
      if (username) {
        let usrTempl = _.template(DataURLConstants.APPEND_USER_NAME, {
          userName: username
        });
        templ = DataURLConstants.FILE_SERVERS + '?' + usrTempl;
      } else {
        templ = DataURLConstants.FILE_SERVERS;
      }
      this.url = this.urlRoot + templ;
      return this.url;
    },

    // Get protocol
    getProtocol: function(directoryService = null) {
      let protocol = AppConstants.FS_PROTOCOLS.NONE;
      if (this.getDirectoryServices()) {
        // Check if directory services parameter exists
        if (directoryService) {
          protocol = this.getDirectoryServices()
            [directoryService][this.DP.PROTOCOL_TYPE];
          // Check if AD directory service exists
        } else {
          if (this.getDirectoryServices()
            [this.DP.directory_services.AD]) {
            protocol = this.getDirectoryServices()
              [this.DP.directory_services.AD]
              [this.DP.directory_services
                [this.DP.directory_services.LDAP]
                .PROTOCOL_TYPE];
            // Check if LDAP directory service exists
          }
          if (this.getDirectoryServices()
            [this.DP.directory_services.LDAP]) {
            protocol += this.getDirectoryServices()
              [this.DP.directory_services.LDAP]
              [this.DP.directory_services
                [this.DP.directory_services.LDAP]
                .PROTOCOL_TYPE];
          } else if (this.getDirectoryServices()
            [this.DP.directory_services.LOCAL]) {
            protocol += this.getDirectoryServices()
              [this.DP.directory_services.LOCAL]
              [this.DP.directory_services
                [this.DP.directory_services.LOCAL]
                .PROTOCOL_TYPE];
          }
          if (protocol.indexOf(AppConstants.FS_PROTOCOLS.NFS) > -1
            && protocol.indexOf(AppConstants.FS_PROTOCOLS.SMB) > -1) {
            protocol = AppConstants.FS_PROTOCOLS.NFS_SMB;
          } else if (protocol.indexOf(AppConstants.FS_PROTOCOLS.NFS) > -1) {
            protocol = AppConstants.FS_PROTOCOLS.NFS;
          } else if (protocol.indexOf(AppConstants.FS_PROTOCOLS.SMB) > -1) {
            protocol = AppConstants.FS_PROTOCOLS.SMB;
          }
        }
      }
      return protocol;
    },

    // Get Directory services
    getDirectoryServices: function() {
      return this.getUnescapedValue(`${this.DP.DIRECTORY_SERVICES}`);
    },

    // Get AD details
    getAdDetails: function() {
      if (this.getDirectoryServices() && this.getDirectoryServices()
        [this.DP.directory_services.AD]) {
        return this.getDirectoryServices()
          [this.DP.directory_services.AD];
      }
      return null;
    },

    // Get LDAP details
    getLdapDetails: function() {
      if (this.getDirectoryServices() && this.getDirectoryServices()
        [this.DP.directory_services.LDAP]) {
        return this.getDirectoryServices()
          [this.DP.directory_services.LDAP];
      }
      return null;
    },

    // Get local details
    getLocalDetails: function() {
      if (this.getDirectoryServices() && this.getDirectoryServices()
        [this.DP.directory_services.LOCAL]) {
        return this.getDirectoryServices()
          [this.DP.directory_services.LOCAL];
      }
      return null;
    },

    // Set Ad details
    setAdDetails: function(ad) {
      this.setService(this.DP.directory_services.AD, ad);
    },

    // Set a service object
    setService: function(service, object) {
      let directoryServices = {};
      if (this.getDirectoryServices()) {
        let directoryServices = this.getDirectoryServices();
        directoryServices[service] = object;
      } else {
        directoryServices[service] = object;
        this.set(this.DP.DIRECTORY_SERVICES, directoryServices);
      }
    },

    // Delete the object from directory services
    unsetService: function(service) {
      if (this.getDirectoryServices()) {
        let directoryServices = this.getDirectoryServices();
        delete directoryServices[service];
      }
    },

    // Set Ldap details
    setLdapDetails: function(ldap) {
      this.setService(this.DP.directory_services.LDAP, ldap);
    },

    // Set Local details
    setLocalDetails: function(local) {
      this.setService(this.DP.directory_services.LOCAL, local);
    }
  });

  // Returns the FileServerModel class
  return FileServerModel;
});
