//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileSearchModel is the model class of the entity file search model
//
define([
  // Core
  'models/base/BaseModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // References of core
  BaseModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var FileSearchModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP : {
      ID         : 'id',
      NAME       : 'name',
      OWNER      : 'owner',
      SHARE      : 'share',
      PARENT     : 'parent',
      LAST_EVENT : 'last_event',
      last_event : {
        OPERATION : 'operation',
        USERNAME  : 'username',
        DATE      : 'modified_date'
      }
    },

    // @override
    // Builds the URL structure for file search
    getURL: function(searchVal, count, objectType) {
      searchVal = encodeURIComponent(searchVal);
      count = count || AppConstants.SEARCH_CHUNK_COUNT;

      let chunkCountTempl = _.template(DataURLConstants.COUNT, {
        count: count
      });
      let searchTempl = _.template(DataURLConstants.SEARCH_ENTITY, {
        searchEntity: searchVal
      });

      this.url = this.urlRoot + DataURLConstants.FILE_SEARCH + '?' +
        chunkCountTempl + '&' + searchTempl;

      if (objectType) {
        let searchTypeTempl = _.template(DataURLConstants.SEARCH_TYPE, {
          objectType : objectType
        });
        this.url += '&' + searchTypeTempl;
      }

      return this.url;
    },

    // Build the URL for automcomplete the search text.
    getAutocompleteURL: function(searchtext, objectType) {
      var autoCompleteTempl = _.template(DataURLConstants.AUTOCOMPLETE_FILE, {
        searchText: searchtext
      });
      var countTempl = _.template(DataURLConstants.COUNT, {
        count: AppConstants.AUTOSEARCH_DEFAULT_COUNT
      });
      this.url = this.urlRoot + DataURLConstants.FILE_SEARCH + '/'
        + autoCompleteTempl + '&' + countTempl;

      if (objectType) {
        let searchTypeTempl = _.template(DataURLConstants.SEARCH_TYPE, {
          objectType : objectType
        });

        this.url += '&' + searchTypeTempl;
      }

      return this.url;
    },

    // Build the URL for getting the file path of entered file ID.
    getFilePathURL: function(fileId) {
      let filePathTempl = _.template(DataURLConstants.FILE_PATH, {
        fileId: fileId
      });

      this.url = this.urlRoot + filePathTempl;

      return this.url;
    }
  });

  // Returns the FileSearchModel class
  return FileSearchModel;
});
