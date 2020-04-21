//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// FileSizeGraphCollection is the collection class of the entity
// file size model.
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/dashboard/FileSizeGraphModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseCollection,
  // Models
  FileSizeGraphModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var FileSizeGraphCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: FileSizeGraphModel,

    // Name for logging purposes.
    name: 'FileSizeGraphCollection',

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function() {
      let filesizeUrl = _.template(DataURLConstants.FILE_SIZE_DISTRIBUTION, {
        buckets: AppConstants.FILE_SIZE_BUCKETS
      });

      this.url = this.urlRoot + filesizeUrl;
      return this.url;
    }
  });

  // Returns the FileSizeGraphCollection class
  return FileSizeGraphCollection;
});