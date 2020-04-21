//
// Copyright (c) 2015 Nutanix Inc. All rights reserved.
//
// UserSearchCollection is the collection class of the entity user search model
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/dashboard/AnomalyNotificationModel',
  // Utils
  'utils/AppConstants',
  'utils/DataURLConstants'],
function(
  // Core
  BaseCollection,
  // Models
  AnomalyNotificationModel,
  // Utils
  AppConstants,
  DataURLConstants) {

  'use strict';

  var DP = {
    PER_USER: 'per_user',
    OPERATION_NAME: 'operation_name',
    OPERATION_COUNT: 'operation_count',
    FSLOG_PERIOD_START: 'fslog_period_start',
    FSLOG_PERIOD_END: 'fslog_period_end'
  };

  var AnomalyNotificationCollection = BaseCollection.extend({

    // Properties
    //-----------
    // Name for logging purposes.
    name: 'AnomalyNotificationCollection',

    model: AnomalyNotificationModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

    // @override
    // Builds the URL structure
    getURL: function(count) {
      count = count || AppConstants.ANOMALY_NOTIFICATION_COUNT;
      let countTempl = _.template(DataURLConstants.COUNT, {
        count : count
      });

      this.url = this.urlRoot + DataURLConstants.ANOMALY_NOTIFICATION + '?' +
        countTempl;
      return this.url;
    }
  });

  // Returns the AnomalyNotificationCollection class
  return AnomalyNotificationCollection;
});