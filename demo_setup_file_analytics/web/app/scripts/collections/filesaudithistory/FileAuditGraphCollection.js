//
// Copyright (c) 2015 Nutanix Inc. All rights reserved.
//
// FileAuditGraphCollection is the collection class of the entity audit
// graph model
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/filesaudithistory/FileAuditGraphModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseCollection,
  // Models
  FileAuditGraphModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var FileAuditGraphCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: FileAuditGraphModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'FileAuditGraphCollection',

    // @override
    // Builds the URL structure
    getURL: function(userInput, startTimeInMs, endTimeInMs, objectType) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      const accessPatTempl = _.template(DataURLConstants.FILE_ACCESS_PATTERN, {
        fileName: encodeURIComponent(userInput)
      });

      if (startTimeInMs && endTimeInMs) {
        params[paramsList.START_TIME_IN_MS] = startTimeInMs;
        params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      }

      if (objectType) {
        params[paramsList.OBJECT_TYPE] = [objectType];
      }

      // Set request params
      this.setRequestPayload(params);

      this.url += accessPatTempl;

      return this.url;
    },

    // Builds the URL to get the files access pattern url
    getAccessPatternUrl: function(metricIds, interval, startTimeInMs,
      endTimeInMs) {
      var operation = _.isArray(metricIds) ? metricIds.join() : metricIds;
      var accessPatTempl = _.template(DataURLConstants.FILES_ACCESS_PATTERN, {
        operation      : operation,
        startTimeInMs  : startTimeInMs,
        endTimeInMs    : endTimeInMs,
        interval       : interval
      });

      this.url = this.urlRoot + accessPatTempl;

      return this.url;
    },

    // Get the stats for this model
    // @return [] of data points
    getStats: function(metricIds) {
      if (typeof metricIds === 'undefined') {
        return this.models[0].attributes.values;
      } else {
        for (var j = 0; j < Object.keys(this.models).length; j++) {
          for (var ii=0; ii < Object.keys(this.models[j].attributes).length; ii++) {
            if (this.models[j].attributes.metric === metricIds) {
              return this.models[j].attributes.values;
            }
          }
        }
      }
      return null;
    }
  });

  // Returns the FileAuditGraphCollection class
  return FileAuditGraphCollection;
});