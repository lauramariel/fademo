//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileTypeCollection is the collection class of the entity
// file type model.
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/dashboard/FileTypeGraphModel',
  // Utils
  'utils/DataURLConstants'],
function(
  // Core
  BaseCollection,
  // Models
  FileTypeGraphModel,
  // Utils
  DataURLConstants) {

  'use strict';

  var FileTypeCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: FileTypeGraphModel,

    // Name for logging purposes.
    name: 'FileTypeCollection',

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function() {
      this.url = this.urlRoot + DataURLConstants.FILE_TYPE_DISTRIBUTION;
      return this.url;
    }
  });

  // Returns the FileTypeCollection class
  return FileTypeCollection;
});
