//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AppConstants
//
define(function() {

  'use strict';

  return {

    // VIEW MODULE FACTORY
    //--------------------

    // Common
    LOADING           : 'loading',
    NO_DATA_AVAILABLE : 'No Data Available',
    NOT_AVAILABLE     : 'NA',
    NO_USER           : 'No User',
    PATH_NOT_AVAILABLE: 'Path not available!',
    CONFIRM_DELETE_MSG: 'Are you sure you want to delete this configuration?',

    // Action for audit history wizard.
    AUDIT_ACTION : 'audit',

    // Page Uuid separator
    PAGE_UUID_SEPARATOR: '.',

    // Used with pageId to get pageUuid
    TAIL_ID            : 'file_insights',

    // Export Data
    DEFAULT_EXPORT_COUNT: 10000,

    // TIME CONSTANTS
    //---------------

    // Date time formats
    DATE_FORMAT_FULL         : 'mm/dd/yy, hh:ii:ssa',
    DATE_FORMAT_FULL_NO_YEAR : 'mm/dd, hh:ii:ssa',
    DATE_FORMAT_HOUR_MIN     : 'hh:ii A',

    // Display
    INVALID_STRING : '-',

    // Root Folder
    ROOT_FOLDER    : '/',

    // Intervals
    STATS_PER_HOUR    : '1h',
    STATS_PER_DAY     : '1d',
    STATS_PER_WEEK    : '5d',
    STATS_PER_MONTH   : '1M',
    STATS_PER_QUARTER : '3M',
    STATS_PER_SIX_MONTHS   : '6M',

    // Intervals Value
    STATS_PER_WEEK_VALUE    : 5,

    // Access operations
    ACCESS_OPERATIONS: ['FileWrite', 'FileRead', 'SecurityChange',
      'Rename', 'Symlink', 'SetAttr'],

    // Conversion ratios
    MICROS_PER_SECOND  : 1000000,
    MICROS_PER_DAY     : 86400000000,
    MICROS_PER_MILLI   : 1000,
    MICROS_PER_HOUR    : 3600000000,
    MILLIS_PER_SECOND  : 1000,
    MILLIS_PER_MINUTE  : 60000,
    MILLIS_PER_HOUR    : 3600000,
    MILLIS_PER_DAY     : 86400000,
    MILLIS_PER_WEEK    : 604800000,
    HOURS_PER_DAY      : 24,
    MINUTES_PER_HOUR   : 60,
    SECONDS_PER_MINUTE : 60,
    SECONDS_PER_HOUR   : 3600,
    SECONDS_PER_DAY    : 86400,

    // Entity Type
    ACCESS_PATTERN_FILES_OPERATIONS     : 'access_pattern_file_operations',
    ACCESS_PATTERN_FILE_AUDIT_HISTORY   : 'access_pattern_file_audit_history',
    ACCESS_PATTERN_USER_AUDIT_HISTORY   : 'access_pattern_user_audit_history',
    ACCESS_PATTERN_FILES_MODIFICATIONS  : 'access_pattern_file_modifications',
    SHOW_FILE_DISTRIBUTION_BY_TYPE      : 'show_file_distribution_by_type',
    SHOW_FILE_DISTRIBUTION_BY_SIZE      : 'show_file_distribution_by_size',
    SHOW_FILE_DISTRIBUTION_BY_AGE       : 'show_file_distribution_by_age',
    SHOW_TOP_ACCESSED_FILES             : 'show_top_accessed_files',
    SHOW_TOP_ACTIVE_USERS               : 'show_top_active_users',
    SHOW_MALICIOUS_USERS                : 'show_malicious_users',
    SHOW_CAPACITY_FLUCTUATION           : 'show_capacity_fluctuation',
    SHOW_ANOMALY_ALERTS                 : 'show_anomaly_alerts',
    SHOW_CAPACITY_FLUCTUATION_LEGENDS   : 'show_capacity_fluctuation_legends',
    SHOW_TOP_VIOLATING_USERS            : 'show_top_violating_users',
    SHOW_TOP_CONTRIBUTING_FOLDERS       : 'show_top_contributing_folders',
    SHOW_ALERT_TYPE                     : 'show_alert_type',
    SHOW_ALERT_OVER_TIME                : 'show_alert_over_time',
    SHOW_FILE_TYPE_OVER_TIME            : 'show_file_type_over_time',

    // Health Page Entities
    SHOW_DATA_SUMMARY                   : 'show_data_summary',
    SHOW_OVERALL_HEALTH                 : 'show_overall_health',
    SHOW_ES_SUMMARY                     : 'show_es_summary',
    SHOW_HOST_MEMORY                    : 'show_host_memory',
    SHOW_HOST_CPU_USAGE                 : 'show_host_cpu_usage',
    SHOW_STORAGE_SUMMARY                : 'show_storage_summary',

    // The categories returned from server are in snake case and do
    // not represent the display text as required. The values returned from
    // server are converted to Human readable formats using below constants
    CATEGORIES: {
      ADOBE_ACROBAT         : 'Adobe Acrobat',
      ARCHIVES              : 'Archives',
      AUDIO                 : 'Audio',
      BACKUPS               : 'Backups',
      CD_DVD_IMAGES         : 'CD/DVD Images',
      DESKTOP_PUBLISHING    : 'Desktop Publishing',
      EMAIL_ARCHIVES        : 'Email Archives',
      HARD_DRIVE_IMAGES     : 'Hard Drive Images',
      IMAGES                : 'Images',
      INSTALLERS            : 'Installers',
      LOG_FILES             : 'Log Files',
      LOTUS_NOTES           : 'Lotus Notes',
      MS_OFFICE_DOCUMENTS   : 'MS Office Documents',
      SYSTEM_FILES          : 'System Files',
      TEXT_FILES            : 'Text Files',
      VIDEO                 : 'Video',
      DISK_IMAGE            : 'Disk Image',
      OTHER_FILE_TYPES      : 'Others',
      NO_EXTENSIONS         : 'No Extension'
    },

    // Get key for categorising net capacity
    OTHER_FILE_TYPES : 'other_file_types',
    NO_EXTENSIONS : 'no_extensions',

    LEGENDS: {
      MALICIOUS_USER_TABLE     : 'Number of Permission Denials',
      TOP_USER_TABLE           : 'User Activity',
      TOP_FILE_TABLE           : 'File Activity',
      FILE_SIZE_TABLE          : 'Number of Files',
      VIOLATING_USER_TABLE     : 'Number of Anomalies',
      CONTRIBUTING_FOLDER_TABLE: 'Number of Anomalies'
    },

    HEADINGS: {
      access_pattern_file_operations    : 'File Operations',
      access_pattern_file_modifications : 'Access Pattern: Files Modifications',
      access_pattern_file_audit_history : 'Files Events for: <%= auditTarget %>',
      access_pattern_user_audit_history : 'User Events for: <%= auditTarget %>',
      show_file_distribution_by_type    : 'File Distribution by Type',
      show_file_distribution_by_size    : 'File Distribution by Size',
      show_file_distribution_by_age     : 'Data Age',
      show_anomaly_alerts               : 'Top 3 Anomaly Alerts',
      show_capacity_fluctuation         : 'Capacity Trend',
      show_malicious_users              : 'Permission Denials',
      show_top_accessed_files           : 'Top 5 Accessed Files',
      show_top_active_users             : 'Top 5 Active Users',
      show_top_violating_users          : 'Top Users',
      show_top_contributing_folders     : 'Top Folders',
      show_alert_type                   : 'Operation Anomaly Types',
      show_alert_over_time              : 'Anomaly Trend',
      show_file_type_over_time          : 'Show Trend (Top 5 File Types)',
      show_data_summary                 : 'Data Summary',
      show_overall_health               : 'Overall Health',
      show_es_summary                   : 'Data Server Summary',
      show_host_memory                  : 'Host Memory',
      show_host_cpu_usage               : 'Host CPU Usage',
      show_storage_summary              : 'Storage Summary'
    },

    // Health page services display name
    HEALTH_SERVICES: {
      ANALYTICS_GATEWAY   : 'Analytics Gateway',
      ANALYTICS_UI        : 'Analytics UI',
      EVENT_PROCESSOR     : 'File System Scan',
      CROND               : 'Task Scheduler',
      ANAOMALIES_DETECTION: 'Anomalies Detection',
      ELASTICSEARCH       : 'Data service',
      ZOOKEEPER           : 'Message Configuration',
      KAFKA               : 'Message'
    },

    // Count of anomlay notification.
    ANOMALY_NOTIFICATION_COUNT: 3,

    // Anomaly widgets
    ANOMALY_DETAIL_TYPES: {
      TOP_USERS   : 'top_users',
      TOP_FOLDERS : 'top_dirs',
      ALERT_TYPES : 'alert_types',
      TIME_SERIES : 'time_series'
    },

    ANOMALY_COLUMN_NAMES : {
      EVENTS : 'Events',
      MINIMUM_OPERATION_PER : 'Minimum Operation %',
      MINIMUM_OPERATION_COUNT : 'Minimum Operation Count',
      USER : 'User',
      TIME : 'Interval',
      TYPE : 'Type'
    },

    // Notification / Blacklist rules
    NOTIFICATION_POLICY_TYPES: {
      USER            : 'users',
      CLIENT_IPS      : 'client_ips',
      FILE_EXTENSIONS : 'file_extensions'
    },

    // Display name for notification / blacklist rules
    NOTIFICATION_POLICY_DISPLAY: {
      users           : 'Users',
      client_ips      : 'Client IPs',
      file_extensions : 'File Extensions'
    },

    // Main alert types.
    ALERT_MAIN_TYPES: {
      FILE_OPERATION_ANOMALY: 'FileOperationAnomaly'
    },

    TOOLTIP_HEADINGS: {
      access_pattern_file_operations    : 'Access Pattern: Files Operations',
      access_pattern_file_modifications : 'Access Pattern: Files Modifications',
      access_pattern_file_audit_history : 'File Event',
      access_pattern_user_audit_history : 'User Event',
      show_file_distribution_by_type    : 'File Distribution By Type',
      show_file_distribution_by_size    : 'File Distribution By Size',
      show_capacity_fluctuation         : 'Capacity Trend',
      show_file_distribution_by_age     : 'Data Age',
      show_alert_over_time              : 'Alert Type Over Time',
      show_alert_type                   : 'Anomaly Types'
    },

    TOOLTIP: {
      CAPACITY_ADDED      : 'Capacity Added',
      CAPACITY_REMOVED    : 'Capacity Removed',
      NET_CAPACITY_CHANGE : 'Net Change'
    },

    // Super set of all operations
    OPERATION : {
      FileClose                   : 'Close File',
      FileCreate                  : 'Create File',
      FileDelete                  : 'Delete',
      DirectoryCreate             : 'Make Directory',
      FileOpen                    : 'Open',
      SecurityChange              : 'Permission Changed',
      PermissionDenied            : 'Permission Denied',
      FileRead                    : 'Read',
      DirectoryDelete             : 'Remove Directory',
      Rename                      : 'Rename',
      SetAttr                     : 'Set Attribute',
      FileWrite                   : 'Write',
      Symlink                     : 'Symlink',
      PermissionDeniedFileBlocking: 'Permission Denied (File Blocking)'
    },

    // Excluded operation set
    EXCLUDED_OPERATIONS: ['FileOpen', 'FileClose'],

    // Super set of all operation values
    OPERATION_VALUES : {
      FileClose                   : 'FileClose',
      FileCreate                  : 'FileCreate',
      FileDelete                  : 'FileDelete',
      DirectoryCreate             : 'DirectoryCreate',
      FileOpen                    : 'FileOpen',
      SecurityChange              : 'SecurityChange',
      PermissionDenied            : 'PermissionDenied',
      FileRead                    : 'FileRead',
      DirectoryDelete             : 'DirectoryDelete',
      Rename                      : 'Rename',
      SetAttr                     : 'SetAttr',
      FileWrite                   : 'FileWrite',
      Symlink                     : 'Symlink',
      PermissionDeniedFileBlocking: 'PermissionDeniedFileBlocking'
    },

    // File audit operations
    FILE_AUDIT_FILTER_OPERATIONS: {
      FileCreate                  : 'Create File',
      FileDelete                  : 'Delete',
      SecurityChange              : 'Permission Changed',
      PermissionDenied            : 'Permission Denied',
      FileRead                    : 'Read',
      Rename                      : 'Rename',
      SetAttr                     : 'Set Attribute',
      FileWrite                   : 'Write',
      Symlink                     : 'Symlink',
      PermissionDeniedFileBlocking: 'Permission Denied (File Blocking)'
    },

    // User audit operations
    USER_AUDIT_FILTER_OPERATIONS: {
      FileCreate                  : 'Create File',
      FileDelete                  : 'Delete',
      DirectoryCreate             : 'Make Directory',
      SecurityChange              : 'Permission Changed',
      PermissionDenied            : 'Permission Denied',
      FileRead                    : 'Read',
      DirectoryDelete             : 'Remove Directory',
      Rename                      : 'Rename',
      SetAttr                     : 'Set Attribute',
      FileWrite                   : 'Write',
      Symlink                     : 'Symlink',
      PermissionDeniedFileBlocking: 'Permission Denied (File Blocking)'
    },

    // Directory audit operations
    DIRECTORY_AUDIT_FILTER_OPERATIONS: {
      DirectoryCreate             : 'Make Directory',
      SecurityChange              : 'Permission Changed',
      PermissionDenied            : 'Permission Denied',
      DirectoryDelete             : 'Remove Directory',
      Rename                      : 'Rename',
      SetAttr                     : 'Set Attribute',
      Symlink                     : 'Symlink',
      PermissionDeniedFileBlocking: 'Permission Denied (File Blocking)'
    },

    ZERO_MONTHS_OLDER : '0_months_older',
    THREE_MONTHS_OLDER : '3_months_older',
    SIX_MONTHS_OLDER : '6_months_older',
    TWELVE_MONTHS_OLDER : '12_months_older',

    DORMANT_DATA: {
      '0_months_older' : 'Less than 3 months',
      '3_months_older' : '3 to 6 months',
      '6_months_older' : '6 to 12 months',
      '12_months_older': ' > 12 months'
    },

    DORMANT_DATA_BUCKETS: '0,3,6,12',

    FILE_SIZE_BUCKETS: '0-1048576,1048576-10485760,10485760-104857600,104857600-1073741824,1073741824',

    DASHBOARD_OPERATIONS: {
      FileOpen                : 'Open',
      FileWrite               : 'Write',
      FileCreate              : 'Create File',
      FileRead                : 'Read',
      DirectoryCreate         : 'Make Directory'
    },

    DASHBOARD_MODIFICATIONS: {
      Rename              : 'Rename',
      FileDelete          : 'Delete',
      SecurityChange      : 'Permission Changed',
      DirectoryDelete     : 'Remove Directory',
      PermissionDenied    : 'Permission Denied'
    },

    DISPLAY_TYPE : {
      show_top_accessed_files        : 'Top 5 accessed files',
      show_top_active_users          : 'Top 5 active users',
      show_file_distribution_by_type : 'Top 10 File Types',
      show_file_distribution_by_size : 'File distribution by size',
      show_file_distribution_by_age  : 'Dormant Data'
    },

    SEARCH_BY : {
      file : 'File',
      user : 'User'
    },

    FILE_SEARCH_TYPE: {
      FILE : 'File',
      DIRECTORY: 'Directory'
    },

    // Settings Page - To be used when making it similar to
    // prism i.e. with side tab
    SETTINGS : {
      GENERAL       : 'general',
      EMAIL_ANOMALY : 'email_anomaly',
      DATA_RETENTION      : 'data_retention',
      SMTP_CONFIGURATION  : 'smtp_configuration',
      ANOMALY_RULES       : 'add_anomaly_rules'
    },

    SETTINGS_TITLE : {
      general       : 'General',
      email_anomaly : 'Email and Anomalies',
      data_retention      : 'Data Retention',
      smtp_configuration  : 'SMTP Configuration',
      add_anomaly_rules   : 'Define Anomaly Rules'
    },

    // Configure anomaly message
    CONFIGURE_ANOMALY: ' Configure new anomaly',

    // Applies for both files as well as directories.
    ANOMALY_OPERATIONS: {
      Delete : 'Delete',
      Create : 'Create',
      SecurityChange: 'Permission Changed',
      PermissionDenied : 'Permission Denied (Access)',
      PermissionDeniedFileBlocking: 'Permission Denied (File Blocking)'
    },

    // In case of change of these values, update the
    // keys of ANOMALY_OPERATIONS.
    ANOMALY_OPERATIONS_VALUE: {
      Delete : 'Delete',
      Create : 'Create',
      SecurityChange: 'SecurityChange',
      PermissionDenied : 'PermissionDenied',
      PermissionDeniedFileBlocking: 'PermissionDeniedFileBlocking'
    },

    ANOMALY_USER: {
      ALL_USERS : 'All Users',
      INDIVIDUAL: 'Individual'
    },

    ANOMALY_USER_VAL: {
      ALL_USERS : false,
      INDIVIDUAL: true
    },

    ANOMALY_INTERVAL_TYPE: {
      DAYS: 'Daily',
      HOURS: 'Hourly'
    },

    ANOMALY_INTERVAL_TYPE_VAL: {
      DAYS: 'days',
      HOURS: 'hours'
    },

    // Default Duration Value
    DEFAULT_DURATION: 1,

    // Intervals
    HOURS: 'hours',
    DAYS : 'days',
    MONTHS: 'months',
    WEEKS : 'weeks',
    TWO_YEARS: 'two-year',
    THREE_YEARS: 'three-year',

    MONTH_DAYS: 30,

    YEAR_TO_MONTH: 12,

    // Dropdown value for years
    DROPDOWN_YEAR_OPTIONS_VALUE : {
      LAST_1_YEAR  : 12,
      LAST_2_YEARS : 24,
      LAST_3_YEARS : 36
    },

    // Dropdown text for years
    DROPDOWN_YEAR_OPTIONS_TEXT : {
      LAST_1_YEAR  : 'Last 1 year',
      LAST_2_YEARS : 'Last 2 years',
      LAST_3_YEARS : 'Last 3 years'
    },

    // Duration text
    ALL_DURATION_OPTIONS_TEXT : {
      LAST_24_HRS  : 'Last 24 hours',
      LAST_7_DAYS  : 'Last 7 days',
      LAST_30_DAYS : 'Last 30 days',
      LAST_2_MONTHS : 'Last 2 months',
      LAST_3_MONTHS : 'Last 3 months',
      LAST_4_MONTHS : 'Last 4 months',
      LAST_5_MONTHS : 'Last 5 months',
      LAST_6_MONTHS : 'Last 6 months',
      LAST_7_MONTHS : 'Last 7 months',
      LAST_8_MONTHS : 'Last 8 months',
      LAST_9_MONTHS : 'Last 9 months',
      LAST_10_MONTHS: 'Last 10 months',
      LAST_11_MONTHS: 'Last 11 months',
      LAST_1_YEAR   : 'Last 1 year',
      LAST_2_YEARS  : 'Last 2 years',
      LAST_3_YEARS  : 'Last 3 years'
    },

    // Duration value
    ALL_DURATION_OPTIONS_VALUE : {
      LAST_24_HRS  : '1d',
      LAST_7_DAYS  : '7d',
      LAST_30_DAYS : '30d',
      LAST_2_MONTHS : '2',
      LAST_3_MONTHS : '3',
      LAST_4_MONTHS : '4',
      LAST_5_MONTHS : '5',
      LAST_6_MONTHS : '6',
      LAST_7_MONTHS : '7',
      LAST_8_MONTHS : '8',
      LAST_9_MONTHS : '9',
      LAST_10_MONTHS: '10',
      LAST_11_MONTHS: '11',
      LAST_1_YEAR   : '12',
      LAST_2_YEARS  : '24',
      LAST_3_YEARS  : '36'
    },

    // Data retention options text
    RETENTION_DURATION_LIST : {
      LAST_1_MONTH  : 'Last 1 month',
      LAST_2_MONTHS : 'Last 2 months',
      LAST_3_MONTHS : 'Last 3 months',
      LAST_4_MONTHS : 'Last 4 months',
      LAST_5_MONTHS : 'Last 5 months',
      LAST_6_MONTHS : 'Last 6 months',
      LAST_7_MONTHS : 'Last 7 months',
      LAST_8_MONTHS : 'Last 8 months',
      LAST_9_MONTHS : 'Last 9 months',
      LAST_10_MONTHS: 'Last 10 months',
      LAST_11_MONTHS: 'Last 11 months',
      LAST_1_YEAR   : 'Last 1 year'
      // For ENG-220253
      // LAST_2_YEARS  : 'Last 2 years',
      // LAST_3_YEARS  : 'Last 3 years'
    },

    // Data retention option value
    RETENTION_DURATION_VALUES : {
      LAST_1_MONTH  : 1,
      LAST_2_MONTHS : 2,
      LAST_3_MONTHS : 3,
      LAST_4_MONTHS : 4,
      LAST_5_MONTHS : 5,
      LAST_6_MONTHS : 6,
      LAST_7_MONTHS : 7,
      LAST_8_MONTHS : 8,
      LAST_9_MONTHS : 9,
      LAST_10_MONTHS: 10,
      LAST_11_MONTHS: 11,
      LAST_1_YEAR   : 12
      // For ENG-220253
      // LAST_2_YEARS  : 24,
      // LAST_3_YEARS  : 36
    },

    // Health host storage options
    HOST_STORAGE_OPTIONS_TEXT: {
      HOST_DISK_USAGE: 'Host Disk Usage',
      HOST_VOLUME_GROUP_USAGE: 'Analytics Data Disk Usage'
    },

    // Health host storage values
    // Values as kept as string as the json returned by health service has keys
    // in same format for FA 2.1.0 - FEAT-10311
    HOST_STORAGE_OPTIONS_VALUE: {
      HOST_DISK_USAGE         : 'file_analytics_disk_used',
      HOST_VOLUME_GROUP_USAGE : 'file_analytics_volume_group_used'
    },

    // Health status constants codes
    HEALTH_STATUS_CODES: {
      GREEN   : 'green',
      YELLOW  : 'yellow',
      RED     : 'red'
    },

    // Health status constants values
    HEALTH_STATUS_VALUES: {
      'green'   : 'Ok',
      'yellow'  : 'Warning',
      'red'     : 'Critical'
    },

    // Number of minutes after which the data is considered stale
    STALE_HEALTH_TIMEOUT: 30,

    // Months
    MONTHS_ARR: ['Jan', 'Feb', 'Mar', 'Apr', 'May',
      'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    // Text on button
    BUTTON_TEXT: {
      BTN_CREATE : 'Create',
      BTN_UPDATE : 'Update',
      BTN_CANCEL : 'Cancel',
      BTN_SCAN   : 'Scan',
      BTN_TEST   : 'Test',
      BTN_REMOVE : 'Remove',
      BTN_DOWNLOAD : 'Download'
    },

    // Chunk Count
    DEFAULT_CHUNK_COUNT: 5,
    SEARCH_CHUNK_COUNT: 20,
    AUTOSEARCH_DEFAULT_COUNT: 5,
    MORE_RECORDS_COUNT : 50,

    // Put a throttle on number of rows that can be downloaded
    EXPORT_LIMIT : 10000,

    // Dormant Time Type
    CREATION_TIME : 'creation_time',
    LAST_MODIFIED_TIME : 'last_modified_time',

    // Wizards Entity
    ENTITY_FILE_AUDIT_HISTORY : 'file_audit',
    ENTITY_USER_AUDIT_HISTORY : 'user_audit',
    ENTITY_USER_MACHINE_AUDIT_HISTORY : 'user_machine_audit',
    ENTITY_ANOMALY_POLICY     : 'anomaly_policy',
    ENTITY_DASHBOARD          : 'custom_dashboard',
    ENTITY_SMTP               : 'smtp_configuration',
    ENTITY_DATA_RETENTION     : 'data_retention',
    ENTITY_CAPACITY_TREND     : 'capacity_trend',
    ENTITY_FILE_TYPE          : 'file_type',
    ENTITY_FILE_SERVER_ENABLE : 'file_server_enable',
    ENTITY_FILE_SERVER_AD_LDAP_CONFIG : 'file_server_ad_ldap_config',
    ENTITY_TRIGGER_MDATA      : 'trigger_metadata_collection',
    ENTITY_ACTIVE_USER        : 'active_user',
    ENTITY_ACCESSED_FILES     : 'accessed_files',
    ENTITY_PERMISSION_DENIALS : 'permission_denials',
    ENTITY_ANOMALY_USER       : 'anamoly_user',
    ENTITY_ANOMALY_FOLDER     : 'anamoly_folder',
    ENTITY_ABOUT_AFS          : 'about_afs',
    ENTITY_LOG_COLLECTION     : 'collect_logs',
    ENTITY_BLACKLIST          : 'blacklist_rules',

    // Dashboard entities
    CAPACITY_TREND: {
      CAPACITY_ADDED  : 'Capacity Added',
      CAPACITY_REMOVED: 'Capacity Removed',
      NET_CAPACITY    : 'Net Change',
      TOTAL_CAPACITY  : 'Total Capacity'
    },

    // NOTIFICATION
    //-------------
    NOTIFY_SUCCESS : 'notifySuccess',
    NOTIFY_ERROR   : 'notifyError',
    NOTIFY_WARNING : 'notifyWarning',
    NOTIFY_INFO    : 'notifyInfo',

    // TASK MANAGER
    TASK_SUCCESS    : 'succeeded',
    TASK_ERROR      : 'failed',

    // constants for the notification message length
    NOTIFICATION_LENGTH_LIMIT : 165,
    ELLIPSIS_TEXT : '... ',

    // Temporary Id
    ID_TO_BE_ADDED: 'ID_TO_BE_ADDED',

    // Popup Titles
    POPUP: {
      POLICY                    : 'Define Anomaly Rules',
      SMTP                      : 'SMTP Configuration',
      DATA_RETENTION            : 'Update Data Retention',
      CAPACITY_TREND            : 'Capacity Trend Details for: ',
      FILE_TYPE                 : 'File Distribution by Type',
      FILE_SERVER_ENABLE        : 'Enable File Analytics',
      FILE_SERVER_AD_LDAP_CONFIG: 'Update AD/LDAP Configuration',
      TRIGGER_METADATA          : 'Scan File System',
      ACTIVE_USERS_POPUP        : 'Top 50 Active Users',
      ACCESSED_FILES_POPUP      : 'Top 50 Accessed Files',
      PERMISSION_DENIALS_POPUP  : 'Permission Denials',
      USERS_ANAMOLY_POPUP       : 'Top Users',
      FOLDERS_ANAMOLY_POPUP     : 'Top Folders',
      ABOUT_AFS_POPUP           : 'About File Analytics',
      COLLECT_LOGS_POPUP        : 'Collect Logs',
      FILE_CATEGORY_CONFIG_POPUP: 'Update File Category',
      BLACKLIST_RULES_POPUP     : 'Define Blacklisting Rules'
    },

    // Constant for more popup param
    MORE_RECORD_POPUP_VIEW : 'More Record Popup View',

    // DATATABLES
    //-----------

    /* Column Types */
    TABLE_COL_TYPE_DISPLAY  : 'display',
    TABLE_COL_TYPE_SORT     : 'sort',
    TABLE_COL_TYPE_TYPE     : 'type',
    TABLE_COL_TYPE_FILTER   : 'filter',
    TABLE_COL_TYPE_EXPORT   : 'export',

    // Component-related constants
    COMPONENTS: {
      SVG: {
        VIEWBOX: {
          SIZE_10: '0 0 10 10',
          SIZE_12: '0 0 12 12',
          DEFAULT: '0 792 2048 2048'
        }
      }
    },

    DEFAULT_MAX_TABLE_ROWS: 10000,

    // PAGE ROUTES
    //------------
    // Any changes on the values of the page routes, the PAGE_NAMES and Page ID need to
    // be changed as well also vice-versa for Page ID
    PAGE_HOME           : 'home',
    PAGE_DASHBOARD      : 'dashboard',
    PAGE_SEARCH         : 'search',
    PAGE_SETTINGS       : 'settings',
    PAGE_ENABLE         : 'enable',
    PAGE_NOT_FOUND      : 'page_not_found',

    // PAGE NAMES
    //-----------
    PAGE_NAMES   : {
      'home'              : 'Home',
      'dashboard'         : 'Dashboard',
      'search'            : 'Search',
      'settings'          : 'Settings',
      'file_server_enable': 'Enable File Server'
    },

    // Page ID for views.
    // Any changes need to updated in Page routes as well
    HOME_PAGE_ID              : 'home',
    DASHBOARD_PAGE_ID         : 'dashboard',
    SEARCH_PAGE_ID            : 'search',
    ANOMALY_PAGE_ID           : 'anomaly',
    SETTINGS_PAGE_ID          : 'settings',
    FILE_SERVER_ENABLE_PAGE_ID: 'file_server_enable',
    NOT_FOUND_PAGE_ID         : 'page_not_found',
    HEALTH_PAGE_ID            : 'health',

    MODAL: {

      // Type
      TYPE: {
        DEFAULT : 'default',
        INLINE  : 'inline'
      },

      // ACTION TYPES
      //-------------
      ACT: {
        // Antiscroll Action
        AS_REFRESH    : 'MODAL_ACTION_AS_REFRESH',
        AS_REBUILD    : 'MODAL_ACTION_AS_REBUILD',

        // Alert Action
        ALERT_SHOW    : 'MODAL_ACTION_ALERT_SHOW',
        ALERT_HIDE    : 'MODAL_ACTION_ALERT_HIDE',

        // Cover Layer Action
        COVER_SHOW    : 'MODAL_ACTION_COVER_SHOW',
        COVER_HIDE    : 'MODAL_ACTION_COVER_HIDE',

        // Tabs Action
        TABS_SHOW     : 'MODAL_ACTION_TABS_SHOW',
        TABS_HIDE     : 'MODAL_ACTION_TABS_HIDE',

        // Title Action
        SET_TITLE     : 'MODAL_ACTION_SET_TITLE',
        REVERT_TITLE  : 'MODAL_ACTION_REVERT_TITLE',

        // Set Step (Tabs)
        SET_STEP      : 'MODAL_ACTION_SET_STEP',

        // Subview Action
        SUBVIEW_SHOW  : 'MODAL_ACTION_SUBVIEW_SHOW'
      },
      ALERT : {
        // BASIC TYPES
        TYPE_INFO              : 'ALERT_TYPE_INFO',
        TYPE_SUCCESS           : 'ALERT_TYPE_SUCCESS',
        TYPE_WARNING           : 'ALERT_TYPE_WARNING',
        TYPE_ERROR             : 'ALERT_TYPE_ERROR',

        // SPECIFIC TYPES
        TYPE_LOADING           : 'ALERT_TYPE_LOADING',
        TYPE_SAVING            : 'ALERT_TYPE_SAVING',
        TYPE_NODATA            : 'ALERT_TYPE_NODATA',

        // CLOSING TIMINGS TYPE
        CLOSE_TYPE_DEFAULT     : 'ALERT_CLOSE_TYPE_DEFAULT',
        CLOSE_TYPE_FAST        : 'ALERT_CLOSE_TYPE_FAST',
        CLOSE_TYPE_SLOW        : 'ALERT_CLOSE_TYPE_SLOW',
        CLOSE_TYPE_PERMANENT   : 'ALERT_CLOSE_TYPE_PERMANENT'
      },
      _ALERT : {
        // FALLBACK TYPE
        TYPE_DEFAULT          : 'ALERT_TYPE_DEFAULT',

        // CSS STYLES
        // (Used for the classes. If changed, needs to update the css accordingly)
        STYLE_INFO            : 'info',
        STYLE_SUCCESS         : 'success',
        STYLE_WARNING         : 'warning',
        STYLE_ERROR           : 'error',

        // CLOSING TIMINGS
        CLOSE_TIMER_DEFAULT   : 3000,
        CLOSE_TIMER_FAST      : 1500,
        CLOSE_TIMER_SLOW      : 6000,
        CLOSE_TIMER_PERMANENT : 'perm',

        // SLIDING DURATION
        SLIDING_DURATION      : 300
      },
      _CLASS: {
        // Cover Class to Toggle (If changed, needs to update the css accordingly)
        COVER : 'n-modal-cover',

        // Tabs Class to Toggle (If changed, needs to update the css accordingly)
        TABS  : 'n-modal-tabs-hidden'
      }
    },

    // MODEL/COLLECTION STATES
    //------------------------
    STATE_INIT     : 'init',
    STATE_SUCCESS  : 'success',
    STATE_CANCELED : 'canceled',
    STATE_ERROR    : 'error',
    STATE_PENDING  : 'pending',
    STATE_RETRY    : 'retry', // for future use

    // STATS CONSTANTS
    //----------------
    STATS_NOT_AVAILABLE : '-',
    STATS_NO_VALUE      : -1,

    // ACTION ITEMS
    //-------------
    ACTION_SUMMARY     : 'summary',
    ACTION_RESOLVE     : 'resolve',
    ACTION_SOURCE : {
      SELECTION : 'datatable_selection'
    },
    ACTION_OPEN   : 'open',
    ACTION_EDIT   : 'edit',
    ACTION_DELETE : 'delete',
    ACTION_SAVE   : 'save',
    ACTION_CREATE : 'create',
    ACTION_UPDATE_FILE_CATEGORY: 'update_file_category',
    ACTION_UPDATE_BLACKLIST_RULES: 'update_blacklist_rules',

    // Alert auto or manual resolved enum for UI
    ALERT_RESOLVED : {
      MANUAL: 'manual',
      AUTO:   'auto'
    },

    // NAVIGATION OPTION ITEMS
    //-----------------------
    // from where the action is being called
    NAV_ACTION_ROUTE                  : 'actionRoute',
    NAV_ACTION_SOURCE                 : 'actionSource',
    NAV_ACTION                        : 'action',
    NAV_ACTION_TARGET                 : 'actionTarget',

    // SUB PAGE ROUTES
    //----------------
    // When adding new subpages, make sure to modify PageTemplateRenderer to
    // apply the subpage mapping.
    SUBPAGE_PERSPECTIVE : 'overview',
    SUBPAGE_DIAGRAM     : 'diagram',
    SUBPAGE_TABLE       : 'table',
    SUBPAGE_ENTITIES    : 'entities',
    SUBPAGE_CHART       : 'chart', // Drilldown chart (Insights/Analysis)
    SUBPAGE_BLANK       : 'blank',
    SUBPAGE_SEARCH      : 'search',
    SUBPAGE_ANOMALY     : 'anomaly',
    SUBPAGE_SETTINGS    : 'settings',
    SUBPAGE_HEALTH      : 'health',

    // Names of sub pages used for dashboards
    SUBPAGE_MAIN_DASHBOARD : 'main_dashboard',

    // SUB PAGE COMPONENT
    //-------------------
    // An essential part of the diagram and table subpages.
    SUBPAGE_COMPONENT_DETAILS  : 'details',

    // ENTITIES
    //---------
    // An entity is something that exists in the configuration (ZooKeeper) or
    // metadata service (Cassandra).
    // NOTE: Update ENTITY_NAMES if you add a new entity.
    ENTITY_ALERT                     : 'alert',
    ENTITY_EVENT                     : 'event',
    ENTITY_SWITCH                    : 'switch',

    // Entity Names
    ENTITY_NAMES : {
      'file_server_share'     : 'Share/Export',
      'folder'                : 'Folder',
      'category'              : 'Category'
    },

    // File Server
    // -----------
    ENTITY_FILE_SERVER           : 'file_server',
    ENTITY_SHARE                 : 'file_server_share',
    ENTITY_FOLDER                : 'folder',
    ENTITY_CATEGORY              : 'category',
    ENTITY_FILE_SERVER_META_DATA : 'file_server_meta_data',
    ENTITY_FILE_ANALYTICS_VM_UPDATE : 'file_analytics_vm_update',

    // File Server protocals
    FS_PROTOCOLS: {
      NONE : 'NONE',
      SMB : 'SMB',
      NFS : 'NFS',
      NFS_SMB : 'NFS_SMB'
    },

    FS_AUTH_TYPES: {
      ACTIVE_DIRECTORY : 'AD',
      LDAP : 'LDAP',
      UNMANAGED : 'UNMANAGED'
    },

    // Meta deta status
    METADATA_STATUS: {
      COMPLETED: 'completed',
      NOT_STARTED: 'not_started',
      IN_PROGRESS: 'in_progress',
      RUNNING: 'running',
      FAILED: 'failed',
      NOT_REQUIRED: 'not_required',
      DEFAULT: 'completed'
    },

    // Meta data status text
    METADATA_STATUS_TITLE: {
      completed   : 'Completed',
      not_started : 'Not Started',
      in_progress : 'In Progress',
      failed      : 'Failed',
      not_required: 'Never Scanned',
      running     : 'In Progress'
    },

    // TASK CONSTANTS
    //---------------
    TASK_POLLING_INTERVAL        : 30000, // in milliseconds
    TASK_PROGRESS_ACTIVE_INTERVAL: 10000, // in milliseconds
    ENABLE_METADATA_SCAN_INTERVAL: 70000, // in milliseconds
    METADATA_SCAN_INTERVAL       : 300000, // For popup in milliseconds

    // LOCAL STORAGE
    //--------------

    // List of potential local storage key values.
    LOCAL_STORAGE  : {
      // Idle Time
      UI_IDLE_TIME            : 'nutanix_ui_idle_time',
      // Enable/disable auto logout after being idle.
      DISABLE_AUTO_LOGOUT     : 'disable_auto_logout',
      // Enable/disable auth validation
      DISABLE_AUTH_VALIDATION : 'disable_auth_validation'
    },

    // User idle time out/logout time in minutes
    USER_TIME_OUT : 15,

    // Values of op_status for Permission Denied in ES
    PERMISSION_DENIED_OP_STATUS: ['Permission denied',
      'Operation not permitted'],

    // Values of op status for Permission Denied File Blocking in ES.
    FILE_BLOCKING_PD_OP_STATUS: ['Permission denied [file-blocking policy]'],

    // Operator type values used for audit history popup
    OPERATOR_TYPE_VALUES: {
      OR: 'OR',
      AND: 'AND'
    },

    // Payload
    PAYLOAD_PARAMS: {
      START_TIME_IN_MS: 'start_time_in_ms',
      END_TIME_IN_MS: 'end_time_in_ms',
      OPERATIONS: 'operations',
      OP_STATUS: 'op_status',
      COUNT: 'count',
      OBJECT_TYPE: 'object_type',
      INTERVAL: 'interval',
      DOWNLOAD: 'download',
      NEXT_BATCH_ID: 'id',
      INCLUDES: 'includes',
      EXCLUDES: 'excludes',
      OPERATOR_TYPE: 'condition',
      SEARCH: 'search'
    },

    // Method Type
    METHOD: {
      GET : 'get',
      SAVE: 'save'
    }
  };
});
