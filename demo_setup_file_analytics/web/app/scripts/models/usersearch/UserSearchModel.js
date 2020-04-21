//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// UserSearchModel is the model class for user search.
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

  var UserSearchModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure for user search
    getURL: function(searchVal) {
      var chunkCountTempl = _.template(DataURLConstants.COUNT, {
        count: AppConstants.SEARCH_CHUNK_COUNT
      });
      var searchTempl = _.template(DataURLConstants.SEARCH_ENTITY, {
        searchEntity: searchVal
      });
      this.url = this.urlRoot + DataURLConstants.USER_SEARCH + '?' +
        chunkCountTempl + '&' + searchTempl;

      return this.url;
    },

    // Build the URL for automcomplete the search text.
    getAutocompleteURL: function(searchtext) {
      var autoCompletTempl = _.template(DataURLConstants.AUTOCOMPLETE_FILE, {
        searchText: searchtext
      });
      var countTempl = _.template(DataURLConstants.COUNT, {
        count: AppConstants.AUTOSEARCH_DEFAULT_COUNT
      });
      this.url = this.urlRoot + DataURLConstants.USER_SEARCH + '/' +
        autoCompletTempl + '&' + countTempl;
      return this.url;
    }
  });

  // Returns the BaseModel class
  return UserSearchModel;
});
