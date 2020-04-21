//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// CapacityTrendPopupView enables a user to view the capacity trend details.
//
define([
  // Core classes
  'views/base/BasePopupView',
  'views/capacitytrend/CapacityDataTableGroupView',
  'views/capacitytrend/CapacitySummaryTableView',
  // Templates
  'text!templates/capacityTrend/CapacityTrendPopup.html'],
function(
  // Core classes
  BasePopupView,
  CapacityDataTableGroupView,
  CapacitySummaryTableView,
  // Templates
  CapacityTrendPopup) {

  'use strict';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner> \
    <div class="capacity-form"></div> \
    </div>';

  var pageTemplate = _.template(CapacityTrendPopup);

  return BasePopupView.extend({
    name: 'CapacityTrendPopupView',

    el: '#capacityTrendPopupView',

    // Events
    events: {
      'click .modal-header .close:not(.disabled)' : 'hide',
      'click [data-dismiss="alert"]'              : 'clearHeader',
      'click .btnCancel'                          : 'hide'
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      this.$el.html(this.defaultTemplate({
        title        : this.options.actionRoute.title,
        bodyContent  : viewTemplate,
        footerButtons: ''
      }));

      this.$('.capacity-form').append(pageTemplate);

      // Add tables
      this.addSummaryTable();
      this.addDetailTableGroup();
    },

    // @private
    // Add the detail table based on the selected tab.
    addDetailTableGroup: function() {
      return new CapacityDataTableGroupView({
        el    : this.$('.capacity-details-table-group'),
        pageId: 'capacity_trend',
        startTimeInMs: this.options.actionRoute.startTimeInMs,
        endTimeInMs: this.options.actionRoute.endTimeInMs,
        interval: this.options.actionRoute.interval
      });
    },

    // @private
    // Add capacity summary table to the popup.
    addSummaryTable: function() {
      let capacitySummaryTableView = new CapacitySummaryTableView({
        totalCapacity:  this.options.actionRoute.totalCapacity,
        capacityAdded:  this.options.actionRoute.capacityAdded,
        capacityRemoved:  this.options.actionRoute.capacityRemoved
      });

      // Append the newly initialized datatable
      this.getDOM('.capacity-summary-table')
        .append(capacitySummaryTableView.render().el);

      // Start fetch
      capacitySummaryTableView.onStartServices();
    }
  });
});
