//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// UserAuditHistoryModel is the model class for user audit history
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
    AUDIT_EVENT_DATE      : 'audit_event_date',
    AUDIT_MACHINE_NAME    : 'audit_machine_name',
    AUDIT_OBJECT_ID       : 'audit_object_ID',
    AUDIT_OBJECT_NAME     : 'audit_objectname',
    AUDIT_OLD_OBJECT_NAME : 'audit_old_objectname',
    AUDIT_OLD_PARENT_ID   : 'audit_old_parent_ID',
    AUDIT_OPERATION       : 'audit_operation',
    AUDIT_STATUS          : 'audit_status',
    AUDIT_USERNAME        : 'audit_username'
  };

  var UserAuditHistoryModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL

  }, {

    // Static Constants
    //-----------------

    // Local data property constants.
    DP: DP
  });

  // Returns the BaseModel class
  return UserAuditHistoryModel;
});
