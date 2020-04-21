//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// Header class renders the header view on all the screens.
//
define([
  // Views
  'views/base/BaseView',
  'views/base/DataTableTemplates',
  'views/task/TaskView',
  'views/anomalyscreen/AlertDashboardView',
  // Managers
  'managers/PopupManager',
  'managers/WizardManager',
  'managers/NamespaceManager',
  'managers/NotificationManager',
  // Models
  'models/dashboard/CustomiseDashboardModel',
  'models/fileservers/FileServerSubscriptionModel',
  // Utils
  'utils/SVG',
  'utils/AppUtil',
  'utils/RoutingURLConstants',
  'utils/AppConstants',
  'utils/FileAnalyticsEnableUtil',
  // Templates
  'text!templates/header/Header.html'],
function(
  // Views
  BaseView,
  DataTableTemplates,
  TaskView,
  AlertDashboardView,
  // Managers
  PopupManager,
  WizardManager,
  NamespaceManager,
  NotificationManager,
  // Models
  CustomiseDashboardModel,
  FileServerSubscriptionModel,
  // Utils
  SVG,
  AppUtil,
  RoutingURLConstants,
  AppConstants,
  FileAnalyticsEnableUtil,
  // Templates
  headerTemplate) {

  var Header = BaseView.extend({

    // The model for this view.
    model: null,

    // Holds the Task View
    taskView: null,

    MAX_TASK_DROPDOWN_HEIGHT: 300,

    // Events Listeners
    //-----------------

    events: {
      'click .n-main-menu-btn a'        : 'onMenuClick',
      'click .n-main-menu-btn'          : 'cancelDocumentClick',
      'click .file-server-dropdown\
       .n-nav-menu-item'                : 'onFileServerSelect',
      'click .file-server-list-option'  : 'onFileServerSelect',
      'click .policy-alert'             : 'onSMTPClick',
      'click .email-config'             : 'onPolicyClick',
      'click .data-retention'           : 'onDataRetentionClick',
      'click .auditTrail'               : 'onSearchClick',
      'click .usageAnomalies'           : 'onUsageAnomalyClick',
      'click .selected-dashboard'       : 'onDashboardClick',
      'mouseover .field-name'           : 'showTooltip',
      'click .n-task-wrapper'           : 'onTaskMenuClick',
      'click .disableFs'                : 'disableFileServer',
      'click .updateAdLdap'             : 'onAdLdapClick',
      'click .signOut'                  : 'signOut',
      'click .reTriggerMData'           : 'onMDataClick',
      'click .aboutAfs'                 : 'onAboutClick',
      'click .collectLogBundle'         : 'onCollectLogBundle',
      'click .fileCategory'             : 'onFileCategoryClick',
      'click .healthMonitoring'         : 'onHealthClick',
      'click .blacklistRules'           : 'onDefineBlacklistClick'
    },

    // @override
    initialize: function(options) {
      _.bindAll(this, 'onDocumentClick');
      this.antiScrollApplied = false;

      // Remove user name from the url.
      AppUtil.removeUserNamefromtheURL(options.userName);

      // Initialize the model.
      this.model = new CustomiseDashboardModel();

      // Render the header on the page.
      this.render();
    },

    // @override
    render: function() {
      // Appending the header template.
      this.$el.html(_.template(headerTemplate)({
        SVG: SVG,
        userName: this.options.userName
      }));

      // Appending the SVG icons.
      this.$el.prepend(SVG.loadSVG(SVG.ICONS));

      // Appending the loading icon.
      this.$('.page-loader').append(DataTableTemplates.LOADING);

      this.taskView = new TaskView({ el: this.$('.n-header-tasks') });

      // Hide nav links if page is 404
      if (AppUtil.getCurrentPageId() === AppConstants.PAGE_NOT_FOUND) {
        this.hideNavLinks();
      }
    },

    // Update the file server as there is a possibility that the
    // file server passed to the header during initialization
    // could be incorrect.
    updateFileServer: function(fileServer) {
      // Disable header options till the fetch is complete.
      $('#n-header *').prop('disabled', false);
      this.options.fsId = fileServer;

      const _this = this;
      // Get meta data scan only if analytics and fileserver is active
      if (NamespaceManager.get('analytics_enabled_' + this.options.fsId) &&
        NamespaceManager.get('fileserver_active_' + this.options.fsId)) {
        // For enable need to wait for 70sec for the first time before polling
        // meta data scan
        setTimeout(function() {
          FileAnalyticsEnableUtil.getMetaDataStatus({
            fsId: _this.options.fsId });
        }, AppConstants.ENABLE_METADATA_SCAN_INTERVAL);
      } else {
        FileAnalyticsEnableUtil.clearScheduledPolling();
      }
    },

    // Hide nav links, mainly used in case of enable page
    hideNavLinks: function() {
      const propertyValue = {
        'opacity': 1,
        'display': 'block'
      };

      // Hide all nav link
      this.$('.n-navigation').removeClass('-show').addClass('-hide');

      // Show selected links
      this.$('.n-multi-nav-bar, .n-header-logo, \
        div:has( > .file-server-dropdown ), \
        div:has( > .n-main-menu-btn .n-user )').css(propertyValue);
    },

    // Show nav links
    showNavLinks: function() {
      // Show all nav link
      this.$('.n-navigation').addClass('-show').removeClass('-hide');
    },

    // Hide settings icon generally in case selected file server has
    // analytics disabled
    hideSettings: function() {
      this.$('.settingsOptionContainer').hide();
      this.$('.disableTag').show();

      // Hide add anomaly rules button if present
      $('.page-anomaly .n-page-nav').hide();
      $('.page-anomaly .n-page-nav .n-page-action-group').remove();
    },

    // Shows settings icon generally in case selected file server has
    // analytics enabled
    showSettings: function() {
      this.$('.settingsOptionContainer').show();
      this.$('.disableTag').hide();
    },

    showTooltip: function(e) {
      let target = $(e.currentTarget);
      if (target[0].scrollWidth > target.innerWidth()) {
        target.attr('title', target[0].innerText);

      }
    },

    // @private
    // Shows the dashboard/search page on the change of file server.
    viewDashboard: function(fileServer) {
      // Append the selected fileserver in the API calls.
      AppUtil.preRequestSetup({ fileServer: fileServer });

      // Change the currently selected dashboard name to 'Dashboard'.
      this.$('.selected-dashboard').text('Dashboard');

      this.options.fsId = fileServer;

      this.loadPage();
    },

    // @private
    // Loads the required page according to the URL.
    loadPage: function() {
      let templ = '';

      // In case present view
      if (AppUtil.isParameterPresent('#search')) {
        // In case present view is search page.
        templ = _.template(RoutingURLConstants.DEFAULT_SEARCH, {
          fileServer  :  this.options.fsId
        });
      } else if (AppUtil.isParameterPresent('#anomaly')) {
        // In case present view is search page.
        templ = _.template(RoutingURLConstants.ANOMALY, {
          fileServer  :  this.options.fsId
        });
      } else {
        // Update the URL for dashboard page. - default page
        templ = _.template(RoutingURLConstants.DEFAULT_DASHBOARD,
          {
            fileServer: this.options.fsId
          });
      }
      AppUtil.navigateToUrl(templ);
    },

    cancelDocumentClick: function(event) {
      event.stopPropagation();
    },

    // Functions (Event Handlers)
    //---------------------------

    // @private
    // Handle clicking on show/hide menu button.
    onMenuClick: function(event) {
      event.stopPropagation();
      // Register click handler for mouse click outside of menus
      $(document).off('click', this.onDocumentClick)
        .on('click', this.onDocumentClick);

      let menuElement = $(event.currentTarget.parentElement.parentElement);

      // Close the currently open menu.
      if (this._closeCurrentMenu(event, menuElement)) {
        return;
      }

      menuElement.find('.n-nav-menu').show()
        .end()
        .addClass('n-menu-active');
      menuElement.attr('m-active', '');

      // Allows user to see hidden menu items if shift + click
      // Currently this is only used for the Chrome-only
      // High-Contrast mode.
      if (event.shiftKey) {
        if ($('html').hasClass('chrome')) {
          menuElement.find('.n-nav-menu')
            .addClass('n-reveal-hidden');
        }
        // The n-preview-hidden class allows hidden menu items to be
        // displayed in a preview state, such as with half-opacity.
        // Currently this is used for seeing the high-contrast
        // option, which is disabled on non-chrome since it is not
        // supported by other browsers.
        else {
          menuElement.find('.n-nav-menu')
            .addClass('n-preview-hidden');
        }
      }

      event.stopPropagation();
    },

    // Handler when task menu is clicked in header
    onTaskMenuClick: function(e) {
      if (this._closeCurrentMenu(e)) {
        return;
      }
      this.taskView.showDropdown();
      $(e.currentTarget).attr('m-active', '');
      $(document).on('click', this.onDocumentClick);
      e.stopPropagation();
    },

    // @private
    // Handler for when mouse click occurs outside of menus
    onDocumentClick: function(event) {
      // Check the menus
      $('.n-menu-active').find('.n-nav-menu').hide()
        .removeClass('n-reveal-hidden n-preview-hidden');
      $('.n-menu-active').removeClass('n-menu-active');
      this.$('.n-main-menu-btn').removeAttr('m-active');
      this.$('.n-task-wrapper').removeAttr('m-active');

      if (this.taskView) {
        this.taskView.closeDropdown();
      }

      $(document).off('click', this.onDocumentClick);
    },

    // @private
    // Close current menu and return a boolean indicating if the currently
    // open menu was the menu clicked.
    _closeCurrentMenu: function(event, el) {
      let clickedCurrent = false;

      el = el || $(event.currentTarget);

      if (el[0].hasAttribute('m-active')) {
        clickedCurrent = true;
      }

      // Check the menus
      this.$('.n-menu-active').find('.n-nav-menu').hide()
        .removeClass('n-reveal-hidden n-preview-hidden');
      this.$('.n-menu-active').removeClass('n-menu-active');
      this.$('.n-main-menu-btn').removeAttr('m-active');
      this.$('.n-task-wrapper').removeAttr('m-active');
      if (this.taskView) {
        this.taskView.closeDropdown();
      }

      return clickedCurrent;
    },

    // @private
    // Opens a popup for anomaly configuration.
    onPolicyClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.POLICY;
      options.action = AppConstants.ENTITY_ANOMALY_POLICY;
      options.actionTarget = AppConstants.ENTITY_ANOMALY_POLICY;
      options.fsId = this.options.fsId;
      PopupManager.handleAction(options);
    },

    onDataRetentionClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.DATA_RETENTION;
      options.action = AppConstants.ENTITY_DATA_RETENTION;
      options.actionTarget = AppConstants.ENTITY_DATA_RETENTION;
      options.fsId = this.options.fsId;
      PopupManager.handleAction(options);
    },

    // @private
    // Opens a popup for SMTP configuration.
    onSMTPClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.SMTP;
      options.action = AppConstants.ENTITY_SMTP;
      options.actionTarget = AppConstants.ENTITY_SMTP;
      PopupManager.handleAction(options);
    },

    // @private
    // Directs to search on click of search icon.
    onSearchClick: function() {
      // Update the URL for search.
      let searchTempl = _.template(RoutingURLConstants.DEFAULT_SEARCH, {
        fileServer  :  this.options.fsId
      });
      AppUtil.navigateToUrl(searchTempl);
    },

    // @private
    // Directs to settings on click of settings icon.
    onSettingsClick: function() {
      // Update the URL for settings.
      let settingsTempl = _.template(RoutingURLConstants.SETTINGS, {
        fileServer  :  this.options.fsId
      });
      AppUtil.navigateToUrl(settingsTempl);
    },

    // @private
    // Directs to the anomaly page on click of usage anomalies
    onUsageAnomalyClick: function() {
      // Update the URL for anomaly.
      let anomalyTempl = _.template(RoutingURLConstants.ANOMALY, {
        fileServer  :  this.options.fsId
      });
      AppUtil.navigateToUrl(anomalyTempl);
    },

    onDashboardClick: function() {
      // Update the URL for dashboard.
      let dashTempl = _.template(RoutingURLConstants.DEFAULT_DASHBOARD, {
        fileServer  :  this.options.fsId
      });
      AppUtil.navigateToUrl(dashTempl);
    },

    // @private
    // Set the file server selected by the user
    onFileServerSelect: function(e) {
      let target = e.target;
      let selectedFileServer = this.$('.selected-file-server')
        .attr('actionTargetId').trim();
      e.stopPropagation();

      // Update the displayed file server
      let selectedOptionHolder = $(target).parents('.n-top-menu')
        .find('.n-nav-label');
      let selectedOption, selectedOptionVal = '';
      if ($(target).find('a').attr('actionTargetId')) {
        selectedOption = $(target).find('a').attr('actionTargetId');
        selectedOptionVal = $(target).find('a').attr('actionTarget');
      } else {
        selectedOption = $(target).closest('a').attr('actionTargetId');
        selectedOptionVal = $(target).closest('a').attr('actionTarget');
      }

      if ($(target).parents('.n-top-menu').hasClass('file-server-dropdown')) {
        this.options.fileServer = selectedOption;
        this.options.fsId = selectedOption;

        // Setting selected option
        if (selectedOption) {
          selectedOptionHolder.attr('actiontargetId', selectedOption)
            .html(selectedOptionVal);
        }
        if (selectedFileServer !== selectedOption) {
          this.viewDashboard(selectedOption);
        }
      }

      // Close the menu on option select
      this._closeCurrentMenu(e);

      // Clear the scheduled pooling for the old file server
      if (selectedFileServer !== selectedOption) {
        FileAnalyticsEnableUtil.clearScheduledPolling(
          { fsId: selectedOption });
        FileAnalyticsEnableUtil.clearTaskManager(
          { fsId: selectedFileServer });
      }
    },

    // @private
    // Show enable file analytics popup
    enableFileServer: function(fsId) {
      let options = {};
      options.title = AppConstants.POPUP.FILE_SERVER_ENABLE;
      options.action = AppConstants.ENTITY_FILE_SERVER_ENABLE;
      options.actionTarget = AppConstants.ENTITY_FILE_SERVER_ENABLE;
      options.fsId = fsId || this.options.fsId;
      PopupManager.handleAction(options);
    },

    // @private
    // Disable file analytics show confirm box
    disableFileServer: function() {
      const msg = 'Once you disable File Analytics, no data will be collected. \
      All the defined blacklist rules will be deleted. However, \
      the historic data collected till date will still remain.';

      $.nutanixConfirm({
        title: '<strong>Disable File Analytics?</strong>',
        msg: msg,
        yesText: 'Disable',
        noText: 'Cancel',
        yes: function() {
          this.disableFileAnalytics();
        },
        context: this
      });

      // Add red color to Disable button
      $('#nutanixConfirmModal .btnYes').addClass('btn-danger');
    },

    // @private
    // Disable file analytics
    disableFileAnalytics: function() {
      let _this = this, fsSubscriptionModel = new FileServerSubscriptionModel();
      fsSubscriptionModel.set(
        fsSubscriptionModel.DP.FILESERVER_UUID, this.options.fsId);
      fsSubscriptionModel.getURL();
      fsSubscriptionModel.destroy({
        success(model, response) {
          // Check if the current page is Anomaly
          if (AppUtil.getCurrentPageId() ===
            AppConstants.ANOMALY_PAGE_ID) {
            // Disable configure button on AlertDashboard
            AlertDashboardView.prototype.disableConfigureAlertBtn.call();
          }

          // Set analytics enable flag as false
          NamespaceManager.set('analytics_enabled_' + _this.options.fsId,
            false);

          // Hide settings and show notification bar
          NamespaceManager.get(
            NamespaceManager.APP_VIEW).showEnableNotificationBar();

          // Show success notification
          NotificationManager.showClientNotification(
            AppConstants.NOTIFY_SUCCESS, 'File Analytics is disabled.');
        },
        error(model, xhr) {
          // Show error notification
          const msg = AppUtil.getErrorMessage(xhr);
          NotificationManager.showClientNotification(
            AppConstants.NOTIFY_ERROR, msg);
        }
      });
    },

    // @private
    // Show update AD/LDAP configuration popup
    onAdLdapClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.FILE_SERVER_AD_LDAP_CONFIG;
      options.action = AppConstants.ENTITY_FILE_SERVER_AD_LDAP_CONFIG;
      options.actionTarget = AppConstants.ENTITY_FILE_SERVER_AD_LDAP_CONFIG;
      options.fsId = this.options.fsId;
      WizardManager.handleAction(options);
    },


    // @private
    // Sign out of the application and redirect user to prism
    signOut: function() {
      AppUtil.logOut();
    },

    // @private
    // Trigger meta data collection popup
    onMDataClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.TRIGGER_METADATA;
      options.action = AppConstants.ENTITY_TRIGGER_MDATA;
      options.actionTarget = AppConstants.ENTITY_TRIGGER_MDATA;
      options.fsId = this.options.fsId;
      options.userName = this.options.userName;
      // Open meta data popup only if fileserver is enabled or active
      if (NamespaceManager.get('analytics_enabled_' + this.options.fsId) &&
        NamespaceManager.get('fileserver_active_' + this.options.fsId)) {
        PopupManager.handleAction(options);
      }
    },

    // @private
    // Show about AFS version
    onAboutClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.ABOUT_AFS_POPUP;
      options.action = AppConstants.ENTITY_ABOUT_AFS;
      options.actionTarget = AppConstants.ENTITY_ABOUT_AFS;

      PopupManager.handleAction(options);
    },

    // @private
    // Download avm log tar.gz
    onCollectLogBundle: function() {
      let options = {};
      options.title = AppConstants.POPUP.COLLECT_LOGS_POPUP;
      options.action = AppConstants.ENTITY_LOG_COLLECTION;
      options.actionTarget = AppConstants.ENTITY_LOG_COLLECTION;

      PopupManager.handleAction(options);
    },

    // @private
    // Update file category configuration
    onFileCategoryClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.FILE_CATEGORY_CONFIG_POPUP;
      options.action = AppConstants.ACTION_UPDATE_FILE_CATEGORY;
      options.actionTarget = AppConstants.ENTITY_FILE_SERVER;

      PopupManager.handleAction(options);
    },

    // @private
    // Update blacklist rules
    onDefineBlacklistClick: function() {
      let options = {};
      options.title = AppConstants.POPUP.BLACKLIST_RULES_POPUP;
      options.action = AppConstants.ACTION_UPDATE_BLACKLIST_RULES;
      options.actionTarget = AppConstants.ENTITY_BLACKLIST;
      PopupManager.handleAction(options);
    },

    // @private
    // Directs to health page on click of health monitoring from settings.
    onHealthClick: function() {
      // Showing loader to fade the current page until the validation checks
      // are made and page render begins
      AppUtil.showLoader();
      // Update the URL for search.
      const healthTempl = _.template(RoutingURLConstants.DEFAULT_HEALTH, {
        fileServer  :  this.options.fsId
      });
      AppUtil.navigateToUrl(healthTempl);
    }
  });
  // Return the header view.
  return Header;
});
