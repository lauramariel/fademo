//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileTypeCategoryModel is the model class of the entity file
// type graph to get File Type category list
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

  var FileTypeCategoryModel = BaseModel.extend({

    // use payload while sending request to make POST calls
    payload: {},

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function(type = AppConstants.METHOD.GET) {
      let url = DataURLConstants.FILE_TYPE_CONFIGURATION;
      // Change url based on type
      if (type === AppConstants.METHOD.SAVE) {
        url = DataURLConstants.SAVE_FILE_TYPE_CONFIGURATION;
      }
      this.url = this.urlRoot + url;
      return this.url;
    },

    // set request payload
    setRequestPayload: function() {
      return true;
    },

    // get request payload while making POST call
    getRequestPayload: function() {
      return this.payload;
    }
  });

  // Returns the FileTypeCategoryModel class
  return FileTypeCategoryModel;
});
