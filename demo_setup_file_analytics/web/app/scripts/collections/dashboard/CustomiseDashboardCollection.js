//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// CustomiseDashboardCollection is the collection class of the entity
// dashboard.
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

  var CustomiseDashboardCollection = BaseCollection.extend({

    // Properties
    //-----------

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'CustomiseDashboardCollection',

    // @override
    // Builds the URL structure for file permission
    // Builds the URL for getting the dashboard list.
    getDashboardListURL: function() {
      this.url = this.urlRoot + DataURLConstants.DASHBOARD_LIST;
      return this.url;
    }
  });

  // Returns the CustomiseDashboardCollection class
  return CustomiseDashboardCollection;
});
