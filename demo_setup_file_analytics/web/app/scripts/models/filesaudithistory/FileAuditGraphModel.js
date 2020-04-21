//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileAuditGraphModel is the model class of the entity file audit graph
//
define([
  // Core
  'models/base/BaseAuditHistoryModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // References of core
  BaseAuditHistoryModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  // Default data fields in the response
  var DP = {
    'METRIC': 'metric',
    'VALUES': 'values'
  };

  var FileAuditGraphModel = BaseAuditHistoryModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Data Properties.
    DP: DP,

    // @override
    // Builds the URL structure
    getURL: function(userInput, startTimeInMs, endTimeInMs, objectType) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      // Append file id
      const accessPatTempl = _.template(DataURLConstants.FILE_ACCESS_PATTERN, {
        fileName: encodeURIComponent(userInput)
      });

      // Set start and end time in the payload
      if (startTimeInMs && endTimeInMs) {
        params[paramsList.START_TIME_IN_MS] = startTimeInMs;
        params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      }

      // Set object type in the payload
      if (objectType) {
        params[paramsList.OBJECT_TYPE] = [objectType];
      }

      // Set request params
      this.setRequestPayload(params);

      this.url = this.urlRoot + accessPatTempl;

      return this.url;
    },

    // Get the stats for this model
    // @return [] of data points
    getStats: function(metricIds) {
      if (typeof metricIds === 'undefined') {
        return this.attributes[0].values;
      } else {
        for (var ii=0; ii < Object.keys(this.attributes).length; ii++) {
          if (this.attributes[ii].metric === metricIds) {
            return this.attributes[ii].values;
          }
        }
      }
      return null;
    }
  }, {
    DP: DP
  });

  // Returns the FileAuditGraphModel class
  return FileAuditGraphModel;
});
