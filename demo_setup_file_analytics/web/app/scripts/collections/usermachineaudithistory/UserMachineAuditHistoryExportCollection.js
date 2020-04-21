//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineAuditHistoryExportCollection is the collection class of user
// audit history model used to export
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

  var UserMachineAuditHistoryExportCollection =
    BaseAuditHistoryCollection.extend({

    // Properties
    //-----------

    model: UserMachineAuditHistoryModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'UserMachineAuditHistoryExportCollection',

    // @override
    // Builds the URL structure for export user audit history
    getURL: function(machineName, count, startTimeInMs, endTimeInMs) {
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

      // Set start and end time to the payload
      if (startTimeInMs && endTimeInMs) {
        params[paramsList.START_TIME_IN_MS] = startTimeInMs;
        params[paramsList.END_TIME_IN_MS] = endTimeInMs;
      }

      // Download/export enabled template
      params[paramsList.DOWNLOAD] = true;

      // Set request params
      this.setRequestPayload(params);

      this.url += userAuditTempl;

      return this.url;
    },

    // Updating the export url with the next batch id and chunk count
    updateExportUrl: function(nextBatchId, count) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = this.getRequestPayload();

      params[paramsList.COUNT] = count;

      // Scroll id template
      params[paramsList.NEXT_BATCH_ID] = nextBatchId;

      // Set request params
      this.setRequestPayload(params);

      return this.url;
    },

    // Update any query param of the url
    // @key is the param to be updated
    // @value is the new value of the param
    updateQueryStringParameter: function(key, value) {
      let url = this.url.split('?');
      let urlParams = url[1].split('&');

      _.map(urlParams, function(params, i) {
        if (params.indexOf(key) > -1) {
          urlParams[i] = key + '=' + value;
        }
      });

      url[1] = urlParams.join('&');

      return url.join('?');
    }
  });

  // Returns the UserMachineAuditHistoryExportCollection class
  return UserMachineAuditHistoryExportCollection;
});
