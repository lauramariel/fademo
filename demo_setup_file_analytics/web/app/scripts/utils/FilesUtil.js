//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FilesUtil contains common utility functions for files
//
define([
  // Utils
  'utils/AppConstants',
  // Models/Collections
  'models/filesearch/FileSearchModel'],
function(
  // Utils
  AppConstants,
  // Models/Collections
  FileSearchModel) {

  'use strict';

  var FilesUtil = {

    name : 'FilesUtil',

    // Return the file path of the file corresponding to file id.
    getFilePath: function(fileId) {
      let fileModel = new FileSearchModel(),
          path = AppConstants.PATH_NOT_AVAILABLE;

      if (fileId) {
        // If ID doesn't exist, hit the API to get the file path.
        fileModel.getFilePathURL(fileId);
        return new Promise(resolve => {
          fileModel.fetch({
            success: function(data) {
              if (data && data.attributes.path) {
                path = data.attributes.path;
              }
              resolve(path);
            },
            error: function(xhr) {
              // Throw generic error no matter what the error code is.
              resolve(path);
            }
          });
        });
      }

      return path;
    }

  };

  return _.extend({}, FilesUtil);
});
