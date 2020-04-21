//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileSizeGraphModel is the model class of the entity file size graph
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

  var FileSizeGraphModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function() {
      let filesizeUrl = _.template(DataURLConstants.FILE_SIZE_DISTRIBUTION, {
        buckets: AppConstants.FILE_SIZE_BUCKETS
      });

      this.url = this.urlRoot + filesizeUrl;
      return this.url;
    }
  });

  // Returns the FileSizeGraphModel class
  return FileSizeGraphModel;
}
);
