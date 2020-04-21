//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileSearchCollection is the collection class of the entity file search
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/filesearch/FileSearchModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseCollection,
  // Models
  FileSearchModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var FileSearchCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: FileSearchModel,

    urlRoot: DataURLConstants.FILE_SEARCH,

    // Name for logging purposes.
    name: 'FileSearchCollection',

    // @override
    // Builds the URL structure for file search
    getURL: function(searchVal, count, objectType) {
      searchVal = encodeURIComponent(searchVal);
      count = count || AppConstants.SEARCH_CHUNK_COUNT;

      let chunkCountTempl = _.template(DataURLConstants.COUNT, {
        count: count
      });
      let searchTempl = _.template(DataURLConstants.SEARCH_ENTITY, {
        searchEntity: searchVal
      });

      this.url += this.urlRoot + '?' + chunkCountTempl + '&' + searchTempl;

      if (objectType) {
        let searchTypeTempl = _.template(DataURLConstants.SEARCH_TYPE, {
          objectType : objectType
        });
        this.url += '&' + searchTypeTempl;
      }

      return this.url;
    },

    // Builds the URL by for top files results and more file results
    getTopResultUrl: function(startTimeInMs, endTimeInMs, count, operationArr) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};
      params[paramsList.START_TIME_IN_MS] = startTimeInMs;
      params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      params[paramsList.COUNT] = count || AppConstants.DEFAULT_CHUNK_COUNT;

      var countTempl = _.template(DataURLConstants.COUNT, {
        count: count || AppConstants.DEFAULT_CHUNK_COUNT
      });
      var durationTempl = _.template(DataURLConstants.DATE_FILTER, {
        startTimeInMs: startTimeInMs,
        endTimeInMs  : endTimeInMs
      });

      this.url += DataURLConstants.TOP_FILE_SEARCH + '?' + countTempl + '&' +
        durationTempl;

      if (operationArr && operationArr.length) {
        params[paramsList.OPERATIONS] = [operationArr];
        let operationTempl = _.template(DataURLConstants.OPERATIONS, {
          operations: operationArr.join(',')
        });

        this.url += '&' + operationTempl;
      }

      // Set request params
      this.setRequestPayload(params);
      return this.url;
    }
  });

  // Returns the FileSearchCollection class
  return FileSearchCollection;
});
