//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// EsSummaryView gives the ES summary.
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

  var EsSummaryView = BaseView.extend({

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
      const esStats = this.model.get(HealthModel.DP.ES_CONTAINER_STATS),
            esNode = esStats[HealthModel.DP.ES_NODE_STATUS];

      const cacheMemory =
        (esStats && _.isNumber(esStats[HealthModel.DP.ES_CACHE_AVAILABLE])) ?
          StatsUtil.round(esStats[HealthModel.DP.ES_CACHE_AVAILABLE]) + '%'
          : AppConstants.NOT_AVAILABLE,
            jvmHeapMemory =
              (esNode &&
                _.isNumber(esNode[HealthModel.DP.ES_JVM_HEAP_MEMORY_USAGE])) ?
                StatsUtil.round(
                  esNode[HealthModel.DP.ES_JVM_HEAP_MEMORY_USAGE]) + '%' :
                AppConstants.NOT_AVAILABLE,
            cpuUsage = (esNode &&
              _.isNumber(esNode[HealthModel.DP.ES_CPU_USAGE])) ?
              StatsUtil.round(esNode[HealthModel.DP.ES_CPU_USAGE]) + '%' :
              AppConstants.NOT_AVAILABLE,
            openConnections =
              (esNode && _.isNumber(esNode[HealthModel.DP.ES_OPEN_CONNECTIONS]))
                ? StatsUtil.round(esNode[HealthModel.DP.ES_OPEN_CONNECTIONS])
                : AppConstants.NOT_AVAILABLE;

      // Cache memory
      const usedCacheTempl = CommonTemplates.ENTITY_TYPE_STATS_ROW_HTML({
        entityType      : 'cache',
        subText         : cacheMemory,
        entityTypeName  : 'Cache Memory'
      });

      // JVM heap memory
      const jvmHeapMemoryTempl = CommonTemplates.ENTITY_TYPE_STATS_ROW_HTML({
        entityType      : 'jvmMemory',
        subText         : jvmHeapMemory,
        entityTypeName  : 'JVM Heap Memory Usage'
      });

      // CPU usage
      const cpuUsageTempl = CommonTemplates.ENTITY_TYPE_STATS_ROW_HTML({
        entityType      : 'cpuUsage',
        subText         : cpuUsage,
        entityTypeName  : 'CPU Usage'
      });

      // Open connections
      const openConnectionsTempl = CommonTemplates.ENTITY_TYPE_STATS_ROW_HTML({
        entityType      : 'openConnections',
        subText         : openConnections,
        entityTypeName  : 'Open Connections'
      });

      // Add all components to the container
      const entityContainer = CommonTemplates.SINGLE_ENTITY_SUMMARY_HEALTH({
        entitySummary: usedCacheTempl + jvmHeapMemoryTempl + cpuUsageTempl +
          openConnectionsTempl
      });

      this.parent.updateWidgetColumnContent(2, true, entityContainer,
        this.parent.getDOM('.' + this.options.classs));

      // Update widget style
      this.parent.getDOM('.' + this.options.classs).find('.n-column-content-1')
        .hide();
      this.parent.getDOM('.' + this.options.classs).find('.n-column-content-2')
        .css('top', '0');
    }
  });

  return EsSummaryView;
});
