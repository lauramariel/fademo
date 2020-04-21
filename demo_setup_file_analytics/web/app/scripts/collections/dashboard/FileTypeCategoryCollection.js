//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileTypeCategoryCollection is the collection class of the entity
// file type category model.
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/dashboard/FileTypeCategoryModel',
  // Utils
  'utils/DataURLConstants'],
function(
  // Core
  BaseCollection,
  // Models
  FileTypeCategoryModel,
  // Utils
  DataURLConstants) {

  'use strict';

  var FileTypeCategoryCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: FileTypeCategoryModel,

    // Name for logging purposes.
    name: 'FileTypeCategoryCollection',

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function() {
      this.url = this.urlRoot + DataURLConstants.FILE_TYPE_CONFIGURATION;
      return this.url;
    }
  });

  // Returns the FileTypeCategoryCollection class
  return FileTypeCategoryCollection;
});
