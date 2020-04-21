//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// CustomiseDashboardModel is the model class of the entity dashboard.
//
define(
  [
    // Constants
    'utils/DataURLConstants',
    // Core
    'models/base/BaseModel'],
  function(
    // Constants
    DataURLConstants,
    // References of core
    BaseModel) {
    'use strict';

    var DP = {
      USER_NAME                      : 'owner_name',
      DB_ID                          : 'dashboard_id',
      D_NAME                         : 'dashboard_name',
      D_DESC                         : 'description',
      D_IS_DEFAULT                   : 'is_default',
      SHOW_TOP_ACCESSED_FILES        : 'show_top_accessed_files',
      SHOW_TOP_ACTIVE_USERS          : 'show_top_active_users',
      SHOW_FILE_DISTRIBUTION_BY_TYPE : 'show_file_distribution_by_type',
      SHOW_FILE_DISTRIBUTION_BY_SIZE : 'show_file_distribution_by_size',
      SHOW_FILE_DISTRIBUTION_BY_AGE  : 'show_file_distribution_by_age',
      FILE                           : 'show_search_file',
      USER                           : 'show_search_user',
      FILEOPEN                       : 'show_file_open_trend',
      FILEWRITE                      : 'show_file_write_trend',
      RENAME                         : 'show_file_rename_trend',
      FILECREATE                     : 'show_file_create_trend',
      FILEREAD                       : 'show_file_read_trend',
      FILEDELETE                     : 'show_file_delete_trend',
      SECURITYCHANGE                 : 'show_permission_change_trend',
      DIRECTORYCREATE                : 'show_mkdir_trend',
      DIRECTORYDELETE                : 'show_rmdir_trend',
      CONNECT                        : 'show_connect_trend',
      DISCONNECT                     : 'show_disconnect_trend',
      PERMISSIONDENIED               : 'show_file_truncate_trend',
      DEFAULT_DURATION               : 'default_duration'
    };

    var OPERATIONS = {
      show_file_open_trend         : 'FileOpen',
      show_file_write_trend        : 'FileWrite',
      show_file_rename_trend       : 'Rename',
      show_file_create_trend       : 'FileCreate',
      show_file_read_trend         : 'FileRead',
      show_file_delete_trend       : 'FileDelete',
      show_permission_change_trend : 'SecurityChange',
      show_mkdir_trend             : 'DirectoryCreate',
      show_rmdir_trend             : 'DirectoryDelete',
      show_connect_trend           : 'connect',
      show_disconnect_trend        : 'disconnect',
      show_file_truncate_trend     : 'PermissionDenied'
    };

    var CustomiseDashboardModel = BaseModel.extend({
      urlRoot: DataURLConstants.AFS_ROOT_URL,

      DP: DP,

      // ID for this model.
      idAttribute: DP.DB_ID,

      OPERATIONS: OPERATIONS,

      // Builds the URL structure for getting specific dashboard configuration.
      // @param dId is the dashboard ID for whose configuration is needed.
      getSpecificDashboardURL: function(dId) {
        var specificDashboardTempl =
          _.template(DataURLConstants.SPECIFIC_DASHBOARD, {
            dashboardId : dId
          });
        this.url = this.urlRoot + specificDashboardTempl;
        return this.url;
      },

      // Builds the URL for getting the dashboard list.
      getDashboardListURL: function() {
        this.url = this.urlRoot + DataURLConstants.DASHBOARD_LIST;
        return this.url;
      },

      // Builds the URL for getting the default dashboard.
      getDefaultDashboardURL: function() {
        this.url = this.urlRoot + DataURLConstants.DASHBOARD_CONFIG;
        return this.url;
      }
    }, {
      DP: DP
    });

    // Returns the CustomiseDashboardModel class
    return CustomiseDashboardModel;
  }
);
