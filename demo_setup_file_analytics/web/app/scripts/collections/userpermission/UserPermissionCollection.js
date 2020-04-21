//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// UserPermissionCollection is the collection class of the entity user
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

  var UserPermissionCollection = BaseCollection.extend({

    // Properties
    //-----------

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'UserPermissionCollection',

    // @override
    // Builds the URL structure for file permission
    getURL: function(userName) {
      let countTempl = _.template(DataURLConstants.COUNT, {
        count: 10000
      });

      let userPermissionTempl = _.template(DataURLConstants.USER_PERMISSION, {
        userName: encodeURIComponent(userName)
      });
      this.url = this.urlRoot + userPermissionTempl + '?' + countTempl;
      return this.url;
    }
  });

  // Returns the UserPermissionCollection class
  return UserPermissionCollection;
});
