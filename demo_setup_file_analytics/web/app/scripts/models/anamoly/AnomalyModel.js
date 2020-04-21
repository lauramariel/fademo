//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AnomalyModel is the model class of the entity anomaly.
//
define([
  // Utils
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
    NOTIFICATION_RECEIVER_LIST     : ' ',
    ID                             : 'config_id',
    FILE_OPERATION                 : 'operation_name',
    DETECTION_INTERVAL             : 'detection_interval',
    MINIMUM_FILE_OPERATION_PERCENT : 'minimum_file_operation_percentage',
    MINIMUM_FILE_OPERATION_COUNT   : 'minimum_file_operation_count',
    PER_USER                       : 'per_user'
  };

  var AnomalyModel = BaseModel.extend({
    urlRoot: DataURLConstants.AFS_ROOT_URL,

    DP: DP,

    idAttribute: DP.ID,

    // @override
    // Gets the anomaly configuration URL.
    getURL: function() {
      this.url = this.urlRoot + DataURLConstants.ANOMALY_CONFIG;
      return this.url;
    },

    // Get the URL to delete a configuration.
    getDeleteURL: function(id) {
      let deleteTempl = _.template(DataURLConstants.DELETE_ANOMALY_CONFIG, {
        id: id
      });
      this.url = this.urlRoot + deleteTempl;
       return this.url;
    },
  });

  return AnomalyModel;
});
