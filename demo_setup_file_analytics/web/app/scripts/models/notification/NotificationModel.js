//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// NotificationModel is the model class for notification objects.
//
define([
  // Core
  'backbone',
  'views/notification/NotificationTemplates',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Data
  'data/DataProperties'],
function(
  // References of core
  Backbone,
  Templates,
  // References of utils
  AppConstants,
  AppUtil,
  // References of data
  DataProp) {
  'use strict';

  var NotificationModel = Backbone.Model.extend({

    // Properties
    //-----------

    // Name for logging purposes.
    name: 'NotificationModel',

    // Defaults
    defaults: {
      id            : null,
      notifyType    : null,
      stringMessage : null
    },

    // @override
    // Constructor
    initialize: function() {
      // Generate random unique Id
      this.set({ id : new Date().getTime() });
    },

    // Functions
    //----------

    // Returns the unique notification id of the model.
    getNotificationId: function() {
      return this.get('id');
    },

    // Returns custom string message for client side generated notifications.
    getStringMessage: function() {
      return this.get('stringMessage');
    },

    // Returns the message based on the parameters of the model
    // TODO: This code should be refactored so that the notification messages
    //       are obtained from the models.
    getNotificationMessage: function() {
      // stringMessage is used for purely client slide generated
      // notifications.
      if (this.getStringMessage()) {
        return this.getStringMessage();
      }
    },

    // Returns the notify type based on the model
    getNotifyType: function() {
      return this.get('notifyType');
    },

    // Returns the notify type CSS style
    getNotifyTypeStyle: function() {
      switch (this.getNotifyType()) {
        case AppConstants.NOTIFY_SUCCESS: return 'notification-success';
        case AppConstants.NOTIFY_WARNING: return 'notification-warning';
        case AppConstants.NOTIFY_ERROR: return 'notification-error';
        case AppConstants.NOTIFY_INFO:
        /* falls through */
        default: return 'notification-info';
      }
    }
  });

  // Returns the NotificationModel class
  return NotificationModel;
});
