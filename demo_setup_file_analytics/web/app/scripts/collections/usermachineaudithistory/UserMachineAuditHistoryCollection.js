//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineAuditHistoryCollection is the collection class of user
// machine audit history model
//
define([
  // Core
  'collections/base/BaseAuditHistoryCollection',
  // Models
  'models/usermachineaudithistory/UserMachineAuditHistoryModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseAuditHistoryCollection,
  // Models
  UserMachineAuditHistoryModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var UserMachineAuditHistoryCollection = BaseAuditHistoryCollection.extend({

    // Properties
    //-----------

    model: UserMachineAuditHistoryModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'UserMachineAuditHistoryCollection',

    // @override
    // Builds the URL structure for getting user audit history
    getURL: function(machineName, count, startTimeInMs, endTimeInMs, page) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      // Set count
      params[paramsList.COUNT] = count;

      // Append user name
      const userAuditTempl = _.template(
        DataURLConstants.USER_MACHINE_AUDIT_HISTORY, {
          machineName: machineName
        });

      // Put start and end time as payload
      if (startTimeInMs && endTimeInMs) {
        params[paramsList.START_TIME_IN_MS] = startTimeInMs;
        params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      }

      // Set page count for pagination
      if (page) {
        params[paramsList.PAGE] = page;
      }

      // Set request params
      this.setRequestPayload(params);

      this.url += userAuditTempl;

      return this.url;
    }
  });

  // Returns the UserMachineAuditHistoryCollection class
  return UserMachineAuditHistoryCollection;
});
