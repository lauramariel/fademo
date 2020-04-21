//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileServerDetails is the model class of the entity file server
// to get information related to fileserver capacity
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
    ANALYTICS_VERSION: 'analytics_version',
    COMMIT_ID: 'commit_id',
    FILE_SERVER_UUID: 'file_server_uuid',
    PER_FILE_SERVER: 'per_file_server',
    TOTAL_CAPACITY: 'total_capacity'
  };

  var FileServerDetails = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

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
        templ = DataURLConstants.FILE_SERVERS_DETAILS + '?' + optTempl;
      } else {
        templ = DataURLConstants.FILE_SERVERS_DETAILS;
      }
      this.url = this.urlRoot + templ;
      return this.url;
    },

    // Get total capacity
    getTotalCapacity: function() {
      // If total_capacity is not returned in API, show NA
      return typeof this.getUnescapedValue(`${this.DP.TOTAL_CAPACITY}`) ===
      'undefined' ?
        AppConstants.NOT_AVAILABLE :
        this.getUnescapedValue(`${this.DP.TOTAL_CAPACITY}`);
    },

    // Get current version
    getVersion: function() {
      return this.getUnescapedValue(`${this.DP.ANALYTICS_VERSION}`) || '';
    }
  });

  // Returns the FileServerDetails class
  return FileServerDetails;
});
