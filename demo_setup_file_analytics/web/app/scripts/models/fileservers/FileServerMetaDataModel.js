//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileServerMetaDataModel is the model class of the entity file server
// to get information related to fileserver meta data collection
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
    SHARE_PROTOCOL  : 'share_protocol',
    IS_ACTIVE       : 'is_active',
    IS_ACCESSIBLE   : 'is_accessible',
    IS_ENCRYPTED    : 'is_encrypted',
    IS_NESTED_SHARE : 'is_nested_share',
    SHARE_NAME      : 'share_name',
    SHARE_TYPE      : 'share_type',
    SCAN_STATUS     : 'scan_status',
    SHARE_UUID      : 'share_UUID',
    ERROR_DETAILS   : 'error_details'
  };

  var FileServerMetaDataModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

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
        templ = DataURLConstants.FILE_SERVERS_SCAN_STATUS + '?' + optTempl;
      } else {
        templ = DataURLConstants.FILE_SERVERS_SCAN_STATUS;
      }
      this.url = this.urlRoot + templ;
      return this.url;
    },

    // Get scan status
    getScanStatus: function() {
      return this.getUnescapedValue(`${this.DP.SCAN_STATUS}`);
    }
  }, {
    // Static Constants.
    // -----------------

    // Local data property constants.
    DP: DP
  });

  // Returns the FileServerMetaDataModel class
  return FileServerMetaDataModel;
});
