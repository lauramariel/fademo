//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineSearchCollection is the collection class of the entity
// user machine search model
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/usermachinesearch/UserMachineSearchModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseCollection,
  // Models
  UserMachineSearchModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var UserMachineSearchCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: UserMachineSearchModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL +
      DataURLConstants.USER_MACHINE_SEARCH,

    // Name for logging purposes.
    name: 'UserMachineSearchCollection',

    // use payload while sending request to make POST calls
    payload: {},

    // @override
    // Builds the URL structure for user search
    getURL: function(searchVal, count) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      // Set count
      if (!count) {
        count = AppConstants.SEARCH_CHUNK_COUNT;
      }
      params[paramsList.COUNT] = count;

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

  // Returns the UserMachineSearchCollection class
  return UserMachineSearchCollection;
});
