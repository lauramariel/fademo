//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// UserAuditHistoryCollection is the collection class of user
// audit history model
//
define([
  // Core
  'collections/base/BaseAuditHistoryCollection',
  // Models
  'models/usersaudithistory/UserAuditHistoryModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseAuditHistoryCollection,
  // Models
  UserAuditHistoryModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var UserAuditHistoryCollection = BaseAuditHistoryCollection.extend({

    // Properties
    //-----------

    model: UserAuditHistoryModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'UserAuditHistoryCollection',

    // @override
    // Builds the URL structure for getting user audit history
    getURL: function(userName, count, startTimeInMs, endTimeInMs, page) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      // Set count
      params[paramsList.COUNT] = count;

      // Append user name
      const userAuditTempl = _.template(DataURLConstants.USER_SEARCH_AUDIT, {
        // if the username has forward slash in it, the API url changes.
        // To avoid the same, the username needs to be HTML encoded
        userName: encodeURIComponent(userName)
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

  // Returns the UserAuditHistoryCollection class
  return UserAuditHistoryCollection;
});
