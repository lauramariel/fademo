//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileServerMetaDataCollection is the collection class
// of the entity file server
// to get information related to fileserver meta data collection
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/fileservers/FileServerMetaDataModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants',
  // Data
  'data/DataProperties'],
function(
  // Core
  BaseCollection,
  // Models
  FileServerMetaDataModel,
  // Utils
  DataURLConstants,
  AppConstants,
  // Data
  DataProp) {

  'use strict';

  var FileServerMetaDataCollection = BaseCollection.extend({

    // Properties
    //-----------
    model: FileServerMetaDataModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'FileServerMetaDataCollection',

    // @override
    // Builds the URL structure for file server meta data
    getURL: function(options) {
      let templ = '', optTempl = '';
      if (options) {
        if (options.username) {
          const usrTempl = _.template(DataURLConstants.APPEND_USER_NAME, {
            userName: options.username
          });
          optTempl = usrTempl;
        }
        if (options.fsId) {
          const fsTempl = _.template(DataURLConstants.APPEND_FILE_SERVER, {
            fileServer: options.fsId
          });
          if (optTempl) {
            optTempl += '&' + fsTempl;
          } else {
            optTempl = fsTempl;
          }
        }
        templ = DataURLConstants.FILE_SERVERS_SCAN_STATUS + '?' + optTempl;
      } else {
        templ = DataURLConstants.FILE_SERVERS_SCAN_STATUS;
      }
      this.url = this.urlRoot + templ;

      return this.url;
    },

    // Returns the scan status based on the metadata, if not found returns the
    // default status as 'completed'
    getScanStatus: function() {
      let metaData = this.getMetaData(), status = '';
      if (metaData) {
        const scansComplete = this.getCompleteScanShares() +
          this.getFailedScanShares();
        if (!this.getTotalScanShares() ||
          this.getTotalScanShares() === this.getCompleteScanShares()) {
          // Completed all Successfully
          status = AppConstants.METADATA_STATUS.COMPLETED;
        } else if (this.getTotalScanShares() === scansComplete &&
          this.getFailedScanShares()) {
          // Failed
          status = AppConstants.METADATA_STATUS.FAILED;
        } else if (
          this.getTotalScanShares() === this.getNotstartedScanShares()) {
          // Not started
          status = AppConstants.METADATA_STATUS.NOT_STARTED;
        } else {
          // In progress
          status = AppConstants.METADATA_STATUS.IN_PROGRESS;
        }
      }

      return status;
    },

    // Returns the total shares to be scanned based on the metadata,
    // if not found returns the default as 0
    getTotalScanShares: function() {
      return this.getMetaData() ?
        this.getMetaData()[DataProp.META_TOTAL_SCAN_SHARES] : 0;
    },

    // Returns the total shares already scanned based on the metadata,
    // if not found returns the default as 0
    getCompleteScanShares: function() {
      return this.getMetaData() ?
        this.getMetaData()[DataProp.META_SCAN_COMPLETE] : 0;
    },

    // Returns the total shares failed scanned based on the metadata,
    // if not found returns the default as 0
    getFailedScanShares: function() {
      return this.getMetaData() ?
        this.getMetaData()[DataProp.META_SCAN_FAILED] : 0;
    },

    // Returns the total shares not started scanned based on the metadata,
    // if not found returns the default as 0
    getNotstartedScanShares: function() {
      return this.getMetaData() ?
        this.getMetaData()[DataProp.META_SCAN_NOT_STARTED] : 0;
    }
  });

  // Returns the FileServerMetaDataCollection class
  return FileServerMetaDataCollection;
});
