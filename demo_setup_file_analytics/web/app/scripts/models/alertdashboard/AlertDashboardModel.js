//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AlertDashboardModel is the model class for alert details.
//
define([
  // Core
  'models/base/BaseModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // References of core
  BaseModel,
  // Utils
  DataURLConstants,
  AppConstants) {
  'use strict';

  const DEFAULT_COUNT = 5;

  var DP = {
    ID          : 'id',
    DOC_COUNT   : 'doc_count',
    IS_TLD      : 'is_tld',
    KEY         : 'key',
    SHARE       : 'share'
  };

  var AlertDashboardModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure for getting violating users.
    getURL: function(type, startTimeInMs, endTimeInMs, count, interval) {
      count = count || DEFAULT_COUNT;

      const alertTempl = _.template(DataURLConstants.ALERT_DASHBOARD, {
        type: type
      });

      const dateTempl = _.template(DataURLConstants.DATE_FILTER, {
        startTimeInMs: startTimeInMs,
        endTimeInMs  : endTimeInMs
      });

      const url = this.urlRoot + alertTempl + '&' + dateTempl;

      if (type === AppConstants.ANOMALY_DETAIL_TYPES.ALERT_TYPES) {
        this.url = url;
      } else if (type === AppConstants.ANOMALY_DETAIL_TYPES.TIME_SERIES) {
        const intervalTempl = _.template(DataURLConstants.INTERVAL, {
          interval: interval
        });
        this.url = url + '&' + intervalTempl;
      } else {
        const chunkCountTempl = _.template(DataURLConstants.COUNT, {
          count: count
        });
        this.url = url + '&' + chunkCountTempl;
      }

      return this.url;
    }
  }, {
    // Static Constants.
    // -----------------

    // Local data property constants.
    DP: DP
  });

  // Returns the AlertDashboardModel class
  return AlertDashboardModel;
});
