//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileTypeGraphModel is the model class of the entity file type graph
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

  var FileTypeGraphModel = BaseModel.extend({

    // use payload while sending request to make POST calls
    payload: {},

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function() {
      this.url = this.urlRoot + DataURLConstants.FILE_TYPE_DISTRIBUTION;
      return this.url;
    },

    // Build the file type over time URL.
    getFileTypeUrl: function() {
      this.url = this.urlRoot + DataURLConstants.FILE_TYPE_DISTRIBUTION +
        '/' + DataURLConstants.STATS;
      return this.url;
    },

    // set request payload
    // @param categories array - Categories for which stats are required
    // @param time object - fetch details for defined intervals
    setRequestPayload: function(categories, time) {
      if (categories) {
        this.payload.categories = categories;
      }
      if (time) {
        this.payload.interval = time.interval;
        this.payload.start_time_in_ms = time.start_time_in_ms;
        this.payload.end_time_in_ms = time.end_time_in_ms;
      }
    },

    // get request payload while making POST call
    getRequestPayload: function() {
      return this.payload;
    }
  });

  // Returns the FileTypeGraphModel class
  return FileTypeGraphModel;
});
