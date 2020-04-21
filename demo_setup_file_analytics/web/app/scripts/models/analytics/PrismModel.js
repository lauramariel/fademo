//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// PrismModel is the model class of the entity file analytics
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
    IS_VALID   : 'is_valid_cvm_ip',
    VIRTUAL_IP : 'cvm_virtual_ip'
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
        templ = DataURLConstants.IP_VALIDATE + '?' + usrTempl;
      } else {
        templ = DataURLConstants.IP_VALIDATE;
      }
      this.url = this.urlRoot + templ;
      return this.url;
    }
  });

  // Returns the FileServerModel class
  return FileServerModel;
});
