//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// StyleDescriptor provides CSS styling information for certain components that
// cannot be stored and handled by the CSS files.
// E.g. Provision of gradient colors to chart based on the metric.
//
define([
  // Data
  'data/DataProperties'],
function(
  // Data
  DataProp) {

  'use strict';

  var StyleDescriptor = {

    // Chart Colors
    //-------------

    CHART_COLORS : null,

    // File server colors map
    FS  : {
      COLORS_MAP: {
        RED   : '#cf6a6d',
        BLUE  : '#26bbf0',
        GREEN : '#6eb17b',
        YELLOW: '#ffd055'
      }
    },

    COLORS_MAP: {
      RED   : '#cf6a6d',
      BLUE  : '#26bbf0',
      GREEN : '#6eb17b',
      YELLOW: '#ffd055'
    },

    // File/User Audit Operations colors
    AUDIT_OPERATIONS : ['#60C2E3', '#F2CA00', '#F29D49', '#A8CC3D', '#E67C73',
      '#66CC80', '#9E91E3', '#5F96E3', '#E67386', '#ADCCC2', '#6F787E',
      '#C2D5A0', '#277BB4', '#A7CD77', '#3F3251', '#CC6164', '#11A3D7',
      '#606c88', '#F0C27B', '#ADD100', '#B993D6', '#002025', '#FFD055'],

    FILE_TYPE_COLORS: {
      'Adobe Acrobat': '#9E91E3',
      'Archives': '#5F96E3',
      'Audio': '#60C2E3',
      'Backups': '#11A3D7',
      'CD/DVD Images': '#66CC80',
      'Desktop Publishing': '#277BB4',
      'Email Archives': '#606c88',
      'Hard Drive Images': '#A7CD77',
      'Images': '#E67C73',
      'Installers': '#3F3251',
      'Log Files': '#CC6164',
      'Lotus Notes': '#C2D5A0',
      'MS Office Documents': '#F2CA00',
      'System Files': '#FFD055',
      'Text Files': '#F29D49',
      'Video': '#A8CC3D',
      'Disk Image': '#6F787E',
      'Others': '#CC9C13',
      'No Extension': '#F0C27B'
    },

    FILE_TYPE_COLORS_LIST: ['#9E91E3', '#5F96E3', '#60C2E3', '#11A3D7',
      '#66CC80', '#277BB4', '#606c88', '#A7CD77', '#E67C73', '#3F3251',
      '#CC6164', '#C2D5A0', '#F2CA00', '#FFD055', '#F29D49', '#A8CC3D',
      '#6F787E', '#CC9C13', '#F0C27B'],

    // As categories are user defined from FA 2.1, hence the length can
    // be n so we will use this default color to depict all other categories
    // apart from length of default config as per FA 2.0
    DEFAULT_FILE_TYPE_COLORS: ['#B993D6'],

    FILE_TYPE_FILL_COLORS: ['#d3edfd', '#fddddd', '#ffebb6', '#9be8b4',
      '#b9c1ca'],
    FILE_TYPE_STROKE_COLORS: ['#22a5f7', '#f55656',
      '#ffbc0b', '#36d068', '#657385'],

    RANDOM_COLORS : ['#3dec5f', '#ee4a4f', '#6F787E'],

    OPERATIONS_COLORS : {
      FileOpen                    : '#60C2E3',
      FileWrite                   : '#F2CA00',
      Rename                      : '#F29D49',
      FileCreate                  : '#A8CC3D',
      FileRead                    : '#E67C73',
      FileDelete                  : '#66CC80',
      SecurityChange              : '#9E91E3',
      DirectoryCreate             : '#5F96E3',
      DirectoryDelete             : '#E67386',
      PermissionDenied            : '#ADCCC2',
      PermissionDeniedFileBlocking: '#6F787E',
      SetAttr                     : '#A7CD77',
      FileClose                   : '#277BB4',
      Symlink                     : '#F0C27B'
    },

    ALERT_TYPE_COLORS: {
      Create                      : '#60C2E3',
      Delete                      : '#F2CA00',
      SecurityChange              : '#F29D49',
      PermissionDenied            : '#ADCCC2',
      PermissionDeniedFileBlocking: '#A7CD77'
    },

    DORMANT_DATA_COLORS: {
      '0_months_older' : '#60C2E3',
      '3_months_older' : '#F2CA00',
      '6_months_older' : '#F29D49',
      '12_months_older' : '#A8CC3D'
    },


    DASHBOARD_TABLES: {
      show_top_active_users         : '#60C2E3',
      show_top_accessed_files       : '#cc94ee',
      show_malicious_users          : '#E67386',
      show_file_distribution_by_size: '#94eed2',
      show_capacity_fluctuation     : ['#A8CC3D', '#60C2E3', '#E67386'],
      show_capacity_fluctuation_legends: ['#A8CC3D', '#E67386', '#60C2E3'],
      show_alert_over_time          : ['#60C2E3'],
      show_top_contributing_folders : '#cc94ee',
      show_top_violating_users      : '#94eed2',
      show_alert_type               :  ['#A8CC3D', '#E67386', '#60C2E3']
    },

    // Health status colors
    HEALTH_STATUS_COLORS: {
      GREEN   : '#36d068',
      RED     : '#f55656',
      YELLOW  : '#ffbc0b'
    },

    // Default background color for the bars
    DEFAULT_BAR_BG_COLOR : '#F2F4F6',

    getChartStrokeColor(metricType) {
      let colors = this.AUDIT_OPERATIONS;
      switch (metricType) {
        case DataProp.SHOW_FILE_TYPE_OVER_TIME:
          colors = this.FILE_TYPE_STROKE_COLORS;
          break;
      }
      return colors;
    },

    // Returns an array of chart colors based on the metric
    getChartColor(metricType) {
      let colors = this.AUDIT_OPERATIONS;
      switch (metricType) {
        case DataProp.STATS_FILE_AUDIT_HISTORY:
        case DataProp.STATS_USER_AUDIT_HISTORY:
        case DataProp.STATS_FILE_DISTRIBUTION_BY_AGE:
          colors = this.AUDIT_OPERATIONS;
          break;
        case DataProp.SHOW_TOP_ACTIVE_USERS:
        case DataProp.SHOW_TOP_ACCESSED_FILES:
        case DataProp.SHOW_MALICIOUS_USERS:
        case DataProp.STATS_FILE_DISTRIBUTION_BY_SIZE:
        case DataProp.SHOW_CAPACITY_FLUCTUATION:
        case DataProp.SHOW_ALERT_OVER_TIME:
        case DataProp.SHOW_TOP_CONTRIBUTING_FOLDERS:
        case DataProp.SHOW_TOP_VIOLATING_USERS:
        case DataProp.SHOW_ALERT_TYPE:
          colors = this.DASHBOARD_TABLES[metricType];
          break;
        case DataProp.STATS_FILE_DISTRIBUTION_BY_TYPE:
        case DataProp.SHOW_FILE_TYPE_OVER_TIME:
          colors = this.FILE_TYPE_COLORS_LIST;
          break;
      }

      // Made green the default color
      return colors;
    }
  };

  return StyleDescriptor;
});
