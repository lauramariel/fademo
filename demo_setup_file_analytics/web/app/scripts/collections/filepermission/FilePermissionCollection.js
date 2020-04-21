//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FilePermissionCollection is the collection class of the entity file
// permission
//
define([
  // Core
  'collections/base/BaseCollection',
  // Utils
  'utils/DataURLConstants'],
function(
  // Core
  BaseCollection,
  // Utils
  DataURLConstants) {

  'use strict';

  var FilePermissionCollection = BaseCollection.extend({

    // Properties
    //-----------

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'FilePermissionCollection',

    // @override
    // Builds the URL structure for file permission
    getURL: function(fileName) {
      let filePermissionTempl = _.template(DataURLConstants.FILE_PERMISSION, {
        fileName: encodeURIComponent(fileName)
      });
      this.url = this.urlRoot + filePermissionTempl;
      return this.url;
    }
  });

  // Returns the FilePermissionCollection class
  return FilePermissionCollection;
});
