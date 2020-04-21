//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// RoutingURLConstants contains the routing URL that it will get while
// navigation.
define([],
  function() {

    'use strict';

    var retObj = {

      // Routing
      //------------------------------------

      // Dashboard URLs
      DEFAULT_DASHBOARD     : '#dashboard?fs_id=<%= fileServer %>',

      SPECIFIC_DASHBOARD    : '#dashboard?d_id=<%= dashboardId %>' +
        '&fs_id=<%= fileServer %>',

      // Search URLs
      DEFAULT_SEARCH        : '#search?fs_id=<%= fileServer %>',

      SPECIFIC_SEARCH       : '#search?actionTargetName=<%= searchInput %>' +
        '&actionTargetValue=<%= searchVal %>&fs_id=<%= fileServer %>',

      ANOMALY               : '#anomaly?fs_id=<%= fileServer %>',

      // Settings page URL
      SETTINGS              : '#settings?fs_id=<%= fileServer %>',

      // Enable file server page url
      ENABLE_FILE_SERVER    : '#enable?fs_id=<%= fileServer %>',

      // Health page URLs
      DEFAULT_HEALTH        : '#health?fs_id=<%= fileServer %>'
    };

    return retObj;
  }
);
