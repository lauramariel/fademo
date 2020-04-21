//
// Copyright (c) 2015 Nutanix Inc. All rights reserved.
//
// UserSearchCollection is the collection class of the entity user search model
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/usersearch/UserSearchModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseCollection,
  // Models
  UserSearchModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var UserSearchCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: UserSearchModel,

    urlRoot: DataURLConstants.USER_SEARCH,

    // Name for logging purposes.
    name: 'UserSearchCollection',

    // use payload while sending request to make POST calls
    payload: {},

    // @override
    // Builds the URL structure for user search
    getURL: function(searchVal, count) {
      searchVal = encodeURIComponent(searchVal);
      if (!count) {
        count = AppConstants.SEARCH_CHUNK_COUNT;
      }
      var chunkCountTempl = _.template(DataURLConstants.COUNT, {
        count: count
      });
      var searchTempl = _.template(DataURLConstants.SEARCH_ENTITY, {
        searchEntity: searchVal
      });
      this.url += this.urlRoot + '?' + chunkCountTempl + '&' + searchTempl;

      return this.url;
    },

    // Builds the URL by for top users result and more users result
    getTopResultUrl: function(startTimeInMs, endTimeInMs, count) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};
      params[paramsList.START_TIME_IN_MS] = startTimeInMs;
      params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      params[paramsList.COUNT] = count || AppConstants.DEFAULT_CHUNK_COUNT;
      // Set request params
      this.setRequestPayload(params);
      this.url += DataURLConstants.TOP_USER_SEARCH;

      return this.url;
    },

    getMaliciousActivityURL: function(startTimeInMs, endTimeInMs, count) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};
      params[paramsList.INCLUDES] = {};
      params[paramsList.START_TIME_IN_MS] = startTimeInMs;
      params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      params[paramsList.INCLUDES][paramsList.OP_STATUS] =
        [AppConstants.OPERATION_VALUES.PermissionDenied,
          AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking];
      params[paramsList.COUNT] = count || AppConstants.DEFAULT_CHUNK_COUNT;

      // Set request params
      this.setRequestPayload(params);

      this.url += DataURLConstants.TOP_USER_SEARCH;

      return this.url;
    }
  });

  // Returns the UserSearchCollection class
  return UserSearchCollection;
});