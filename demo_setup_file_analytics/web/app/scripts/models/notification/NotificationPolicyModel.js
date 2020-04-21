//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// NotificationPolicyModel is the model class for defining blacklist rules
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
    BLACKLIST: 'black_list'
  };

  var NotificationPolicyModel = BaseModel.extend({

    // use payload while sending request to make POST calls
    payload: {},

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function() {
      this.url = this.urlRoot + DataURLConstants.NOTIFICATION_POLICY;
      return this.url;
    },

    getResource: function(entity) {
      return this.getUnescapedValue(`${this.DP.BLACKLIST}`)[entity];
    },

    // Local data property constants.
    DP: DP
  });

  // Returns the NotificationPolicyModel class
  return NotificationPolicyModel;
});
