//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// CapacityFluctuationGraphModel is the model class of the entity
// capacity fluctuation.
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

  var CapacityFluctuationGraphModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function(interval ,startTimeInMs, endTimeInMs, byType) {
      let durationTempl = _.template(DataURLConstants.DATE_FILTER, {
        startTimeInMs: startTimeInMs,
        endTimeInMs  : endTimeInMs
      });

      let capacityTempl = _.template(DataURLConstants.CAPACITY_FLUCTUATION, {
        interval : interval,
        type: byType
      });

      this.url = this.urlRoot + capacityTempl + '&' + durationTempl;
      return this.url;
    }
  });

  // Returns the CapacityFluctuationGraphModel class
  return CapacityFluctuationGraphModel;
}
);
