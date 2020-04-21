//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// HostMemoryView gives the Host memory.
//
define([
  // Views
  'views/base/BaseView',
  // Utils
  'utils/StatsUtil',
  'utils/CommonTemplates',
  'utils/AppConstants',
  // Models/Collections
  'models/health/HealthModel'],
function(
  // Views
  BaseView,
  // Utils
  StatsUtil,
  CommonTemplates,
  AppConstants,
  // Models/Collections
  HealthModel) {
  'use strict';

  var HostMemoryView = BaseView.extend({

    // The model for the view.
    model: null,

    // Set view as widget
    isWidget: true,

    // @override
    modelEvents: {
      'change   model': 'render'
    },

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.parent = this.options.parent;
      this.model = this.parent.healthModel;
      // Update the widget when data in model changes
      this.delegateModelEvents();
      BaseView.prototype.initialize.call(this, options);
    },

    render: function() {
      // Clear previous widget display content
      if (!this.parent.clearWidget(this.options.classs, this.model, this)) {
        return;
      }

      // Update the components label
      const hostsStats = this.model.get(HealthModel.DP.HOST_STATS),
            hostsTotalMemory = (hostsStats &&
              _.isNumber(hostsStats[HealthModel.DP.HOST_TOTAL_MEMORY])) ?
              StatsUtil.formatBytes(
                hostsStats[HealthModel.DP.HOST_TOTAL_MEMORY]) :
              AppConstants.NOT_AVAILABLE,
            hostsUsedMemory = (hostsStats &&
              _.isNumber(hostsStats[HealthModel.DP.HOST_AVAILABLE_MEMORY])) ?
              StatsUtil.round(
                100 - hostsStats[HealthModel.DP.HOST_AVAILABLE_MEMORY]) :
              AppConstants.NOT_AVAILABLE;

      const content = CommonTemplates.SMALL_LABEL_COLUMN({
        title      : hostsUsedMemory,
        subtitle   : '%',
        smallTitle : 'OF ' + hostsTotalMemory
      });

      // Append the template to the $el
      this.$el.html(content);

      return this;
    }
  });

  return HostMemoryView;
});
