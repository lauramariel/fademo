//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileAuditHistoryExportCollection is the collection class of the
// file audit history model used to export
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

  var FileAuditHistoryExportCollection = BaseAuditHistoryCollection.extend({

    // Properties
    //-----------

    model: FileAuditHistoryModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'FileAuditHistoryExportCollection',

    // @override
    // Builds the URL structure for getting file audit history
    getURL: function(fileName, count, startTimeInMs, endTimeInMs) {
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

      // Download/export enabled template
      params[paramsList.DOWNLOAD] = true;

      // Set request params
      this.setRequestPayload(params);

      this.url += fileAuditTempl;

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

  // Returns the FileAuditHistoryExportCollection class
  return FileAuditHistoryExportCollection;
});
