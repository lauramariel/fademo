//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileServerADLDAPConfigWizard initializes the AD / LDAP
// Configuration wizard
//
define([
  // Views and Models
  'views/base/wizards/WizardView',
  'models/fileservers/FileServerModel',
  'models/fileservers/FileServerSubscriptionModel',
  'views/wizard/adldapconfig/ADConfigPage',
  'views/wizard/adldapconfig/LDAPConfigPage',
  'views/wizard/adldapconfig/NoConfigPage',
  'views/wizard/adldapconfig/SummaryPage',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Managers
  'managers/NotificationManager'],
function(
  // Views and Models
  WizardView,
  FileServerModel,
  FileServerSubscriptionModel,
  ADConfigPage,
  LDAPConfigPage,
  NoConfigPage,
  SummaryPage,
  // Utils
  AppConstants,
  AppUtil,
  // Managers
  NotificationManager) {
  'use strict';

  // AD inputs as part of enable, should be same as name attribute in form
  const AD_INPUTS = ['domain', 'username', 'password', 'protocol_type'];

  // LDAP inputs as part of enable, should be same as name attribute in form
  const LDAP_INPUTS = ['server_url', 'base_dn', 'bind_dn', 'bind_password',
    'protocol_type'];

  const AD_CONFIG_PAGE_ID = 'adConfig',
        LOCAL_CONFIG_PAGE_ID = 'localConfig',
        NO_CONFIG_PAGE_ID = 'noConfig',
        LDAP_CONFIG_PAGE_ID = 'ldapConfig',
        SUMMARY_PAGE_ID = 'summary';

  return WizardView.extend({

    name: 'FileServerConfigWizard',

    // Functions
    // ---------

    // @private
    // Handles the click of save button.
    onSave : function() {
      // Disable save button
      this.$('.btnSave').attr('disabled', 'disabled');

      // Update the protocol to appropriate type based on service
      this.updateProtocols();

      // If any configurations are required to be updated show appropriate
      // message
      this.showNotificationPopup('Are you sure you want \
        to update the configuration ?', this.summaryModel);
      return true;
    },

    // @private
    // Gets the file server configuration if any.
    getExistingConfiguration: function() {
      this.model = new FileServerModel();
      const _this = this;
      this.model.getURL();
      this.model.fetch({
        success(data) {
          // Fetch file server info from PRISM
          _this.fetchFileServerInfo();
        },
        error(model, xhr) {
          // Show error detail
          let msg = 'Error fetching file server configuration.';
          if (xhr.responseJSON) {
            msg = xhr.responseJSON.error;
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, msg);
        }
      });
    },

    // @private
    // Fetch file server info from prism
    fetchFileServerInfo: function() {
      const _this = this;

      // Fetch file server info
      this.fsSubscriptionModel = new FileServerSubscriptionModel();
      this.fsSubscriptionModel.getURL();
      this.fsSubscriptionModel.fetch({
        success(data) {
          // Append protocol template
          _this.updateProtocolTemplate();
        },
        error(model, xhr) {
          // Show error detail
          let msg = 'Error fetching file server information.';
          if (xhr.responseJSON) {
            msg = xhr.responseJSON.error;
          }
          // Hide loader
          AppUtil.hideLoader();
          // Show notification.
          NotificationManager.showClientNotification(AppConstants.NOTIFY_ERROR,
            msg);
        }
      });
    },


    // @private
    // Add form based on file server protocol
    updateProtocolTemplate: function() {
      this.setupPages(this.options);
    },

    // @private
    // Get file server info for the selected file server
    // from the list
    getSelectedFileServer() {
      const fsId =
        this.options.fsId || AppUtil.getSelectedFileServer();
      const fileServer = _.find(this.model.toJSON(), function(fileserver) {
        return fileserver.fileserver_uuid === fsId;
      });

      return fileServer;
    },

    // @private
    // Validate if required LDAP fields are entered
    validateLdapForm: function() {
      const bindDn = this.$('#bindDN');
      const bindDnPassword = this.$('#bindPassword');
      let msg = [];

      // Both bindDn and bindPassword should be entered
      if (bindDn.val() && !bindDnPassword.val()) {
        msg.push(bindDnPassword.attr('data-error-label'));
      } else if (!bindDn.val() && bindDnPassword.val()) {
        msg.push(bindDn.attr('data-error-label'));
      }
      return this.displayModalAlert(msg, LDAP_INPUTS,
        ['bind_dn', 'bind_password']);
    },

    // @private
    // Validate if required AD fields are entered
    validateAdForm() {
      let msg = [];
      const username = this.$('.userNameOptions').val() ||
        this.$('#adUsername').val();
      if (!username) {
        const errorLabel =
          this.$('.userNameOptions').attr('data-error-label') ||
          this.$('#adUsername').attr('data-error-label');
        msg.push(errorLabel);
      }
      return this.displayModalAlert(msg, AD_INPUTS, ['username']);
    },

    // Display appropriate error messages based on
    // data-error-label, attribute is used to dynamically push
    // label for errors in msg array.
    displayModalAlert: function(msg, inputs, ignoreValidation) {
      let _this = this;
      $.each(inputs, function(key, value) {
        let component = _this.$('input[name=' + value + ']');
        // if component exists and does not have data ignore validation
        // the data-error-label would be used to display message
        if (component.length && !component.val()) {
          if ($.inArray(value, ignoreValidation) < 0) {
            msg.push(component.attr('data-error-label') ||
            component.attr('name'));
          }
        }
      });

      // Show explicit error when msg length is less than 2
      // else show generic error message
      if (msg.length > 0) {
        const displayMsg = (msg.length < 3) ?
          msg.join(' & ') + ' is required.' :
          'All fields are required';
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          displayMsg);
        return false;
      }
      return true;
    },

    // @private
    // Save the updated configuration.
    saveUpdatedConfiguration: function() {
      this.summaryModel.isNew(false);
      this.summaryModel.patch(this.summaryModel.getURL(),
        this.summaryModel.attributes,
        this.onSuccess.bind(this), this.onError.bind(this));
    },

    // Called when API successfully saves the data retention period.
    onSuccess: function(model, response) {
      this.hide();
      NotificationManager.showClientNotification(
        AppConstants.NOTIFY_SUCCESS,
        'Successfully updated AD/LDAP configuration.');
    },

    // Called when API gives error while saving data retention period.
    onError: function(xhr, textStatus, errorThrown) {
      // Show error detail
      let msg = 'Error in updating AD/LDAP configuration.';
      if (xhr.responseJSON) {
        msg = xhr.responseJSON.error;
      }
      this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, msg);
    },

    // @private
    // Shows modal alert.
    // @param type is the type of the error message.
    // @param message is the error message to be shown.
    showAlert: function(type, message) {
      this.triggerAction(AppConstants.MODAL.ACT.ALERT_SHOW, {
        type,
        message
      });
      this.$('.btnSave').removeAttr('disabled');
    },

    // @override
    // Override to add additional events
    show: function(options) {
      AppUtil.showLoader();
      this.options = options;
      this.getExistingConfiguration();
    },

    // Setup pages to render on wizard based on the
    // protocol types and auth type
    setupPages: function(options) {
      AppUtil.hideLoader();
      const fsProtocol = this.fsSubscriptionModel.getProtocol(),
            nfsAuthType = this.fsSubscriptionModel.get(
              this.fsSubscriptionModel.DP.NFS_AUTH_TYPE);

      const pages = [];
      let showSaveBtn = false;

      // Set active fileserver in the model to compare and persist
      const fileserver = this.getSelectedFileServer();
      this.fileserverModel = new FileServerModel();
      this.fileserverModel.set(fileserver);
      const models = [this.fileserverModel, this.fsSubscriptionModel];
      this.summaryModel = new FileServerModel();

      if (fsProtocol &&
        fsProtocol !== AppConstants.FS_PROTOCOLS.NONE) {
        // AD can be for nfs or smb or both, check if AD is configured on PRISM
        if (this.fsSubscriptionModel.getAdDomain()) {
          pages.push({
            id: AD_CONFIG_PAGE_ID,
            title: 'AD Configuration',
            klass: ADConfigPage,
            model: models
          });
        }

        // check if LDAP is configured on PRISM and set into current model
        // if its empty
        if (nfsAuthType === AppConstants.FS_AUTH_TYPES.LDAP) {
          pages.push({
            id: LDAP_CONFIG_PAGE_ID,
            title: 'LDAP Configuration',
            klass: LDAPConfigPage,
            model: models
          });

        // If protocol is NFS but unmanaged, no form to be displayed
        } else if ((fsProtocol === AppConstants.FS_PROTOCOLS.NFS ||
          fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB) &&
          nfsAuthType === AppConstants.FS_AUTH_TYPES.UNMANAGED) {
          if (!this.fileserverModel.getLocalDetails()) {
            this.setLocalSubscription();
            showSaveBtn = true;
          }
          pages.push({
            id: LOCAL_CONFIG_PAGE_ID,
            title: 'NFS Configuration',
            klass: NoConfigPage,
            model: [showSaveBtn, this.fsSubscriptionModel]
          });
        }

        // Show summary page
        pages.push({
          id: SUMMARY_PAGE_ID,
          title: 'Summary',
          klass: SummaryPage,
          model: this.summaryModel
        });

      // Show No configuration page with appropriate message
      } else {
        if (this.fileserverModel.getLocalDetails() ||
          this.fileserverModel.getLdapDetails() ||
          this.fileserverModel.getAdDetails()) {
          showSaveBtn = true;
        }
        pages.push({
          id: NO_CONFIG_PAGE_ID,
          title: 'Configuration',
          klass: NoConfigPage,
          model: [showSaveBtn, this.fsSubscriptionModel]
        });
      }

      this.initializeWizard({
        title: options.title,
        wizardType: WizardView.WIZARD_TYPES.LINEAR,
        pages,
        type: options.type
      });

      this.$el.addClass('wizardviewfileserver adldap-wizard');

      WizardView.prototype.show.apply(this, arguments);

      // If no configurations are to be updated, hide save btn
      if (pages.length <= 1 && !showSaveBtn) {
        this.$('.btnSave').hide();
      }
    },

    // @private
    // Ask for confirmation while saving data retention period.
    showNotificationPopup(msg) {
      const _this = this;

      $.nutanixConfirm({
        msg,
        yes() {
          _this.saveUpdatedConfiguration();
        },
        no() {
          _this.$('.btnSave').removeAttr('disabled');
        },
        yesText: 'Yes',
        noText: 'No',
        class: '',
        context: _this
      });
    },

    // Setup Local in current model from file subscription model
    setLocalSubscription() {
      const local = {
        protocol_type: AppConstants.FS_PROTOCOLS.NFS
      };
      this.summaryModel.setLocalDetails(local);
    },

    // @override
    // Remove the tooltips then call super
    onNext(e) {
      const currentPageId = this._getCurrentPageId();
      const pages = this.wizardConfiguration.pages.length;
      if (currentPageId === LDAP_CONFIG_PAGE_ID) {
        if (this.validateAndSaveLdap()) {
          // If LDAP and AD both are configured but none are
          // updated, do not allow user to proceed
          if (pages > 2 && (this.summaryModel.getAdDetails() ||
            this.summaryModel.getLdapDetails())) {
            WizardView.prototype.onNext.apply(this, arguments);
            return true;
            // Do not allow next if LDAP is the only configuration
            // but nothing has been updated in it
          } else if (this.summaryModel.getLdapDetails()) {
            WizardView.prototype.onNext.apply(this, arguments);
            return true;
          }
          this.restrictNextAccess();
        }
      } else if (currentPageId === AD_CONFIG_PAGE_ID) {
        if (this.validateAndSaveAd()) {
          // If AD and LDAP both are configured, allow user to go
          // to next page
          if (pages > 2) {
            WizardView.prototype.onNext.apply(this, arguments);
            return true;
            // If Ad is the only configuration, do not allow user
            // to proceed unless configurations are updated
          } else if (this.summaryModel.getAdDetails()) {
            WizardView.prototype.onNext.apply(this, arguments);
            return true;
          }
          this.restrictNextAccess();
        }
      } else if (currentPageId === LOCAL_CONFIG_PAGE_ID) {
        if (pages > 2 && (this.summaryModel.getAdDetails() ||
          this.summaryModel.getLocalDetails())) {
          WizardView.prototype.onNext.apply(this, arguments);
          return true;
        } else if (this.summaryModel.getLocalDetails()) {
          WizardView.prototype.onNext.apply(this, arguments);
          return true;
        }
        this.restrictNextAccess();

      } else {
        WizardView.prototype.onNext.apply(this, arguments);
        return true;
      }

    },

    // Show an alert to restrict user to move next
    restrictNextAccess: function() {
      this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
        'Nothing to update');
    },

    // Validate if LDAP configurations have been updated
    validateAndSaveLdap: function() {
      let formValues = this.$('.ldapContainer *')
        .serializeArray();

      const ldap = this.setPayload(formValues, LDAP_INPUTS,
        AppConstants.FS_PROTOCOLS.NFS);
      const compareWith = this.fileserverModel.getLdapDetails() ||
        this.fsSubscriptionModel.getLdapDetails();
      // if previous configurations do not have LDAP in it, force update
      // LDAP credentials
      const forceUpdate = !this.fileserverModel.getLdapDetails();
      if (forceUpdate || this.isLDAPUpdated(ldap, compareWith)) {
        const isValid = this.validateLdapForm();
        if (!isValid) {
          return isValid;
        }
        this.summaryModel.setLdapDetails(ldap);
      } else {
        this.summaryModel.unsetService(
          this.summaryModel.DP.directory_services.LDAP);
      }
      return true;
    },

    // validate if AD configurations have been updated
    validateAndSaveAd: function() {
      let formValues = this.$('.adContainer *')
        .serializeArray();

      // AD is configured with NFS and SMB set protocol as NFS_SMB
      // else set it as SMB
      let fsProtocol = this.fsSubscriptionModel.getProtocol();
      const nfsAuthType = this.fsSubscriptionModel.get(
        this.fsSubscriptionModel.DP.NFS_AUTH_TYPE);
      if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB &&
        nfsAuthType === AppConstants.FS_AUTH_TYPES.ACTIVE_DIRECTORY) {
        fsProtocol = AppConstants.FS_PROTOCOLS.NFS_SMB;
      } else if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB) {
        fsProtocol = AppConstants.FS_PROTOCOLS.SMB;
      }

      const ad = this.setPayload(formValues, AD_INPUTS, fsProtocol);
      ad.username = this.$('.userNameOptions').val() ||
        this.$('#adUsername').val();
      // rfc2307 flag value
      const rfc2307Flag = this.fsSubscriptionModel.getRFC2307();
      if (typeof rfc2307Flag !== 'undefined') {
        ad.rfc2307_enabled = rfc2307Flag;
      }
      const compareWith = this.fileserverModel.getAdDetails() ||
        this.fsSubscriptionModel.getAdDetails();
      // if previous configurations do not have AD in it, force update
      // AD credentials
      const forceUpdate = !this.fileserverModel.getAdDetails();
      if (forceUpdate || this.isADUpdated(ad, compareWith)) {
        const isValid = this.validateAdForm();
        if (!isValid) {
          return isValid;
        }

        this.summaryModel.setAdDetails(ad);
      } else {
        this.summaryModel.unsetService(
          this.summaryModel.DP.directory_services.AD);
      }
      return true;
    },

    // Compare LDAP form values with model
    isLDAPUpdated: function(formValues, compareWith) {
      let isFormUpdated = false;
      $.each(LDAP_INPUTS, function(key, value) {
        if (value !== 'bind_password') {
          const compareTo = compareWith[value] || '';
          if (formValues[value] !== compareTo) {
            isFormUpdated = true;
          }
        } else {
          // update model if password is set
          if (formValues[value]) {
            isFormUpdated = true;
          }
        }
      });
      return isFormUpdated;
    },

    // Compare AD form values with model
    isADUpdated: function(formValues, compareWith) {
      let isFormUpdated = false;
      $.each(AD_INPUTS, function(key, value) {
        if (value !== 'password') {
          const compareTo = compareWith[value] || '';
          if (formValues[value] !== compareTo) {
            isFormUpdated = true;
          }
        } else {
          // update model if password is set
          if (formValues[value]) {
            isFormUpdated = true;
          }
        }
      });
      return isFormUpdated;
    },

    // set payload for inputs, set protocol explicitly as passed
    // from parameter
    setPayload: function(formValues, INPUTS, protocol) {
      // Format the form values and validate if none of the value is blank
      let config = {};
      formValues.forEach(function(formVal, i) {
        // Form based on attribute 'name'
        if (INPUTS.includes(formVal.name)) {
          config[formVal.name] = formVal.value.trim();
        }
      });
      config.protocol_type = protocol;
      return config;
    },

    updateProtocols: function() {
      const fsProtocol = this.fsSubscriptionModel.getProtocol(),
            nfsAuthType = this.fsSubscriptionModel.get(
              this.fsSubscriptionModel.DP.NFS_AUTH_TYPE);
      let clearLocal = false,
          clearAD = false,
          clearLDAP = false;

      // If protocol exists, update the protocol in directory service
      // as per configuration
      if (fsProtocol) {
        // clear LDAP if Unmanaged auth type is set
        if (nfsAuthType === AppConstants.FS_AUTH_TYPES.UNMANAGED) {
          clearLDAP = true;
        }

        // clear Local if LDAP auth type is set
        if (nfsAuthType === AppConstants.FS_AUTH_TYPES.LDAP) {
          clearLocal = true;
        }

        // Clear Local and LDAP if auth type is AD
        if ((fsProtocol === AppConstants.FS_PROTOCOLS.NFS_SMB ||
          fsProtocol === AppConstants.FS_PROTOCOLS.NFS) &&
          nfsAuthType === AppConstants.FS_AUTH_TYPES.ACTIVE_DIRECTORY
        ) {
          clearLDAP = true;
          clearLocal = true;
        }

        // Clear AD if NFS is setup but not AD auth type
        if (fsProtocol === AppConstants.FS_PROTOCOLS.NFS &&
          nfsAuthType !== AppConstants.FS_AUTH_TYPES.ACTIVE_DIRECTORY) {
          clearAD = true;
        }

        // Clear LDAP and Local if SMB protocol is set
        if (fsProtocol === AppConstants.FS_PROTOCOLS.SMB) {
          clearLDAP = true;
          clearLocal = true;
        }
      } else {
        clearAD = clearLDAP = clearLocal = true;
      }

      // Clear AD details from ES
      if (clearAD && this.fileserverModel.getAdDetails()) {
        this.summaryModel.setAdDetails(null);
      }

      // Clear LDAP details from ES
      if (clearLDAP && this.fileserverModel.getLdapDetails()) {
        this.summaryModel.setLdapDetails(null);
      }

      // Clear Local details from ES
      if (clearLocal && this.fileserverModel.getLocalDetails()) {
        this.summaryModel.setLocalDetails(null);
      }
    }
  });
});
