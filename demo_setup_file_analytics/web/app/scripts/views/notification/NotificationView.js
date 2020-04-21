//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// NotificationView handles the notification system of the application.
// 1) Shows the successful/error message made by Create/Update/Delete actions.
// 2) Proactively asks users for storage provision (if there's none), upgrades,
//    and other messages.
// 3) Interprets messages and shows more information about the notification
//    by showing the NotificationPopupView to display detailed row information.
//
define([
  // Core (Note: bootstrap is needed in here)
  'bootstrap',
  'collections/base/BaseCollection',
  'views/base/BaseView',
  // Templates
  'views/notification/NotificationTemplates',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil'],
function(
  // References of core
  Bootstrap,
  BaseCollection,
  BaseView,
  // References of templates
  NotificationTemplates,
  // References of utils
  AppConstants,
  AppUtil) {

  'use strict';

  // Extending the BaseView
  var NotificationView = BaseView.extend({

    // Constants
    //----------
    // Time to display notification in milliseconds
    TIME_DELAY : 15000,

    // Properties
    //-----------

    // NOTE about el:
    // The el property should be set by the parent class.

    // Contains the NotificationModels
    notificationCollection: null,

    // Events Listeners
    //-----------------

    events: {
      'click  .n-close'  :  'onClickClose'
    },

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initialize: function() {
      this.notificationCollection = new BaseCollection();
    },

    // Functions (Notifications)
    //--------------------------

    // Call this function to show the alertbox with animation
    // @param isTemporary - Boolean value, should notification disappear or not
    showNotification: function(notificationModel, isTemporary) {
      // Check for the latency action message and remove it when the
      // notification comes in. Use the latency id.
      // There won't be a latency action message if this is a client side
      // generated notification message.

      if (typeof isTemporary === 'undefined') {
        isTemporary = true;
      }

      // Check if there's already an existing notification message
      var exists = _.find(this.notificationCollection.models,
        function(model) {
          return (model.getNotificationMessage() ===
                  notificationModel.getNotificationMessage());
        });

      // Don't show the notification if there's an existing message already.
      if (exists) {
        return;
      }

      // Add the notificationModel to the notificationMap
      this.notificationCollection.add(notificationModel);

      // Create the HTML DOM notification message and prepend to the $el
      this.$el.prepend(this.createNotificationHTML(notificationModel));

      // Slide and Fade in transition
      var notificationId = notificationModel.getNotificationId();

      // Add the 'open' class to the notification.
      // Here, setTimeout is used because CSS3 transitions based on classes
      // will not work on elements which are appended to the DOM and then
      // immediately given a class to activate the animation.  setTimeout
      // gets around this quirk, even if it is given 0 as the delay.  In this
      // case I had to set it to 20 because IE 10 needed a slight delay, but
      // it works with 0 in Chrome, FF, and Safari
      var _this = this;
      setTimeout(function() {
        $(_this.getNotificationMsg(notificationId)).addClass('n-show');
      }, 20);

      // Determine if a custom width has been provided, otherwise use the
      // default.
      if (notificationModel.get('width')) {
        $(this.getNotificationMsg(notificationId))
          .css('maxWidth', notificationModel.get('width'));
      }

      // Start count down hide transition
      if (isTemporary) {
        this.startCountDownHide(notificationId);
      }
    },

    // Creates the notification HTML body message based on the passed
    // notificationModel and returns the HTML DOM element.
    createNotificationHTML: function(notificationModel) {
      var notifyTypeStyle = notificationModel.getNotifyTypeStyle(),
          notificationId = notificationModel.getNotificationId(),
          message = AppUtil.removeServerException(
            notificationModel.getNotificationMessage()),
          htmlBody,
          buttons = '';

      if (message.length > AppConstants.NOTIFICATION_LENGTH_LIMIT) {
        message = AppUtil.truncateNotificationMessage(message);
      }

      // Create the html body
      htmlBody = _.template(NotificationTemplates.NOTIFICATION_MSG,
        { notificationId  : notificationId,
          notifyTypeStyle : notifyTypeStyle,
          message         : message,
          buttons         : buttons });

      return htmlBody;
    },

    // Returns the Notification div DOM component
    getNotificationMsg: function(notificationId) {
      return this.getDOM('div.n-notification-msg[notificationId="' +
        notificationId + '"]');
    },

    // Call this function after showing an notify for hide transition
    startCountDownHide: function(notificationId) {
      var _this = this;
      setTimeout(function() { _this.hideNotification(notificationId); },
        this.TIME_DELAY);
    },

    // Hide the notification message
    hideNotification: function(notificationId) {
      var _this = this;
      // Do a fade and slide up animation
      this.getNotificationMsg(notificationId)
        .removeClass('n-show')
        .addClass('n-hide');
      setTimeout(function() {
        _this.getNotificationMsg(notificationId).remove();
        _this.notificationCollection.remove(
          _this.notificationCollection.get(notificationId));
      }, 1000);
    },

    // Functions (Event listeners)
    //----------------------------

    // Called when the close button is clicked
    onClickClose: function(e) {
      // Check if notification message
      var notificationId = $(e.currentTarget).attr('notificationId');
      if (notificationId) {
        this.hideNotification(notificationId);
      }
    }
  });

  // Returns the NotificationView Class
  return NotificationView;
});
