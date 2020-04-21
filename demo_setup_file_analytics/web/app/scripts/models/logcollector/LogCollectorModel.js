//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// LogCollectorModel is the model class of the entity log collector
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

  var DP = {};

  var LogCollectorModel = BaseModel.extend({

    // urlRoot: "http://127.0.0.1:5000",
    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

    // @override
    // Builds the URL structure
    getURL: function(options) {
      let templ = '';
      if (options && options.username) {
        const usrTempl = _.template(DataURLConstants.APPEND_USER_NAME, {
          userName: options.username
        });
        templ = DataURLConstants.COLLECT_LOGS + '?' + usrTempl;
      } else {
        templ = DataURLConstants.COLLECT_LOGS;
      }

      this.url = this.urlRoot + templ;
      // this.url = this.urlRoot + DataURLConstants.;
      return this.url;
    }
  });

  // Returns the LogCollectorModel class
  return LogCollectorModel;
});
