//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// DataProperties class contains the key of the models
//
define(function() {

  'use strict';

  return {

    // APP
    //----

    // COMMON
    //-------
    ID              : 'id',
    PAGEUUID        : 'pageUuid',
    NAME            : 'name',
    SHARE           : 'share',
    NEXT_PAGE_ID    : 'next_page_id',
    NEXT_BATCH_ID   : 'next_batch_id',
    COUNT           : 'count',
    PAGE            : 'page',
    CATEGORY        : 'category',
    FOLDER          : 'folder',
    METRIC          : 'metric',

    // Files
    // STATS_FILES_ACCESS_PATTERN  : 'files_access_pattern',

    // Below is the standard key used for error response objects.
    ERROR_MESSAGE : 'message',
    ERROR_MESSAGE_BACKEND : 'error',

    // File access pattern for audit history
    STATS_FILE_AUDIT_HISTORY   : 'access_pattern_file_audit_history',

    // File distribution by type
    STATS_FILE_DISTRIBUTION_BY_TYPE : 'show_file_distribution_by_type',
    // File distribution by size
    STATS_FILE_DISTRIBUTION_BY_SIZE : 'show_file_distribution_by_size',
    // File distribution by age
    STATS_FILE_DISTRIBUTION_BY_AGE : 'show_file_distribution_by_age',
    // File access pattern by operation
    ACCESS_PATTERN_FILES_OPERATIONS     : 'access_pattern_file_operations',

    SHOW_TOP_ACCESSED_FILES             : 'show_top_accessed_files',
    SHOW_TOP_ACTIVE_USERS               : 'show_top_active_users',
    SHOW_MALICIOUS_USERS                : 'show_malicious_users',
    SHOW_CAPACITY_FLUCTUATION           : 'show_capacity_fluctuation',
    SHOW_ALERT_OVER_TIME                : 'show_alert_over_time',
    SHOW_TOP_CONTRIBUTING_FOLDERS       : 'show_top_contributing_folders',
    SHOW_TOP_VIOLATING_USERS            : 'show_top_violating_users',
    SHOW_ALERT_TYPE                     : 'show_alert_type',
    SHOW_FILE_TYPE_OVER_TIME            : 'show_file_type_over_time',

    // User access pattern for audit history
    STATS_USER_AUDIT_HISTORY   : 'access_pattern_user_audit_history',

    // Tasks Model properties
    TASK_MESSAGE               : 'message',
    TASK_PERCENT               : 'percent',
    TASK_ERROR                 : 'error',
    TASK_PERCENT_SHOW          : 'showPercent',

    // METADATA
    //---------
    // Collection returned from the backend contains a metadata information
    // Total after filter applied
    META_SCAN_STATUS      : 'scan_status',
    META_SCAN_COMPLETE    : 'scan_completed',
    META_SCAN_FAILED      : 'scan_failed',
    META_SCAN_NOT_STARTED : 'scan_not_started',
    META_SCAN_INPROGRESS  : 'scan_inprogress',
    META_TOTAL_SCAN_SHARES: 'shares_to_scan',
    // Unfiltered total.
    META_GRAND_TOTAL      : 'grandTotalEntities',
    META_START_INDEX      : 'startIndex',
    META_END_INDEX        : 'endIndex',
    META_PAGE             : 'page',
    META_TOTAL            : 'total',
    META_COUNT            : 'count',

    // Proxy Protocols
    PROTOCOLS: {
      HTTP : 'http',
      HTTPS: 'https'
    },

    // Folder Search
    FOLDER_SEARCH_NAME : 'name',
    FOLDER_SEARCH_SHARE_NAME : 'share',
    FOLDER_OWNER_NAME : 'owner',
    FOLDER_SEARCH_PARENT_FOLDER : 'parent',
    FOLDER_SEARCH_LAST_EVENT : 'last_event',

    // Capacity Details
    CAPACITY_ENTITY_DETAILS : 'details',
    CAPACITY_ADDED          : 'added',
    CAPACITY_REMOVED        : 'removed'
  };
});
