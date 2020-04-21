//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// DataURLConstants contains the data source URL that it will get from Gateway
//
define([],
  function() {

    'use strict';

    var retObj = {

      // SERVICE CONFIG
      //-----------------------------------
      // NOTE: Never add any value to AFS_ROOT_URL, it should always be blank
      // Adding value to AFS_ROOT_URL to support proxy server across application
      AFS_ROOT_URL          : '/fa_gateway',

      // File Analytics VM update
      //----------------------------------
      AVM_UPDATE            : '/update_status',

      // File Analytics Health
      //----------------------------------
      HEALTH_STATUS         : '/health_status',

      // File Analytics Log Collection
      //----------------------------------
      COLLECT_LOGS          : '/collect_logs',
      DOWNLOAD_LOGS         : '/collect_logs/download',

      // Used to validate the cvm ip
      IP_VALIDATE           : '/cvm/ip/validate',

      // SVG ON DEMAND DIRECTORY
      //-----------------------------------
      SVG                   : 'app/extras/svg/',

      // Fileserver
      //------------------------------------
      FILE_SERVERS          : '/fileservers',
      APPEND_FILE_SERVER    : 'file_server_uuid=<%= fileServer %>',
      APPEND_USER_NAME      : 'user_name=<%= userName %>',
      CAPACITY_FLUCTUATION  : '/fileservers/capacity/stats?interval=<%= interval %>',
      CAPACITY_DETAILS      : '/fileservers/capacity/details?interval=<%= interval %>&type=<%= type %>',
      FILE_SERVERS_SUBSCRIPTION : '/fileservers/subscription',
      FILE_SERVERS_SCAN_STATUS : '/fileservers/full_scan',
      FILE_SERVERS_DETAILS : '/fileservers/details',

      // Anomaly
      // -------------------------------------
      ANOMALY_NOTIFICATION  : '/anomalies',
      ALERT_DASHBOARD       : '/anomalies/details?detail_type=<%= type %>',

      // Files
      //------------------------------------
      FILE_SEARCH           : '/files',
      TOP_FILE_SEARCH       : '/files/top_accessed',
      FILE_SEARCH_AUDIT     : '/files/<%= fileName %>/audit_history',
      FILE_ACCESS_PATTERN   : '/files/<%= fileName %>/access_patterns',
      FILES_ACCESS_PATTERN  : '/files/access_patterns?operations=' +
        '<%= operation %>&' +
        'start_time_in_ms=<%= startTimeInMs %>&' +
        'end_time_in_ms=<%= endTimeInMs %>&interval=<%= interval %>',
      FILE_TYPE_DISTRIBUTION: '/files/file_type',
      FILE_SIZE_DISTRIBUTION: '/files/distribution_by_size?buckets=<%= buckets %>',
      FILE_DORMANT_DATA     : '/files/dormantdata_distribution?type=<%= dormantTime %>&buckets=<%= buckets %>',
      AUTOCOMPLETE_FILE     : 'suggest?prefix=<%= searchText %>',
      FILE_PERMISSION       : '/files/<%= fileName %>/permission',
      FILE_PATH             : '/files/<%= fileId %>/path',
      SEARCH_TYPE           : 'object_type=<%= objectType %>',

      // File type configurations
      //------------------------------------
      FILE_TYPE_CONFIGURATION      : '/configurations/file_categories/list',
      SAVE_FILE_TYPE_CONFIGURATION : '/configurations/file_categories',

      // Define notification policies / blacklist rules
      //------------------------------------
      NOTIFICATION_POLICY      : '/fileservers/notification_policy',

      // Users
      //------------------------------------
      USER_SEARCH           : '/users',
      TOP_USER_SEARCH       : '/users/top_active/list',
      USER_SEARCH_AUDIT     : '/users/<%= userName %>/audit_history',
      USER_ACCESS_PATTERN   : '/users/<%= userName %>/access_patterns',
      USER_PERMISSION       : '/users/<%= userName %>/permission',

      // User Machines
      // -----------------------------------
      USER_MACHINE_SEARCH        : '/user_machines',
      USER_MACHINE_AUDIT_HISTORY : '/user_machines/<%= machineName %>/audit_history',
      USER_MACHINE_ACCESS_PATTERN: '/user_machines/<%= machineName %>/access_patterns',

      // Operation
      // -----------------------------------
      OPERATIONS : 'operations=<%= operations %>',

      // Stats
      // -----------------------------------
      STATS : 'stats',

      // Chunk Count
      //------------------------------------
      COUNT                 : 'count=<%= count %>',

      // INTERVAL
      //------------------------------------
      INTERVAL              : 'interval=<%= interval %>',

      // Export/Download
      EXPORT_ENABLED       : 'download=<%= isEnabled %>',
      EXPORT_SCROLL_ID     : 'id=<%= scrollId %>',

      // Duration
      //-----------------------------------
      DURATION              : 'duration=<%= duration %>',

      // Page Count
      //-----------------------------------
      PAGE_COUNT            : 'page=<%= pageCount %>',
      NEXT_PAGE_ID          : 'next_page_id=<%= nextPageId %>',

      // Search Entity
      //------------------------------------
      SEARCH_ENTITY         : 'search=<%= searchEntity %>',

      // Date Filter
      //------------------------------------
      DATE_FILTER           : 'start_time_in_ms=<%= startTimeInMs %>&' +
        'end_time_in_ms=<%= endTimeInMs %>',

      // Dashboard
      //------------------------------------
      DASHBOARD_CONFIG      : '/users/dashboard',
      SPECIFIC_DASHBOARD    : '/users/dashboard?dashboard_id=<%= dashboardId %>',
      DASHBOARD_LIST        : '/users/dashboards',

      // SMTP Configuration
      //------------------------------------
      SMTP_CONFIG           : '/smtp_conf',
      DELETE_SMTP_CONFIG    : '/smtp_conf/smtp_config',
      TEST_EMAIL            : '/smtp_conf/test_email',

      // Anomaly Configuration
      //------------------------------------
      ANOMALY_CONFIG        : '/anomaly_configurations',
      DELETE_ANOMALY_CONFIG : '/anomaly_configurations?config_id=<%= id %>',

      // Redirect to 3rd party url template
      //------------------------------------
      REFERRER_URL          : '<%= protocol %>://<%= host %>'
    };

    return retObj;
  }
);
