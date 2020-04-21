//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// BlacklistRulesPopupView enables a user to view the blacklist rules
//
define([
  // Core classes
  'views/base/BasePopupView',
  'views/notification/NotificationPolicyTableView',
  // Models
  'models/notification/NotificationPolicyModel',
  // Components
  'components/Components',
  // Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/AppUtil',
  // Templates
  'text!templates/popup/notification/BlacklistTemplate.html'],
function(
  // Core classes
  BasePopupView,
  NotificationPolicyTableView,
  // Models
  NotificationPolicyModel,
  // Components
  Components,
  // Utils
  AppConstants,
  CommonTemplates,
  AppUtil,
  // Templates
  blacklistTemplate) {
  'use strict';

  // Page template
  var viewTemplate = _.template(blacklistTemplate);

  return BasePopupView.extend({
    name: 'BlacklistRulesPopupView',

    el: '#blacklistRulesPopupView',

    LOADING: '<div class="loader"><div class="donut-loader-gray"></div></div>',

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      const footerButtons = CommonTemplates.CUSTOM_BUTTON({
        jsCustomClass : 'btnCancel',
        customBtnText: AppConstants.BUTTON_TEXT.BTN_CANCEL
      });

      // Pass additional attributes to the popup template
      const popupTemplate = viewTemplate({
        Components: Components
      });

      // Append default template to the el
      this.$el.html(this.defaultTemplate({
        title       : this.options.actionRoute.title,
        bodyContent : popupTemplate,
        footerButtons: footerButtons
      }));

      this.$('.blacklistRulesTable').append(this.LOADING);
      // Get notification policies
      this.getNotificationPolicies();
    },

    // @private
    // Fetch notification policies configured with File server
    getNotificationPolicies: function() {
      const _this = this;

      this.model = new NotificationPolicyModel();
      this.model.getURL();
      const options = {
        success: function(data) {
          _this.preFormatResponse(data);
        },
        error: function(model, xhr) {
          const msg = AppUtil.getErrorMessage(xhr) ||
            'Error fetching blacklist rules.';

          _this.$('.blacklistRulesTable').html('');
          // On error, show error at the top of the popup.
          _this.showHeaderError(msg);
        }
      };
      this.model.fetch(options);
    },

    // Format the response to show in table
    preFormatResponse: function(response) {
      const data = [
        {
          'rule_type': AppConstants.NOTIFICATION_POLICY_TYPES.USER,
          'entities': this.model.getResource(AppConstants
            .NOTIFICATION_POLICY_TYPES.USER)
        },
        {
          'rule_type': AppConstants.NOTIFICATION_POLICY_TYPES.FILE_EXTENSIONS,
          'entities': this.model.getResource(AppConstants
            .NOTIFICATION_POLICY_TYPES.FILE_EXTENSIONS)
        },
        {
          'rule_type': AppConstants.NOTIFICATION_POLICY_TYPES.CLIENT_IPS,
          'entities': this.model.getResource(AppConstants
            .NOTIFICATION_POLICY_TYPES.CLIENT_IPS)
        }
      ];
      this.addNotificationPolicyTable(data);
    },

    // @private
    // Adds the blacklist rules table to the popup.
    // @param data - the data to be passed to the table.
    addNotificationPolicyTable: function(data) {
      let notificationPolicyTableView = new NotificationPolicyTableView({
        dataItems: data,
        entityType: AppConstants.ENTITY_BLACKLIST,
        parent: this
      });

      this.$('.blacklistRulesTable').html(notificationPolicyTableView
        .render().el);
    }
  });
});
