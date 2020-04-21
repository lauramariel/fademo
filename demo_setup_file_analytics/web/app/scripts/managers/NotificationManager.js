//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// NotificationManager is called by any views from anywhere to display the
// notification. It calls the AppView to show the notification view.
//
define([
  // Models
  'models/notification/NotificationModel',
  // Managers
  'managers/NamespaceManager'],
function(
  // References of models
  NotificationModel,
  // References of managers
  NamespaceManager) {

  'use strict';

  var notificationBarTempl = _.template('<div class="notificationBar">\
        <div class="alert alert-<%= type %> <%= parentClasses %>">\
          <h4><%= msg %></h4>\
        </div>\
      </div>');

  return {

    // Properties
    //------------

    // Manager name
    name: 'NotificationManager',

    // Functions (Core)
    //-----------------

    // Used for showing client side generated notification messages.
    // @param notifyType -- Notification type which comes from AppConstants.
    // @param msg -- the message to display in string format.
    // @param options -- optional width value to override the default width
    //                    and optional temporary TRUE/FALSE value which
    //                    determines whether notification disappears or not
    // @return The ID of the rendered notification.
    showClientNotification: function(notifyType, msg, options) {
      if (NamespaceManager.get(NamespaceManager.APP_VIEW)) {
        // Create the notification model

        options = options || {};

        var notificationModel = new NotificationModel({
          notifyType    : notifyType,
          stringMessage : msg
        });

        if (options.width) {
          notificationModel.set('width', options.width);
        }

        // Call the global AppView to show the notification
        NamespaceManager.get(NamespaceManager.APP_VIEW)
          .showNotification(notificationModel, options.temporary);

        return notificationModel.getNotificationId();
      }
    },

    showNotificationBar: function(msg, type, options) {
      $(options.parentEl).find('.notificationBar').remove();
      let templ = notificationBarTempl({
        type: type || 'info',
        msg: msg,
        parentClasses: options.parentClasses || ''
      });
      if (options.parentEl) {
        $(options.parentEl).prepend(templ);
      }
      return templ;
    }
  };
});
