//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// SMTPPopupView enables a user to set up SMTP configurations.
//
define([
  // Core classes
  'views/base/BasePopupView',
  // Models
  'models/smtp/SMTPModel',
  //  Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/AppUtil',
  // Managers
  'managers/NotificationManager',
  // Templates
  'text!templates/SMTPPopup.html',
  // Components
  'components/Components'],
function(
  // Core classes
  BasePopupView,
  // Models
  SMTPModel,
  // Utils
  AppConstants,
  CommonTemplates,
  AppUtil,
  // Managers
  NotificationManager,
  // Templates
  smtpPopupTemplate,
  // Components
  Components) {

  'use strict';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner><div class="smtp-form">\
    </div></div>';

  var smtpTemplate = _.template(smtpPopupTemplate);

  // Custom footer button class with the button text
  const customButtons = {
    'btnRemove': AppConstants.BUTTON_TEXT.BTN_REMOVE,
    'btnTest': AppConstants.BUTTON_TEXT.BTN_TEST
  };

  return BasePopupView.extend({
    name: 'popupSmtpServer',

    el: '#popupSmtpServer',

    // Edit action or create action flag
    action: AppConstants.ACTION_CREATE,

    // Flag to check if the config is verified
    verified_flag: false,

    // The tested config
    testedConfiguration: {},

    // The existing configuration
    existingConfiguration: {},

    // Events
    events: {
      'click .modal-header .close:not(.disabled)' : 'hide',
      'click [data-dismiss="alert"]'              : 'clearHeader',
      'click .btnCancel'                          : 'hide',
      'click .btnOk'                              : 'saveOnSubmit',
      'click .btnTest'                            : 'sendEmail',
      'click .btnRemove'                          : 'removeConfig',
      'keypress input'                            : 'onKeyPress',
      'change .inputSecureMode'                   : 'updateSecurityMode'
    },

    initialize: function(options) {
      BasePopupView.prototype.initialize.call(this, options);
      this.model = new SMTPModel();
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      var footerButtons = CommonTemplates.FOOTER_BUTTON({
        jsCancelClass : '',
        jsSaveClass   : ''
      });

      // Iterate through customButton object to get the button class with
      // button text and append custom buttons to footer buttons.
      for (var btnClass in customButtons) {
        footerButtons += CommonTemplates.CUSTOM_BUTTON({
          jsCustomClass: btnClass + ' n-secondary-right-btn pull-left',
          customBtnText: customButtons[btnClass]
        });
      }

      this.$el.html(this.defaultTemplate({
        title        : this.options.actionRoute.title,
        bodyContent  : viewTemplate,
        footerButtons: footerButtons
      }));

      // Append SMTP popup form template
      const tooltipText = 'Required only to test SMTP configuration.';
      this.$('.smtp-form').append(smtpTemplate({
        Components : Components,
        toEmailIdTooltip: tooltipText
      }));

      // Enable tooltip
      this.$('.nutanixMoreInfo').nutanixMoreInfo({
        parseDataAttrs: true,
        placement: 'top'
      });

      // Hide username and password for auth type none by default
      this.updateSecurityMode();

      // Get the existing configuration.
      this.getExistingConfiguration();
    },

    // @private
    // Gets the existing SMTP configuration if any.
    getExistingConfiguration: function() {
      let _this = this;
      this.model.getURL();
      this.model.fetch({
        success: function(data) {
          _this.existingConfiguration = JSON.parse(
            JSON.stringify(data.attributes));
          // Populate the form.
          _this.populateFormValues();
        },
        error: function(model, xhr) {
          let errorMsg = AppUtil.getErrorMessage(xhr);
          // Check if error message is coming from response
          // if empty then show the error fetching message
          if (!errorMsg) {
            errorMsg = 'Error fetching SMTP configuration.';
          }
          _this.$('.btnRemove').hide();
          _this.$('.btnOk ').prop('disabled', false);
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, errorMsg);
        }
      });
    },

    // @private
    // Populates the fields based on the input.
    // @param data is the SMTP configuration.
    populateFormValues: function() {
      let _this = this;
      this.action = AppConstants.ACTION_EDIT;

      if (!Object.keys(this.model.attributes).length) {
        // if no previous configuration is present, hide the remove button
        this.$('.btnRemove').hide();
        this.$('.password-row-description').hide();

        // If no previous configuration is present, action is 'create'.
        this.action = AppConstants.ACTION_CREATE;
      } else if (this.action === AppConstants.ACTION_EDIT) {
        // When the user name is present then only show the text for changing
        // the password.
        if ($.trim(this.$('.inputUsername').val())) {
          this.$('.password-row-description').show();
        }

        // Store the existing email address to verify later.
        this.previousEmail =
          this.model.attributes[this.model.DP.FROM_EMAIL_ID];
        // Store the existing auth type to verify later.
        this.previousAuthType = this.model.get(this.model.DP.SMTP_AUTH);

        // If SMTP host name/IP is present.
        if (this.model.attributes[this.model.DP.SMTP_HOST]) {
          this.$('.smtpHost').val(
            this.model.attributes[this.model.DP.SMTP_HOST]);
        }
        // If SMTP port is present.
        if (this.model.attributes[this.model.DP.SMTP_PORT]) {
          this.$('.smtpPort').val(
            this.model.attributes[this.model.DP.SMTP_PORT]);
        }
        // If SMTP sender's email address is present.
        if (this.model.attributes[this.model.DP.FROM_EMAIL_ID]) {
          this.$('.smtpFromEmailId').val(
            this.model.attributes[this.model.DP.FROM_EMAIL_ID]);
        }
        // If SMTP username is present.
        if (this.model.attributes[this.model.DP.SMTP_USER]) {
          this.$('.inputUsername').val(
            this.model.attributes[this.model.DP.SMTP_USER]);
        }
        // If SMTP auth type is present.
        if (this.model.attributes[this.model.DP.SMTP_AUTH]) {
          this.$('.inputSecureMode')
            .val(this.model.get(this.model.DP.SMTP_AUTH))
            .trigger('change');
        }
      }
    },

    // @private
    // Validates the entered threshold value.
    validatePort: function() {
      let _this = this,
          reg = new RegExp(AppUtil.isNumberRegex),
          validate = false,
          value = this.$('.smtpPort').val();

      if (value) {
        if (reg.test(value) && value > 0) {
          // If value is a number greater than zero.
          validate = true;
        } else if (reg.test(value) && !value > 0) {
          // If value is a number but less than zero.
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Port number should be greater than zero.');
        } else {
          // If value is a string or decimal or anything but not a number.
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Port number should be a (non-negative) integer.');
        }
      } else {
        // If value is not entered.
        _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Port number cannot be empty.');
      }
      return validate;
    },

    // @private
    // Validates the entered username.
    validateUsername: function() {
      const authType = this.getAuthType();
      let validate = false;

      if (authType === 'NONE' ||
        (authType !== 'NONE' && $.trim(this.$('.inputUsername').val()))) {
        validate = true;
      } else {
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please enter username.');
      }

      return validate;
    },

    // @private
    // Validates the entered username.
    validatePassword: function() {
      const authType = this.getAuthType();
      let validate = false;

      if (authType === 'NONE' ||
        (authType !== 'NONE' && $.trim(this.$('.smtpPassword').val()))) {
        validate = true;
      } else {
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please enter password.');
      }

      return validate;
    },

    // @private
    // Validates the IP address or the domain name in the input field.
    validateIPaddress: function() {
      let validate = false;

      if (this.$('.smtpHost').val()) {
        validate = AppUtil.validateIPaddress(
          $.trim(this.$('.smtpHost').val()));

        if (!validate) {
          this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Invalid host name or IP address entered.');
        }
      } else {
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please enter the host name or IP address.');
      }

      return validate;
    },

    // @private
    // Validates the entered Email ID.
    validateFromEmailId: function() {
      let validate = false;

      if ($.trim(this.$('.smtpFromEmailId').val())) {
        validate = AppUtil.validateEmail(
          $.trim(this.$('.smtpFromEmailId').val()));

        if (!validate) {
          this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Invalid from email address entered.');
        }
      } else {
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please enter from email address.');
      }

      return validate;
    },

    // @private
    // Validates the entered email ID.
    validateToEmailId: function() {
      let validate = false;

      if ($.trim(this.$('.smtpToEmailId').val())) {
        validate = AppUtil.validateEmail(
          $.trim(this.$('.smtpToEmailId').val()));

        if (!validate) {
          this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Invalid recipient email address entered.');
        }
      } else {
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please enter recipient email address.');
      }

      return validate;
    },

    // @private
    // Returns the data filled in the form.
    getFormInput: function() {
      if (this.validateIPaddress() && this.validatePort() &&
        this.validateUsername() && this.validateFromEmailId()) {
        // Disable button
        this.$('.btnOk').prop('disabled', true);
        const authType = this.getAuthType();

        // Setting the data in model.
        this.model.clear();
        this.model.set(this.model.DP.SMTP_HOST,
          $.trim(this.$('.smtpHost').val()));
        this.model.set(this.model.DP.SMTP_PORT,
          Number($.trim(this.$('.smtpPort').val())));
        this.model.set(this.model.DP.FROM_EMAIL_ID,
          $.trim(this.$('.smtpFromEmailId').val()));
        this.model.set(this.model.DP.SMTP_AUTH, authType);
        if (authType !== 'NONE') {
          this.model.set(this.model.DP.SMTP_USER,
            $.trim(this.$('.inputUsername').val()));
        }
        return true;
      }
      return false;
    },

    // @private
    // Save the updated configuration.
    saveUpdatedConfiguration: function() {
      // If the configuration that is tested is same as what we are
      // saving then go ahead, else test the changed configuration to test it.
      if (!this.isSameConfig(this.model.attributes, this.testedConfiguration)) {
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please test the configuration before updating it.');
        // Enable the save button. 
        this.$('.btnOk').prop('disabled', false);
        // Set the button text back to "Test".
        this.$('.btnTest').text('Test').prop('disabled', false);
        return;
      }

      let _this = this;
      this.model.isNew(false);
      this.model.patch(this.model.getURL(), this.model.attributes,
        this.onSuccess.bind(this), this.onError.bind(this));
    },

    // Called when API successfully saves the SMTP configuration.
    onSuccess: function(model, response) {
      this.hide();
      NotificationManager.showClientNotification(
        AppConstants.NOTIFY_SUCCESS,
        'SMTP configuration saved successfully!');
    },

    // Called when API gives error while saving SMTP configuration.
    onError: function(xhr, textStatus, errorThrown) {
      this.$('.btnOk').prop('disabled', false);
      const errorMsg = AppUtil.getErrorMessage(xhr) ||
        'Could not save SMTP configuration.';
      this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, errorMsg);
    },

    // @private
    // Update the SMTP configuration.
    updateConfiguration: function() {
      if (!this.getFormInput()) {
        this.$('.btnOk').prop('disabled', false);
        return;
      }

      const authType = this.getAuthType();

      if (authType !== 'NONE') {
        // If auth type is not same.
        if (authType !== this.previousAuthType) {
          if (this.$('.smtpPassword').val()) {
            // If password is not empty, set the password in the model.
            this.model.set(this.model.DP.SMTP_PASSWORD,
              $.trim(this.$('.smtpPassword').val()));
          } else {
            // if password is empty, show alert error message.
            this.$('.btnOk ').prop('disabled', false);
            this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
              'SMTP auth is changed. Please enter password.');
            return;
          }
        } else if (this.$('.smtpPassword').val()) {
          // If password is not empty, set the password in the model.
          this.model.set(this.model.DP.SMTP_PASSWORD,
            $.trim(this.$('.smtpPassword').val()));
        }
      }

      // If both the configs are same and password is kept unchanged too,
      // hide the popup
      // instead of making another API calls
      if (this.isSameConfig(this.model.attributes, this.existingConfiguration)
        && !this.model.get(this.model.DP.SMTP_PASSWORD)) {
        this.hide();
        return;
      }

      if (!this.canSaveConfig()) {
        // Enable the save button. 
        this.$('.btnOk').prop('disabled', false);

        // Show in header that test before save / only verified configuration
        // can be saved
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please test the configuration before updating it.');

        // Set the button text back to "Test".
        this.$('.btnTest').text('Test').prop('disabled', false);
        return;
      }

      this.model.set(this.model.DP.IS_VERIFIED, this.verified_flag);

      this.saveUpdatedConfiguration();
    },

    // @private
    // Check if two configs are same.
    isSameConfig: function(config1, config2) {
      if (Object.keys(config1).length !== 0 &&
        Object.keys(config2).length !== 0) {
        if ((config1[this.model.DP.FROM_EMAIL_ID] ===
          config2[this.model.DP.FROM_EMAIL_ID]) &&
          (config1[this.model.DP.SMTP_AUTH] ===
            config2[this.model.DP.SMTP_AUTH]) &&
          (config1[this.model.DP.SMTP_HOST] ===
            config2[this.model.DP.SMTP_HOST]) &&
          (config1[this.model.DP.SMTP_PORT] ===
            config2[this.model.DP.SMTP_PORT])) {

          if ((config1[this.model.DP.SMTP_AUTH] === 'NONE') ||
            (config1[this.model.DP.SMTP_AUTH] !== 'NONE' &&
            config1[this.model.DP.SMTP_USER] ===
            config2[this.model.DP.SMTP_USER])) {
            return true;
          }
        }
      }
      return false;
    },

    // @private
    // Checks if a config can be saved or no
    canSaveConfig: function() {
      // If config is verified and the tested config is same as the config at
      // the time of save, return true else false
      if (this.verified_flag &&
        this.isSameConfig(this.testedConfiguration, this.model.attributes)) {
        return true;
      }
      return false;
    },

    // @private
    // Save the SMTP configuration.
    saveConfiguration: function() {
      if (!this.getFormInput()) {
        this.$('.btnOk').prop('disabled', false);
        return;
      }

      if (!this.canSaveConfig()) {
        // Enable the save button.
        this.$('.btnOk').prop('disabled', false);

        // Show in header that test before save / only verified configuration
        // can be saved
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please test the configuration before saving it.');

        // Set the button text back to "Test".
        this.$('.btnTest').text('Test').prop('disabled', false);
        return;
      }

      let _this = this;
      this.model.getURL();
      const authType = this.getAuthType();

      this.model.isNew(true);
      if (authType !== 'NONE') {
        this.model.set(this.model.DP.SMTP_PASSWORD,
          $.trim(this.$('.smtpPassword').val()));
      }

      this.model.set(this.model.DP.IS_VERIFIED, this.verified_flag);

      // If no change is made compared to previos configuration, hide
      // the popup without making any API call.
      if (this.isSameConfig(this.model.attributes,
        this.existingConfiguration)) {
        this.hide();
        return;
      }

      this.model.save(null, {
        success: function(model, response) {
          _this.hide();
          NotificationManager.showClientNotification(
            AppConstants.NOTIFY_SUCCESS,
            'SMTP configuration saved successfully!');
        },
        error: function(model, xhr) {
          _this.$('.btnOk ').prop('disabled', false);
          // Check if error message is coming from response
          // if empty then show the error fetching message
          const errorMsg = AppUtil.getErrorMessage(xhr) ||
            'Could not save SMTP configuration.';
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, errorMsg);
        }
      });
    },

    // @private
    // Get auth type selected by user
    getAuthType: function() {
      return $.trim(this.$('.inputSecureMode').val());
    },

    // @private
    // Shows modal alert.
    // @param type is the type of the error message.
    // @param message is the error message to be shown.
    showAlert: function(type, message) {
      this.triggerAction(AppConstants.MODAL.ACT.ALERT_SHOW, {
        type: type,
        message: message
      });
    },

    // Functions (Event Handlers)
    //---------------------------

    // Function called when the user changed the security mode
    // Hide the credentials inputs if the selected
    // security mode is non otherwise show
    updateSecurityMode: function() {
      this.$('.userName, .password').toggle(
        this.getAuthType() !== 'NONE'
      );
      this.triggerAction(AppConstants.MODAL.ACT.AS_REBUILD);
    },

    // @private
    // Handles the click of save button.
    saveOnSubmit: function() {
      if (this.action === AppConstants.ACTION_EDIT) {
        this.updateConfiguration();
      } else {
        this.saveConfiguration();
      }
    },

    // @private
    // Triggers send email button
    sendEmail: function() {
      if (!this.getFormInput() || !this.validateToEmailId()) {
        this.$('.btnOk').prop('disabled', false);
        // If recipient email is not entered or if any other validation failed.
        return;
      }

      // Validate password if auth type is not None, then set the password
      if (this.validatePassword()) {
        this.model.set(this.model.DP.SMTP_PASSWORD,
          $.trim(this.$('.smtpPassword').val()));
      } else {
        this.$('.btnOk').prop('disabled', false);
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Please enter password.');
        return;
      }

      let _this = this;
      this.model.set(this.model.DP.TO_EMAIL_ID,
        $.trim(this.$('.smtpToEmailId').val()));

      // Store the tested config for later
      this.testedConfiguration = JSON.parse(
        JSON.stringify(this.model.attributes));

      this.model.getTestURL();
      this.model.isNew(true);

      // Disable all the form fields and change the btn text to 'Testing...'.
      this.$('#smtpPopupForm :input').prop('disabled', true);
      this.$('.btnTest').text('Testing...').prop('disabled', true);

      this.model.save(this.model.attributes, {
        success: function(model, response) {
          let successMsg = 'Email sent successfully';
          if (response) {
            successMsg = response.status;
          }
          _this.verified_flag = true;

          // Change the button text to 'verified' and enable the disabled
          // form fields.
          _this.$('.btnTest').text('Verified');
          _this.$('#smtpPopupForm :input').prop('disabled', false);

          _this.$('.btnOk ').prop('disabled', false);
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_SUCCESS, successMsg);
        },
        error: function(model, xhr) {
          _this.verified_flag = false;

          // Change the button text to 'Test' again and enable the disabled
          // form fields.
          _this.$('.btnTest').text('Test').prop('disabled', false);
          _this.$('#smtpPopupForm :input').prop('disabled', false);

          let errorMsg = AppUtil.getErrorMessage(xhr);
          // Check if error message is coming from response
          // if empty then show the error fetching message
          if (!errorMsg) {
            errorMsg = 'Could not send test email.';
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, errorMsg);
          _this.$('.btnOk ').prop('disabled', false);
        }
      });
    },

    // @private
    // Opens a dialog box on click of remove button
    // to remove existing config or not.
    removeConfig: function() {
      let _this = this;
      $.nutanixConfirm({
        msg       : 'Clear the current SMTP settings from the server?',
        yesText   : 'OK',
        noText    : 'Cancel',
        defaultNo : true,
        yes       : function() {
          _this.removeConfiguration();
        }
      });
    },

    // @private
    // Removes the existing SMTP configuration.
    removeConfiguration : function() {
      let _this = this;
      this.model.isNew(false);
      this.model.getDeleteURL();
      this.model.destroy({
        success: function(model, response) {
          let successMsg = 'SMTP configuration deleted successfully!';
          if (response) {
            successMsg = response.status;
          }
          // clear the existing form.
          _this.$('input[type=text]').val('');
          _this.$('.inputSecureMode').val('NONE').trigger('change');
          _this.$('.btnRemove').hide();
          _this.action = AppConstants.ACTION_CREATE;
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_SUCCESS, successMsg);
        },
        error: function(model, xhr) {
          let errorMsg = AppUtil.getErrorMessage(xhr);
          // Check if error message is coming from response
          // if empty then show the error fetching message
          if (!errorMsg) {
            errorMsg = 'Could not delete SMTP configuration.';
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, errorMsg);
          _this.$('.btnOk ').prop('disabled', false);
        }
      });
    }
  });
});
