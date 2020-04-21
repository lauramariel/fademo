//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileAnalyticsVMUpdateModel is the model class of the
// entity file analytics
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
    STATUS    : 'status',
    TIMESTAMP : 'timestamp',
    OPERATION : 'operation'
  };

  var FileAnalyticsVMUpdateModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function(username) {
      this.url = this.urlRoot + DataURLConstants.AVM_UPDATE;
      return this.url;
    }
  }, {

    // Static Constants
    //-----------------

    // Local data property constants.
    DP: DP
  });

  // Returns the FileAnalyticsVMUpdateModel class
  return FileAnalyticsVMUpdateModel;
});
