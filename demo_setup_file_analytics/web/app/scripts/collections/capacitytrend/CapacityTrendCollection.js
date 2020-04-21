//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// CapacityTrendCollection is the collection class of the entity
// capacity fluctuation.
//
define([
  // Core
  'collections/base/BaseCollection',
  // Utils
  'utils/DataURLConstants',
  // Data
  'data/DataProperties'],
function(
  // Core
  BaseCollection,
  // Utils
  DataURLConstants,
  // Data
  DataProp) {

  'use strict';

  var CapacityTrendCollection = BaseCollection.extend({

    // Properties
    //-----------

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'CapacityTrendCollection',

    // @override
    // Builds the URL structure
    getURL: function(interval, startTimeInMs, endTimeInMs, type) {
      let durationTempl = _.template(DataURLConstants.DATE_FILTER, {
        startTimeInMs: startTimeInMs,
        endTimeInMs  : endTimeInMs
      });

      let capacityTempl = _.template(DataURLConstants.CAPACITY_DETAILS, {
        interval : interval,
        type: type
      });

      this.url = this.urlRoot + capacityTempl + '&' + durationTempl;
      return this.url;
    },

    // Update model fetch url by adding new set of params
    updateUrl: function(pageId) {
      if (pageId) {
        this.setFilterUrl([{ [DataProp.NEXT_PAGE_ID]: pageId }]);
      }

      return this.url;
    }
  });

  // Returns the CapacityTrendCollection class
  return CapacityTrendCollection;
});
