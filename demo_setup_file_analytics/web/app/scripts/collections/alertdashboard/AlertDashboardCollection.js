//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AlertDashboardCollection is the collection class of
// alert details.
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/alertdashboard/AlertDashboardModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseCollection,
  // Models
  AlertDashboardModel,
  // Utils
  DataURLConstants,
  AppConstants) {
  'use strict';

  const DEFAULT_COUNT = 5;

  var AlertDashboardCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: AlertDashboardModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'AlertDashboardCollection',

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
  });

  // Returns the AlertDashboardCollection class
  return AlertDashboardCollection;
});
