//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineAuditGraphModel is the model class of the entity user
// machine audit graph
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

  var UserMachineAuditGraphModel = BaseAuditHistoryModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Data Properties.
    DP: DP,

    getURL: function(userInput, startTimeInMs, endTimeInMs) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      // Append user id
      const accessPatTempl = _.template(
        DataURLConstants.USER_MACHINE_ACCESS_PATTERN, {
          machineName: userInput
        });

      // Set start and end time in the payload
      if (startTimeInMs && endTimeInMs) {
        params[paramsList.START_TIME_IN_MS] = startTimeInMs;
        params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      }

      // Set request params
      this.setRequestPayload(params);

      this.url = this.urlRoot + accessPatTempl;

      return this.url;
    }
  });

  // Returns the UserMachineAuditGraphModel class
  return UserMachineAuditGraphModel;
});
