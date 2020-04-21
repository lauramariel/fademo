//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AlertPopup show the popup to prevent deleting a dashboard.
//
define([
  // Views
  'views/base/BasePopupView',
  // Templates
  'text!templates/dashboard/AlertPopup.html'],
function(
  // Views
  BasePopupView,
  // Templates
  AlertPopup) {

  'use strict';

  var deleteTemplate = _.template(AlertPopup);

  // View
  //-----
  // Extending the BasePopupView
  return BasePopupView.extend({

    // @inherited
    el: '#nutanixConfirmModal',

    // for i18n purposes
    name: 'AlertPopupView',

    events: {
      'click .btnYes'     : 'hide'
    },

    initialize: function(options) {
      this.options = options.actionRoute;
      BasePopupView.prototype.initialize.call(this, options);
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      this.$el.html(deleteTemplate({
        message : this.options.message
      }));
      this.$el.addClass('-red-confirm');
      this.$el.addClass('fadeExt');
    },

    // @override
    // Hides the popup by removing the div from globalModalContainer in
    // index.html
    hide: function(e) {
      if (this.overlayPopup) {
        $('#nutanixConfirmModal').remove();
        $('#globalModalContainer').removeClass('overlay-popup');
        $('#globalModalContainer .modal').removeClass('overlay-fade');
      } else {
        BasePopupView.prototype.hide.call(this, e);
      }
    }
  });
});
