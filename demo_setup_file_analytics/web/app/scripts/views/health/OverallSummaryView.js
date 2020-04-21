//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// OverallSummaryView gives the overall health summary of File analytics.
//
define([
  // Views
  'views/base/BaseView',
  // Components
  'components/Components',
  // Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/SVG',
  'utils/FileAnalyticsEnableUtil',
  // Models/Collections
  'models/health/HealthModel'],
function(
  // Views
  BaseView,
  // Components
  Components,
  // Utils
  AppConstants,
  CommonTemplates,
  SVG,
  FileAnalyticsEnableUtil,
  // Models/Collections
  HealthModel) {
  'use strict';

  var OverallSummaryView = BaseView.extend({

    // The model for the view.
    model: null,

    // Set view as widget
    isWidget: true,

    // @override
    modelEvents: {
      'change   model': 'render'
    },

    // All entity templates are pushed into this used to reorder them
    // 1. Critical 2. Warning 3. Ok
    entityTempl: {},

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
      // Empty the templates foro all status
      // Order should not be changed as we want
      // 1. Critical 2. Warning 3. Ok
      const ok = AppConstants.HEALTH_STATUS_VALUES[
              AppConstants.HEALTH_STATUS_CODES.GREEN],
            warning = AppConstants.HEALTH_STATUS_VALUES[
              AppConstants.HEALTH_STATUS_CODES.YELLOW],
            critical = AppConstants.HEALTH_STATUS_VALUES[
              AppConstants.HEALTH_STATUS_CODES.RED];
      this.entityTempl[critical] = [];
      this.entityTempl[warning] = [];
      this.entityTempl[ok] = [];

      // Clear previous widget display content
      if (!this.parent.clearWidget(this.options.classs, this.model, this)) {
        return;
      }

      // Update the health label
      this.updateOverallHealth();

      // Update the components label
      // Host component
      this.getHostHealthTempl();

      // Update the components label
      // ES component
      this.getESHealthTempl();

      // API component
      this.getApiHealthTempl();

      // Message service/kafka component
      this.getKafkaHealthTempl();

      // Add all components to the container
      const entityContainer = CommonTemplates.SINGLE_ENTITY_SUMMARY_HEALTH({
        entitySummary: _.flatten(_.values(this.entityTempl)).join('')
      });
      this.parent.updateWidgetColumnContent(2, true, entityContainer,
        this.parent.getDOM('.' + this.options.classs));

      // To trigger popover event once the elements are rendered
      $('[data-toggle="popover"]').popover();
    },

    // @private
    // Update overall health
    updateOverallHealth: function() {
      let healthStatus = FileAnalyticsEnableUtil.getHealthStatus(
        FileAnalyticsEnableUtil.getFileAnalyticsOverallHealth(this.model));
      // Get health class based on the status
      healthStatus = this.getHealthClass(healthStatus);

      const styleStatus = 'n-health-status-' + healthStatus;
      const docsTempl = CommonTemplates.LABEL_COLUMN({
        title      : SVG.SVGIcon('I', 'n-health-icon ' + styleStatus),
        subtitle   : FileAnalyticsEnableUtil.getHealthStatus(
          this.model.get(HealthModel.DP.FILE_ANALYTICS_HEALTH)),
        smallTitle : ''
      });
      this.parent.updateWidgetColumnContent(1, false, docsTempl,
        this.parent.getDOM('.' + this.options.classs));

      // Add class to the subtitle
      this.parent.getDOM('.' + this.options.classs)
        .find('.n-label-column-subtitle')
        .addClass('n-health-status ' + styleStatus);
    },

    // Get health class to be used to display icons
    // @private healthStatus - Status returned from API
    getHealthClass: function(healthStatus) {
      if (healthStatus === AppConstants.HEALTH_STATUS_VALUES[
        AppConstants.HEALTH_STATUS_CODES.GREEN]) {
        return 'good';
      }
      return healthStatus.toLowerCase();
    },

    // @private
    // Updates Host components health/status template
    getHostHealthTempl: function() {
      const hostContainerStats =
              this.model.get(HealthModel.DP.HOST_STATS);
      const hostStatus = this.getStatus(hostContainerStats,
        HealthModel.DP.HOST_VM_HEALTH);
      const hostStatusTempl = this.getStatusTemplate(hostContainerStats,
        hostStatus, HealthModel.DP.DESCRIPTION_OF_STATUS);

      const hostEntityTempl = CommonTemplates
        .ENTITY_SUMMARY_ROW_TEMPLATE_POPOVER({
          entityType    : 'host',
          entityStatus  : hostStatusTempl,
          entityTypeName: 'Host VM',
          totalCount    : null
        });

      // Update the entity templates
      this.entityTempl[hostStatus].push(hostEntityTempl);
    },

    // @private
    // Updates ES components health/status template
    getESHealthTempl: function() {
      const esContainerStats =
              this.model.get(HealthModel.DP.ES_CONTAINER_STATS);
      const esStatus = this.getStatus(esContainerStats,
        HealthModel.DP.ES_CONTAINER_HEALTH);
      const esStatusTempl = this.getStatusTemplate(esContainerStats,
        esStatus, HealthModel.DP.DESCRIPTION_OF_STATUS);

      const esEntityTempl = CommonTemplates
        .ENTITY_SUMMARY_ROW_TEMPLATE_POPOVER({
          entityType      : 'es',
          entityStatus    : esStatusTempl,
          entityTypeName  : 'Data Server',
          totalCount      : null
        });

      // Update the entity templates
      this.entityTempl[esStatus].push(esEntityTempl);
    },

    // @private
    // Updates API component health/status template
    getApiHealthTempl: function() {
      const gatewayContainerStats =
              this.model.get(HealthModel.DP.GATEWAY_CONTAINER_STATS);
      const apiStatus = this.getStatus(gatewayContainerStats,
        HealthModel.DP.GATEWAY_CONTAINER_HEALTH);
      const apiStatusTempl = this.getStatusTemplate(gatewayContainerStats,
        apiStatus, HealthModel.DP.DESCRIPTION_OF_STATUS);

      const apiEntityTempl = CommonTemplates
        .ENTITY_SUMMARY_ROW_TEMPLATE_POPOVER({
          entityType    : 'api',
          entityStatus  : apiStatusTempl,
          entityTypeName: 'API Server',
          totalCount    : null
        });

      // Update the entity templates
      this.entityTempl[apiStatus].push(apiEntityTempl);
    },

    // @private
    // Updates Kafka/message service component health/status template
    getKafkaHealthTempl: function() {
      const kafkaContainerStats =
              this.model.get(HealthModel.DP.KAFKA_CONTAINER_STATS);
      const kafkaStatus = this.getStatus(kafkaContainerStats,
        HealthModel.DP.KAFKA_CONTAINER_HEALTH);
      const kafkaStatusTempl = this.getStatusTemplate(kafkaContainerStats,
        kafkaStatus, HealthModel.DP.DESCRIPTION_OF_STATUS);

      const msgEntityTempl = CommonTemplates
        .ENTITY_SUMMARY_ROW_TEMPLATE_POPOVER({
          entityType      : 'message',
          entityStatus    : kafkaStatusTempl,
          entityTypeName  : 'Message Server',
          totalCount      : null
        });

      // Update the entity templates
      this.entityTempl[kafkaStatus].push(msgEntityTempl);
    },

    // @private
    // Returns the status of the container/entity passed like
    // 'Ok', 'Warning', 'Critical'
    getStatus: function(containerStats, statusDP) {
      return AppConstants.HEALTH_STATUS_VALUES[
        containerStats[statusDP]];
    },

    // @private
    // Returns the status along with description popover as a template
    getStatusTemplate: function(containerStats, status, descriptionDP) {
      if (status) {
        const count = CommonTemplates.ENTITY_COUNT_TEMPLATE({
          type: this.getHealthClass(status),
          status: status
        });
        let displayMessage = containerStats[descriptionDP] || '';
        // Replace all types of service keys with display message values
        _.each(AppConstants.HEALTH_SERVICES, function(display, key) {
          const regEx = new RegExp(key.replace('_', ' ').toLowerCase(), 'ig');
          displayMessage = displayMessage.replace(regEx, display);
        });
        const displayCount = Components.popover({
          popoverText: displayMessage,
          text: count
        });

        return displayCount;
      }
      return null;
    }

  });

  return OverallSummaryView;
});
