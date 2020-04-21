//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AuditFilterBarView is the class for showing and managing
// current query filters. Each setting is shown as a closeable bubble.
//
define([
  // Core
  'views/filter/AuditFilterBubbles',
  'views/base/BaseView'],
function(
  // References of core
  AuditFilterBubbles,
  BaseView) {

  'use strict';

  // Template to render the favorite icon
  var FAV_ICON_TEMPLATE =
    '<div class="icons-wrapper">' +
      '<a class="reset-filters">Clear</a>' +
    '</div>';

  // Returns the AuditFilterBarView Class
  return BaseView.extend({

    // Name for logging and i18n
    name : 'AuditFilterBarView',

    // Instance of the filter bubbles helper
    filterBubbles : null,

    // Functions (Core)
    //-----------------

    // @override
    initialize: function() {
      BaseView.prototype.initialize.apply(this, arguments);
      this.filterBubbles = new AuditFilterBubbles();
    },

    // @overide
    render: function(val) {
      // Keep track of bubble or input elements
      let html = '';

      let bubbles = this.filterBubbles.renderBubbles(val);
      _.each(bubbles, function(bubble) {
        html += bubble;
      });

      html += FAV_ICON_TEMPLATE;

      this.$el.html(html);
    }
  });
});
