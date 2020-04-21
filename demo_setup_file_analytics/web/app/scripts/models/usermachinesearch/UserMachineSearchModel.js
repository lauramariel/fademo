//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineSearchModel is the model class for user search.
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

  var UserMachineSearchModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // use payload while sending request to make POST calls
    payload: {},

    // @override
    // Builds the URL structure for user search machine
    getURL: function(searchVal, count) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      // Set count
      if (!count) {
        count = AppConstants.SEARCH_CHUNK_COUNT;
      }
      params[paramsList.COUNT] = count;

      searchVal = encodeURIComponent(searchVal);
      params[paramsList.SEARCH] = searchVal;

      // Set request params
      this.setRequestPayload(params);

      this.url = this.urlRoot;

      return this.url;
    },

    // Updating the export url with the next batch id and chunk count
    updateSearchUrl: function(nextBatchId, count) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = this.getRequestPayload();

      params[paramsList.COUNT] = count;

      // Scroll id template
      params[paramsList.NEXT_BATCH_ID] = nextBatchId;

      // Set request params
      this.setRequestPayload(params);

      return this.url;
    }
  });

  // Returns the UserMachineSearchModel class
  return UserMachineSearchModel;
});
