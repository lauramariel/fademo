//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileAgeGraphModel is the model class of the entity file age graph
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

  var FileAgeGraphModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function() {
      let fileDormantUrl = _.template(DataURLConstants.FILE_DORMANT_DATA, {
        dormantTime: AppConstants.LAST_MODIFIED_TIME,
        buckets: AppConstants.DORMANT_DATA_BUCKETS
      });

      this.url = this.urlRoot + fileDormantUrl;

      return this.url;
    }
  });

  // Returns the FileAgeGraphModel class
  return FileAgeGraphModel;
}
);
