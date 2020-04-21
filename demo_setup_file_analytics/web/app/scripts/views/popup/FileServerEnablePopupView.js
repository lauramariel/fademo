//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileServerEnablePopupView used to enable analytics for
// selected file server.
//
define([
  // Core classes
  'views/base/BasePopupView',
  // Views
  'views/anomalyscreen/AlertDashboardView',
  // Models
  'models/fileservers/FileServerModel',
  'models/fileservers/FileServerSubscriptionModel',
  //  Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/AppUtil',
  'utils/FileAnalyticsEnableUtil',
  // Managers
  'managers/NotificationManager',
  'managers/NamespaceManager',
  // Templates
  'text!templates/popup/fileserver/FileServerEnablePopup.html',
  'text!templates/popup/fileserver/FileServerADTemplate.html',
  'text!templates/popup/fileserver/FileServerLDAPTemplate.html',
  // Components
  'components/Components'],
function(
  // Core classes
  BasePopupView,
  // Views
  AlertDashboardView,
  // Models
  FileServerModel,
  FileServerSubscriptionModel,
  // Utils
  AppConstants,
  CommonTemplates,
  AppUtil,
  FileAnalyticsEnableUtil,
  // Managers
  NotificationManager,
  NamespaceManager,
  // Templates
  fileserverEnablePopupTemplate,
  fileserverADTemplate,
  fileserverLDAPTemplate,
  // Components
  Components) {

  'use strict';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner>\
    <div class="fileserverEnableForm"></div>\
    </div>';

  var fileserverEnableTemplate = _.template(fileserverEnablePopupTemplate);
  var fileserverADTempl = _.template(fileserverADTemplate);
  var fileserverLDAPTempl = _.template(fileserverLDAPTemplate);

  // AD inputs as part of enable, should be same as name attribute in form
  const AD_INPUTS = ['domain', 'username', 'password'];

  // LDAP inputs as part of enable, should be same as name attribute in form
  const LDAP_INPUTS = ['server_url', 'base_dn', 'bind_dn', 'bind_password'];

  return BasePopupView.extend({
    name: 'popupFileServerEnable',

    el: '#popupFileServerEnable',

    // Edit action or create action flag
    action: AppConstants.ACTION_UPDATE,

    // Events
    events: {
      'click .modal-header .close:not(.disabled)' : 'hide',
      'click [data-dismiss="alert"]'              : 'clearHeader',
      'click .btnCancel'                          : 'hide',
      'click .btnOk'                              : 'saveOnSubmit',
      'change .userNameOptions'                   : 'onChangeUsername',
      'keyup input'                               : 'onKeyUp',
      'focus .bindDN'                             : 'onFocusBindDN',
      'blur  .bindDN'                             : 'onBlurBindDN'
    },

    initialize: function(options) {
      BasePopupView.prototype.initialize.call(this, options);
      this.model = new FileServerModel();
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      // Footer button template
      let footerButtons = CommonTemplates.CUSTOM_FOOTER_BUTTON({
        jsCancelClass : '',
        jsSaveClass   : '',
        cancelBtnText : 'Cancel',
        saveBtnText   : 'Enable'
      });

      // Get data retention option list
      let retentionOptionList =
        FileAnalyticsEnableUtil.getDataRetentionOptionList();

      // Data retention tooltip text
      const tooltipText = 'Data retention period refers to the period \
        for which event data is available.';

      // Attach default popup template
      this.$el.html(this.defaultTemplate({
        title        : this.options.actionRoute.title,
        bodyContent  : viewTemplate,
        footerButtons: footerButtons
      }));

      // Append fileserver enable form template
      this.$('.fileserverEnableForm').append(fileserverEnableTemplate({
        Components : Components,
        dataRetentionOptions: retentionOptionList,
        dataRetentionTooltip: tooltipText
      }));

      // Enable tooltip
      this.$('.nutanixMoreInfo').nutanixMoreInfo({
        parseDataAttrs: true,
        placement: 'top'
      });

      // Disable save button
      this.$('.btnOk').attr('disabled', 'disabled');

      // Get file server info
      this.fetchFileServerInfo();
    },

    // @private
    // Fetch file server info from PRISM.
    fetchFileServerInfo: function() {
      let _this = this;

      // Fetch file server info
      this.fsSubscriptionModel = new FileServerSubscriptionModel();
      this.fsSubscriptionModel.getURL();
      this.fsSubscriptionModel.fetch({
        success: function(data) {
          // Get the existing configuration.
          _this.getExistingConfiguration();
        },
        error: function(model, xhr) {
          if (xhr.responseJSON) {
            _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
              xhr.responseJSON.error);
            return;
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Error fetching file server configuration.');
        }
      });
    },

    // @private
    // Gets the file server configuration if any.
    getExistingConfiguration: function() {
      let _this = this;
      this.model.getURL();
      this.model.fetch({
        success: function(data) {
          // Append protocol template
          _this.updateProtocolTemplate();

          // Set data retention
          let dataRetention = 12,
              fsObj = _this.getSelectedFileServer();

          if (Object.keys(fsObj).length) {
            dataRetention = fsObj[data.DP.DATA_RETENTION_PERIOD];
          }

          _this.$('.dataRetentionOptions').val(dataRetention).trigger('change');
        },
        error: function(model, xhr) {
          if (xhr.responseJSON) {
            _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
              xhr.responseJSON.error);
            return;
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Error fetching file server configuration.');
        }
      });
    },

    // @private
    // Add protocol inputs to the enable form depending on the file server
    // protocol and prepopulate fields
    updateProtocolTemplate: function() {
      // Enable save button
      this.$('.btnOk').removeAttr('disabled');
      const fsProtocol = this.fsSubscriptionModel.getProtocol(),
            nfsAuthType = this.fsSubscriptionModel.get(
              this.fsSubscriptionModel.DP.NFS_AUTH_TYPE);
      let adTempl = '', ldapTempl = '', userTempl = '',
          showAdUserTooltip = false;

      if (fsProtocol && fsProtocol !== AppConstants.FS_PROTOCOLS.NONE) {
        // Get file server info from avm
        let fileServerDetails = this.getSelectedFileServer();
        const adInfo = fileServerDetails[this.model.DP.DIRECTORY_SERVICES].ad;
        const userName = (adInfo && adInfo.username) ? adInfo.username : '';
        let protocolName = fsProtocol;
        if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB &&
            nfsAuthType === AppConstants.FS_AUTH_TYPES.ACTIVE_DIRECTORY) {
          protocolName = 'NFS, SMB';
          showAdUserTooltip = true;
          userTempl = FileAnalyticsEnableUtil.getUserNameTemplate(
            this.fsSubscriptionModel, userName);
        } else if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB ||
          fsProtocol === AppConstants.FS_PROTOCOLS.SMB) {
          protocolName = AppConstants.FS_PROTOCOLS.SMB;
          showAdUserTooltip = true;
          userTempl = FileAnalyticsEnableUtil.getUserNameTemplate(
            this.fsSubscriptionModel, userName);
        }

        // nfs_auth_type is unmanaged or ldap, either is possible for nfs
        // protocol
        if (nfsAuthType === AppConstants.FS_AUTH_TYPES.LDAP) {
          const ldapDetails = this.fsSubscriptionModel.getLdapDetails();
          ldapTempl = fileserverLDAPTempl({
            showTitle: true,
            baseDn : (ldapDetails && ldapDetails.base_dn) ?
              ldapDetails.base_dn : '',
            bindDn : (ldapDetails && ldapDetails.bind_dn) ?
              ldapDetails.bind_dn : '',
            serverUrl : (ldapDetails && ldapDetails.server_url) ?
              ldapDetails.server_url : '',
            msg: ''
          });
        }

        // AD can be for nfs or smb or both
        if (this.fsSubscriptionModel.getAdDomain()) {
          // SMB Ad user tooltip text
          const adUserTooltip = 'User needs to be configured with File Server \
            Admin role under Manage Roles in Prism File Server page.';
          adTempl = fileserverADTempl({
            protocol: protocolName,
            adDomain: this.fsSubscriptionModel.getAdDomain(),
            userName: userName,
            titleClass: '',
            showAdUserTooltip: showAdUserTooltip,
            adUserTooltip: adUserTooltip,
            userTempl: userTempl,
            msg: ''
          });

          // Disable Enable button when username is not present.
          if ((fsProtocol === AppConstants.FS_PROTOCOLS.SMB ||
            fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB) &&
            !this.fsSubscriptionModel.getAdminUsers().length) {
            this.$('.btnOk').attr('disabled', 'true');
          }
        }
      } else {
        // Disable the button in case of no directory services been
        // configured.
        this.$('.btnOk').attr('disabled', true);

        const msg = `File Server does not have any directory service
          configured. Please configure it to enable File Analytics.`;

        // Show warning message in the popup.
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_WARNING, msg,
          AppConstants.MODAL.ALERT.CLOSE_TYPE_PERMANENT);
      }

      // Append enable form template
      this.$('.dataRetentionContainer').append(adTempl).append(ldapTempl);

      // Enable tooltip
      if (showAdUserTooltip) {
        this.$('.nutanixMoreInfo').nutanixMoreInfo({
          parseDataAttrs: true,
          placement: 'top'
        });
      }
    },

    // @private
    // Get file server info for the selected file server
    // from the list
    getSelectedFileServer: function() {
      const fsId =
        this.options.fsId || $('.selected-file-server').attr('actionTargetId');
      let fileServer = _.find(this.model.toJSON(), function(fileserver) {
        return fileserver.fileserver_uuid === fsId;
      });

      return fileServer;
    },

    // @private
    // Get enable form values and validate
    getFormValues: function() {
      let formValues = this.$('form').serializeArray(),
          payload = {}, adDomain = this.fsSubscriptionModel.getAdDomain(),
          ldapDetails = this.fsSubscriptionModel.getLdapDetails();

      // Set valid validation flag as true
      payload.isValid = true;
      if (adDomain) {
        payload.ad_credentials = {};
        payload.ad_credentials.username = this.$('.userNameOptions').val();
      }
      if (Object.keys(ldapDetails).length) {
        payload.ldap_credentials = {};
      }

      // Format the form values and validate if none of the value is blank
      formValues.forEach(function(formVal, i) {
        if (!formVal.value && formVal.name !== 'bind_dn' &&
          formVal.name !== 'bind_password') {
          payload.isValid = false;
          return payload.isValid;
        }

        // Form based on attribute 'name'
        if (AD_INPUTS.includes(formVal.name)) {
          payload.ad_credentials[formVal.name] = formVal.value.trim();
        } else if (LDAP_INPUTS.includes(formVal.name)) {
          payload.ldap_credentials[formVal.name] = formVal.value.trim();
        } else {
          payload[formVal.name] = formVal.value.trim();
        }
      });

      return payload;
    },

    // @private
    // Shows modal alert.
    // @param type is the type of the error message.
    // @param message is the error message to be shown.
    showAlert: function(type, message, closeTiming) {
      this.triggerAction(AppConstants.MODAL.ACT.ALERT_SHOW, {
        type: type,
        message: message,
        closeTiming: closeTiming
      });
    },

    // Functions (Event Handlers)
    //---------------------------

    // @private
    // Handles the click of enable button.
    saveOnSubmit: function() {
      const protocolType = this.fsSubscriptionModel.getProtocol();
      const fsId = this.fsSubscriptionModel.get(
        this.fsSubscriptionModel.DP.FILESERVER_UUID);
      let payload = {}, formValues = {}, _this = this;

      // Disable save button
      this.$('.btnOk').attr('disabled', 'disabled');

      // Data retention value
      const dataRetention = this.$('.dataRetentionOptions').val().trim();
      payload.data_retention_months =
        dataRetention || AppConstants.YEAR_TO_MONTH;

      // File server DNS donmain value
      payload.dns_domain_name = this.fsSubscriptionModel.get(
        this.fsSubscriptionModel.DP.DNS_DOMAIN_NAME);
      payload.file_server_uuid = fsId;

      if (protocolType) {
        // If protocol is nfs and auth type is ldap
        // need to validate bindDn and bindPassword
        let nfsLdapDetails = this.fsSubscriptionModel.getLdapDetails();
        if ((protocolType === AppConstants.FS_PROTOCOLS.NFS ||
          protocolType === AppConstants.FS_PROTOCOLS.NFS_SMB) &&
          Object.keys(nfsLdapDetails).length) {
          let isValidLdap =
            FileAnalyticsEnableUtil.validateLdapForm(this.$('form'));
          if (!isValidLdap) {
            // Enable enable button
            this.$('.btnOk').removeAttr('disabled');
            this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
              'Both Bind DN and Bind Password are required.');
            return false;
          }
        }
        // Get form values
        formValues = this.getFormValues();
        const adDomain = this.fsSubscriptionModel.getAdDomain();
        if (adDomain) {
          // rfc2307 flag value
          formValues.ad_credentials.rfc2307_enabled =
            this.fsSubscriptionModel.getRFC2307();
        }

        // Return if validation fails
        if (!formValues.isValid) {
          // Enable enable button
          this.$('.btnOk').removeAttr('disabled');

          this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'All fields are required.');
          return false;
        }

        // In case validation is passed i.e. isValid is true, remove this
        // element from object
        delete formValues.isValid;
      }

      let finalPayload = Object.assign({}, payload, formValues);

      // In order retain old data and new data need to create new instance of
      // the model
      let fsSubsModel = new FileServerSubscriptionModel();
      fsSubsModel.set(finalPayload);
      fsSubsModel.getURL();
      fsSubsModel.save(null, {
        success: function(model, response) {

          // Set analytics enable flag as true
          NamespaceManager.set('analytics_enabled_' + fsId, true);

          // Reset meta data scan flag
          NamespaceManager.set('full_status_' + fsId, '');

          // Set the data retention value in the namespace manager
          NamespaceManager.set(fsId, dataRetention);

          // Show client notification message
          NotificationManager.showClientNotification(
            AppConstants.NOTIFY_SUCCESS, 'File Analytics is enabled.');

          // Hide popup
          _this.hide();

          // Show settings and hide disable tag in header
          $('.settingsOptionContainer').show();
          $('.disableTag').hide();

          // Remove notification bar
          $('.notificationBar').remove();

          // Check if the current page is Anomaly
          if (AppUtil.getCurrentPageId() ===
            AppConstants.ANOMALY_PAGE_ID) {
            // Enable configure button on AlertDashboard
            AlertDashboardView.prototype.enableConfigureAlertBtn.call();
          } else if (AppUtil.getCurrentPageId() ===
            AppConstants.HEALTH_PAGE_ID) {
            // If the fileserver is enabled and the health data is stale,
            // it will continue showing the old notification until the page is
            // refreshed or API call is made
            FileAnalyticsEnableUtil.getHealthData();
          }

          // Update the fileserver and it will automatically trigger meta
          // data in task manager
          let appView = NamespaceManager.get(NamespaceManager.APP_VIEW);
          if (appView) {
            appView.headerView.updateFileServer(fsId);
          }
        },
        error: function(model, xhr) {
          // Enable enable button
          _this.$('.btnOk').removeAttr('disabled');
          // Show error detail
          const msg = AppUtil.getErrorMessage(xhr);
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, msg);
        }
      });
    },

    // @private
    // Event handler for select change of username.
    // if password is filled and username is changed from select
    // make the password field empty.
    onChangeUsername: function() {
      const fsProtocol = this.fsSubscriptionModel.getProtocol();
      if (fsProtocol === AppConstants.FS_PROTOCOLS.SMB ||
        fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB) {
        this.$('#adPassword').val('');
      }
    },

    // @private
    // Onkey up event
    onKeyUp: function() {
      this.$('.n-modal-alert-header').hide();
    },

    // @private
    // Event handler for making Bind password active.
    onFocusBindDN() {
      this.$('#bindPassword').removeAttr('disabled');
    },

    // @private
    // Event handler when lost focus of Bind DN input.
    // If there is no value for Bind DN input, disable the Bind password
    // field, otherwise, make the Bind password field active.
    onBlurBindDN(e) {
      if ($.trim($(e.currentTarget).val()).length) {
        return;
      }
      this.$('#bindPassword').val('');
      this.$('#bindPassword').attr('disabled', true);
    }
  });
});
