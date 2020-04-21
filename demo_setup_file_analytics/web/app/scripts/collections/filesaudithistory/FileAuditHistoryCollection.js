//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileAuditHistoryCollection is the collection class of the
// entity file audit history
//
define([
  // Core
  'collections/base/BaseAuditHistoryCollection',
  // Models
  'models/filesaudithistory/FileAuditHistoryModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseAuditHistoryCollection,
  // Models
  FileAuditHistoryModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var FileAuditHistoryCollection = BaseAuditHistoryCollection.extend({

    // Properties
    //-----------

    model: FileAuditHistoryModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'FileAuditHistoryCollection',

    // @override
    // Builds the URL structure for getting file audit history
    getURL: function(fileName, count, startTimeInMs, endTimeInMs, page) {
      // Set params
      const paramsList = AppConstants.PAYLOAD_PARAMS;
      const params = {};

      // Set count
      params[paramsList.COUNT] = count;

      // Append file id
      const fileAuditTempl = _.template(DataURLConstants.FILE_SEARCH_AUDIT, {
        fileName: encodeURIComponent(fileName)
      });

      // Set start and end time in the payload
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

      this.url += fileAuditTempl;

      return this.url;
    }
  });

  // Returns the FileAuditHistoryCollection class
  return FileAuditHistoryCollection;
});
