//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// BaseAuditHistoryCollection is the base collection class of the
// entity audit history.
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/base/BaseAuditHistoryModel',
  // Utils
  'utils/DataURLConstants',
  'utils/AppConstants'],
function(
  // Core
  BaseCollection,
  // Models
  BaseAuditHistoryModel,
  // Utils
  DataURLConstants,
  AppConstants) {

  'use strict';

  var BaseAuditHistoryCollection = BaseCollection.extend({

    // Properties
    //-----------

    model: BaseAuditHistoryModel,

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Name for logging purposes.
    name: 'BaseAuditHistoryCollection',

    // Overriden to set as payload for post call
    // @params: requestParams - Object type
    setFilterUrl: function(requestParams) {
      const payload = this.getRequestPayload(),
            params = AppConstants.PAYLOAD_PARAMS;

      payload[params.INCLUDES] = {};
      payload[params.EXCLUDES] = {};

      // If request params include operation filter
      if (requestParams.operations) {
        const filter = requestParams.operations;

        // Check if Permission Denied is checked or not
        const hasPermissionDenied =
          _.indexOf(filter, AppConstants.OPERATION_VALUES.PermissionDenied);

        const hasPermissionDeniedFileBlocking =
          _.indexOf(filter,
            AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking);

        if (hasPermissionDenied > -1 && hasPermissionDeniedFileBlocking <= -1) {
          // If Permission Denied is checked and not Permission denied
          // file blocking
          payload[params.INCLUDES][params.OP_STATUS] =
            [AppConstants.OPERATION_VALUES.PermissionDenied];

          // If more than one operation is checked
          if (filter.length > 1) {
            const filterOperations =
              _.without(filter, AppConstants.OPERATION_VALUES.PermissionDenied);
            payload[params.INCLUDES][params.OPERATIONS] = filterOperations;
            payload[params.INCLUDES][params.OPERATOR_TYPE] =
              AppConstants.OPERATOR_TYPE_VALUES.OR;
          }
        } else if (hasPermissionDeniedFileBlocking > -1 &&
          hasPermissionDenied <= -1) {
          // If Permission Denied file blocking is checked and
          // not Permission denied
          payload[params.INCLUDES][params.OP_STATUS] =
            [AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking];

          // If more than one operation is checked
          if (filter.length > 1) {
            const filterOperations =
              _.without(filter,
                AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking);
            payload[params.INCLUDES][params.OPERATIONS] = filterOperations;
            payload[params.INCLUDES][params.OPERATOR_TYPE] =
              AppConstants.OPERATOR_TYPE_VALUES.OR;
          }
        } else if (hasPermissionDeniedFileBlocking > -1 &&
          hasPermissionDenied > -1) {
          // If Permission Denied file blocking and Permission denied both
          // are checked
          payload[params.INCLUDES][params.OP_STATUS] =
            [AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking,
              AppConstants.OPERATION_VALUES.PermissionDenied];

          // If more than one operation is checked
          if (filter.length > 2) {
            const filterOperations =
              _.without(filter,
                AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking,
                AppConstants.OPERATION_VALUES.PermissionDenied);
            payload[params.INCLUDES][params.OPERATIONS] = filterOperations;
            payload[params.INCLUDES][params.OPERATOR_TYPE] =
              AppConstants.OPERATOR_TYPE_VALUES.OR;
          }
        } else {
          if (filter.length) {
            payload[params.INCLUDES][params.OPERATIONS] = filter;
          }
          payload[params.EXCLUDES][params.OP_STATUS] =
            [AppConstants.OPERATION_VALUES.PermissionDenied,
              AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking];
        }
      } else {
        // Need to exclude "Permission Denied" and "Permission Denied File
        // Blocking" by default and operations not required
        payload[params.EXCLUDES][params.OP_STATUS] =
          [AppConstants.OPERATION_VALUES.PermissionDenied,
            AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking];
      }

      this.setRequestPayload(payload);
    }
  });

  // Returns the BaseAuditHistoryCollection class
  return BaseAuditHistoryCollection;
});
