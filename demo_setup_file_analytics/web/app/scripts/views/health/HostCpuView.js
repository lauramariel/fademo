//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// HostCpuView gives the Host memory.
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

  var HostCpuView = BaseView.extend({

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
        return this;
      }

      // Update the components label
      const hostsStats = this.model.get(HealthModel.DP.HOST_STATS),
            hostsUsedCpu = (hostsStats &&
              _.isNumber(hostsStats[HealthModel.DP.HOST_CPU_USAGE])) ?
              StatsUtil.round(hostsStats[HealthModel.DP.HOST_CPU_USAGE]) :
              AppConstants.NOT_AVAILABLE;

      const content = CommonTemplates.SMALL_LABEL_COLUMN({
        title      : hostsUsedCpu,
        subtitle   : '%',
        smallTitle : 'OF 100%'
      });

      // Append the template to the $el
      this.$el.html(content);

      // Need to hide the total val but still dont want to change the position
      // of the other element
      this.$el.find('.lblResource').css('visibility', 'hidden');

      return this;
    }
  });

  return HostCpuView;
});
