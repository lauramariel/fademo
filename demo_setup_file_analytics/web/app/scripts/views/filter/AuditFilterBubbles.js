//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AuditFilterBubbles is a helper class for rendering filter bubbles
//
define([
  // Components
  'components/Components',
  // Core
  'views/base/BaseView'],
function(
  // Components
  Components,
  // References of core
  BaseView) {

  'use strict';

  // Template for the selected entities filter
  var FILTER_SELECTED_ENTITIES_TEMPLATE = _.template(
    '<div class="filter-box <%= filterId %>" title="<%= tooltip %>">' +
      '<div class="filter-name">' +
      '<%= labelString %>' +
      '</div>' +
      '<div class="close-btn" data-id="<%= filterId %>" >' +
      '<%= Components.icon("K","-inline -micro -animated", "") %>' +
      '</div>' +
    '</div>'
  );


  // Returns the AuditFilterBubbles Class
  return BaseView.extend({

    // Name for logging and i18n
    name : 'AuditFilterBarView',

    // Function to render a query using bubbles.
    // @param filters - filter elements to be applied
    // @return - Array of individual bubble HTMLs in display order
    renderBubbles : function(filters) {
      // Keep track of bubble or input elements
      var bubbles = [];

      _.each(filters, function(filter) {
        bubbles.push(this.getFilterBubble(filter));
      }, this);

      return bubbles;
    },

    // Generate a bubble for a filter
    // @param templates - optional - to support customized bubble displays
    getFilterBubble : function(filter, templates) {
      let ret;
      // if templates not supplied, use default
      templates = templates || {
        FILTER_SELECTED_ENTITIES_TEMPLATE: FILTER_SELECTED_ENTITIES_TEMPLATE
      };

      ret = templates.FILTER_SELECTED_ENTITIES_TEMPLATE({
        filterId: filter.filterId,
        labelString: filter.labelString,
        tooltip : filter.labelString,
        Components : Components
      });

      return ret;
    }
  });
});
