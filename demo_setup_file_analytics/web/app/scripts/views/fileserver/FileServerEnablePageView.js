//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileServerEnablePageView is the page view to enable analytics for the
// selected file server
//
define([
  // Views
  'views/base/pages/BasePageView',
  // Templates
  'text!templates/fileserver/FileServerEnablePageView.html',
  'text!templates/popup/fileserver/FileServerADTemplate.html',
  'text!templates/popup/fileserver/FileServerLDAPTemplate.html',
  // Utils
  'utils/AppUtil',
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/StyleDescriptor',
  'utils/FileAnalyticsEnableUtil',
  // Models/Collections
  'models/fileservers/FileServerSubscriptionModel',
  // Components
  'components/Components',
  // Managers
  'managers/NamespaceManager',
  'managers/NotificationManager'],
function(
  // Views
  BasePageView,
  // Templates
  FileServerEnablePageViewTemplate,
  fileserverADTemplate,
  fileserverLDAPTemplate,
  // Utils
  AppUtil,
  AppConstants,
  CommonTemplates,
  StyleDescriptor,
  FileAnalyticsEnableUtil,
  // Models/Collections
  FileServerSubscriptionModel,
  // Components
  Components,
  // Managers
  NamespaceManager,
  NotificationManager) {

  'use strict';

  var fileServerEnablePageViewTemplate =
    _.template(FileServerEnablePageViewTemplate);
  var fileserverADTempl = _.template(fileserverADTemplate);
  var fileserverLDAPTempl = _.template(fileserverLDAPTemplate);

  // AD inputs as part of enable, should be same as name attribute in form
  const AD_INPUTS = ['domain', 'username', 'password'];

  // LDAP inputs as part of enable, should be same as name attribute in form
  const LDAP_INPUTS = ['server_url', 'base_dn', 'bind_dn', 'bind_password'];


  var FileServerEnablePageView = BasePageView.extend({

    // Properties
    //-----------

    // @inherited
    pageId: AppConstants.FILE_SERVER_ENABLE_PAGE_ID,

    // @inherited
    defaultSubPageId: AppConstants.SUBPAGE_BLANK,

    // Object to hold file server subscription model data
    fsSubscriptionModel: null,

    // @override
    events: {
      'click .btnEnable'        : 'onEnable',
      'keyup input'             : 'onKeyUp',
      'click .alert .close'     : 'onKeyUp',
      'click .btnViewDashboard' : 'onViewDashboardClick',
      'change .userNameOptions' : 'onChangeUsername',
      'focus .bindDN'           : 'onFocusBindDN',
      'blur  .bindDN'           : 'onBlurBindDN'
    },

    // @inherited
    // Overridden to set file server subscription model in
    // options i.e. pageRoute as global variable to be used accross the page
    showSubPage: function(pageRoute) {
      this.fsSubscriptionModel = pageRoute.fsSubscriptionModel;
      BasePageView.prototype.showSubPage.call(this, pageRoute);
    },

    // @inherited
    // Function that handles subpage and data related actions. This is called
    // after all the page render animation is done.
    onShowSubPage: function(subPageId, options) {
      // Remove any notification on the top
      $('div#n-ctr-page > div.notificationBar').remove();

      let fsName = '', retentionOptionList = [], tooltipText = '';
      if (this.fsSubscriptionModel) {
        fsName = this.fsSubscriptionModel.get(
          this.fsSubscriptionModel.DP.FILESERVER_NAME);
      } else {
        // Redirect user back to dashboard page
        this.onEnableSuccess();
        return;
      }

      // File server status template
      const statusTempl = CommonTemplates.OPERATION_CIRCLE({
        backgroundColor: StyleDescriptor.FS.COLORS_MAP.GREEN,
        border: StyleDescriptor.FS.COLORS_MAP.GREEN
      });
      const fsTempl =
        statusTempl + '<span title="File analytics server is running">\
        Running</span>';

      // Get data retention option list
      retentionOptionList =
        FileAnalyticsEnableUtil.getDataRetentionOptionList();

      // Data retention tooltip text
      tooltipText = 'Data retention period refers to the period \
        for which event data is available.';

      // Append page to its default sub page
      let pm = this.$('.n-page-master');
      $(pm).find("[subpage='" + subPageId + "']").html(
        fileServerEnablePageViewTemplate({
          fileServerName: fsName,
          Components : Components,
          dataRetentionOptions: retentionOptionList,
          dataRetentionTooltip: tooltipText,
          fsTempl : fsTempl
        })
      );

      // Hide nav bar links
      this.hideNavLinks();

      // Add form input based on file server protocol
      if (this.fsSubscriptionModel) {
        this.addProtocolInputs();
      }

      // Enable tooltip
      this.$('.nutanixMoreInfo').nutanixMoreInfo({
        parseDataAttrs: true,
        placement: 'top'
      });
    },

    // @private
    // Add protocol inputs to the enable form depending on the file server
    // protocol and prepopulate fields
    addProtocolInputs: function() {
      const fsProtocol = this.fsSubscriptionModel.getProtocol(),
            nfsAuthType = this.fsSubscriptionModel.get(
              this.fsSubscriptionModel.DP.NFS_AUTH_TYPE);
      let adTempl = '', ldapTempl = '', userTempl = '',
          showAdUserTooltip = false;

      if (fsProtocol && fsProtocol !== AppConstants.FS_PROTOCOLS.NONE) {
        let protocolName = fsProtocol;
        if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB &&
            nfsAuthType === AppConstants.FS_AUTH_TYPES.ACTIVE_DIRECTORY) {
          protocolName = 'NFS, SMB';
          showAdUserTooltip = true;
          userTempl = FileAnalyticsEnableUtil.getUserNameTemplate(
            this.fsSubscriptionModel);
        } else if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB ||
          fsProtocol === AppConstants.FS_PROTOCOLS.SMB) {
          protocolName = AppConstants.FS_PROTOCOLS.SMB;
          showAdUserTooltip = true;
          userTempl = FileAnalyticsEnableUtil.getUserNameTemplate(
            this.fsSubscriptionModel);
        }

        // nfs_auth_type is unmanaged or ldap, either is possible for nfs
        // protocol
        if (nfsAuthType === AppConstants.FS_AUTH_TYPES.LDAP) {
          const ldapDetails = this.fsSubscriptionModel.getLdapDetails();
          ldapTempl = fileserverLDAPTempl({
            showTitle: true,
            baseDn : ldapDetails.base_dn || '',
            bindDn : ldapDetails.bind_dn || '',
            serverUrl : ldapDetails.server_url || '',
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
            userName: '',
            titleClass: '',
            showAdUserTooltip: showAdUserTooltip,
            adUserTooltip: adUserTooltip,
            userTempl: userTempl,
            msg: ''
          });

          // Disable Enable button when username is not present or
          // If directory services are not configured, show the
          // warning message.
          if (((fsProtocol === AppConstants.FS_PROTOCOLS.SMB ||
            fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB) &&
            !this.fsSubscriptionModel.getAdminUsers().length) ||
            (!fsProtocol || fsProtocol === AppConstants.FS_PROTOCOLS.NONE)) {
            this.$('.btnEnable').attr('disabled', 'true');
            // If directory services are not configured, show the
            // warning message.
            if (!fsProtocol || fsProtocol === AppConstants.FS_PROTOCOLS.NONE) {
              this.showEnableNotificationBar();
            }
          }
        }
      } else {
        this.$('.btnEnable').attr('disabled', 'true');
        // If directory services are not configured, show the
        // warning message.
        this.showEnableNotificationBar();
      }

      // Append enable form template
      this.$('.dataRetentionContainer').append(adTempl).append(ldapTempl);
    },

    // @private
    // Show notification bar in case directory services are not configured
    // for the selected file server
    showEnableNotificationBar: function() {
      const bannerOptions = {
        parentEl: '#n-ctr-page'
      };
      const msg = `File Server does not have any directory service
        configured. Please configure it to enable File Analytics.`;
      NotificationManager.showNotificationBar(msg, 'warning', bannerOptions);

      // Remove margin bottom
      $('.notificationBar .alert').css('margin-bottom', 0);
    },

    // Functions (Event Handlers)
    //---------------------------

    // @private
    // On click of enable file server button
    onEnable: function() {
      const protocolType = this.fsSubscriptionModel.getProtocol();
      let payload = {}, formValues = {}, _this = this;

      // Show the loader and proceed
      this.showLoading('Saving Configuration');

      // Disable enable button
      this.$('.btnEnable').attr('disabled', 'true');

      // Data retention value
      const dataRetention = this.$('.dataRetentionOptions').val().trim();
      payload.data_retention_months =
        dataRetention || AppConstants.YEAR_TO_MONTH;

      // File server DNS donmain value
      payload.dns_domain_name = this.fsSubscriptionModel.get(
        this.fsSubscriptionModel.DP.DNS_DOMAIN_NAME);
      payload.file_server_uuid = this.fsSubscriptionModel.get(
        this.fsSubscriptionModel.DP.FILESERVER_UUID);

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
            // Hide the loader and proceed
            this.hideLoading();

            // Enable enable button
            this.$('.btnEnable').removeAttr('disabled');
            this.showAlertMsg('Both Bind DN and Bind Password are required.');
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
          // Hide the loader and proceed
          this.hideLoading();

          // Enable enable button
          this.$('.btnEnable').removeAttr('disabled');

          this.showAlertMsg('All fields are required.');
          return false;
        }

        // In case validation is passed i.e. isValid is true, remove this
        // element from object
        delete formValues.isValid;
      }

      let finalPayload = Object.assign({}, payload, formValues);

      let fsSubsModel = new FileServerSubscriptionModel();
      fsSubsModel.set(finalPayload);
      fsSubsModel.getURL();
      fsSubsModel.save(null, {
        success: function(model, response) {
          // Redirect user to dashboard view
          _this.onEnableSuccess();
          _this.hideLoading();
          NotificationManager.showClientNotification(
            AppConstants.NOTIFY_SUCCESS, 'File Analytics is enabled.');
        },
        error: function(model, xhr) {
          // Hide the loader and proceed
          _this.hideLoading();
          // Enable enable button
          _this.$('.btnEnable').prop('disabled', false);
          // Show error detail
          const msg = AppUtil.getErrorMessage(xhr);
          _this.showAlertMsg(msg);
        }
      });

      return false;
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
    // On enable file server success
    // redirect user to default page i.e. dashboard page
    onEnableSuccess: function() {
      const fsId = this.options.fsId || this.fsSubscriptionModel.get(
        this.fsSubscriptionModel.DP.FILESERVER_UUID);

      // Need to set fileServerListLoaded to false so that fileserver api
      // is fetched again and it is updated with latest file server
      let appView = NamespaceManager.get(NamespaceManager.APP_VIEW);
      if (appView.fileServerListLoaded) {
        appView.fileServerListLoaded = false;
      }

      let template =
        AppUtil.getPageUrlTemplate(AppConstants.DASHBOARD_PAGE_ID,
          { 'fsId' : fsId });
      AppUtil.navigateToUrl(template);
      AppUtil.updateUrl(template);
    },

    // @private
    // Show alert message
    showAlertMsg: function(msg) {
      const errorMsg = msg || 'Error enabling File Analytics.';
      this.$('.alertContainer h4').text(errorMsg);
      this.$('.alertContainer').show();
    },

    // @private
    // Onkey up event
    onKeyUp: function() {
      this.$('.alertContainer').hide();
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
    },

    // @private
    // On click of view dashboard, redirect user to the dashboard page for the
    // selected file server
    onViewDashboardClick: function() {
      this.onEnableSuccess();
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
    // Show loading
    showLoading: function(msg) {
      let currentMsg = $('.page-loader').text().trim();
      let displayMsg = msg || 'Loading...';
      $('.page-loader').html(
        $('.page-loader').html().replace(currentMsg, displayMsg)).show();
      $('body').css('overflow', 'hidden');
    },

    // @private
    // Hide loading
    hideLoading: function() {
      $('.page-loader').hide();
      $('body').css('overflow', 'auto');
    },

    // Hide nav links, mainly used in case of enable page - direct access
    hideNavLinks: function() {
      const propertyValue = {
        'opacity': 1,
        'display': 'block'
      };

      // Hide all nav link
      $('.n-navigation').removeClass('-show').addClass('-hide');

      // Show selected links
      $('.n-multi-nav-bar, .n-header-logo, \
        div:has( > .file-server-dropdown ), \
        div:has( > .n-main-menu-btn .n-user )').css(propertyValue);
    }
  });
  // Returns the FileServerEnablePageView class object.
  return FileServerEnablePageView;
});
