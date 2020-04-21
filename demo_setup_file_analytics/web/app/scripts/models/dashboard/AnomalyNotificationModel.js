//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AnomalyNotificationModel is the model class of the entity
// anomaly notification.
//
define([
  // Core
  'models/base/BaseModel',
  // Utils
  'utils/DataURLConstants'],
function(
  // References of core
  BaseModel,
  // Utils
  DataURLConstants) {

  'use strict';

  var DP = {
    PER_USER: 'per_user',
    OPERATION_NAME: 'operation_name',
    OPERATION_COUNT: 'operation_count',
    FSLOG_PERIOD_START: 'fslog_period_start',
    FSLOG_PERIOD_END: 'fslog_period_end'
  };

  var AnomalyNotificationModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

    // @override
    // Builds the URL structure
    getURL: function(count) {
      let countTempl = _.template(DataURLConstants.COUNT, {
        count : count
      });

      this.url = this.urlRoot + DataURLConstants.ANOMALY_NOTIFICATION + '?' +
        countTempl;
      return this.url;
    }
  });

  // Returns the AnomalyNotificationModel class
  return AnomalyNotificationModel;
}
);
