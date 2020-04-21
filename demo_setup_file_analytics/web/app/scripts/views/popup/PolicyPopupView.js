//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// PolicyPopupView enables a user to set up alert policy configurations.
//
define([
  // Core classes
  'views/base/BasePopupView',
  'views/anomaly/AnomalyPolicyTableInputView',
  // Models
  'models/anamoly/AnomalyModel',
  'models/fileservers/FileServerModel',
  'models/smtp/SMTPModel',
  //  Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/AppUtil',
  // Managers
  'managers/NotificationManager',
  'managers/PopupManager',
  // Templates
  'text!templates/anomalyPolicy/PolicyPopup.html'],
function(
  // Core classes
  BasePopupView,
  AnomalyPolicyTableInputView,
  // Models
  AnomalyModel,
  FileServerModel,
  SMTPModel,
  // Utils
  AppConstants,
  CommonTemplates,
  AppUtil,
  // Managers
  NotificationManager,
  PopupManager,
  // Templates
  policyPopupTemplate) {

  'use strict';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner> \
    <div class="policyForm"></div> \
    </div>';

  var pageTemplate = _.template(policyPopupTemplate);

  return BasePopupView.extend({

    name: 'popupAlertPolicy',

    el: '#popupAlertPolicy',

    isSmtpVerified: false,

    // Set the configuration count when configurations are listed
    // so as to identify if the length has changed when the popup is closed
    onLoadConfigurationCount: 0,

    // Compare with previous onLoadConfigurationCount and refresh the page
    // if page rendered needs to be changed.
    newConfigurationCount: 0,

    // Events
    events: {
      'click .modal-header .close:not(.disabled)' : 'onCancel',
      'click [data-dismiss="alert"]'              : 'clearHeader',
      'click .btnCancel'                          : 'onCancel',
      'click .btnOk'                              : 'saveOnSubmit',
      'keypress input'                            : 'onKeyPress',
      'click .btnAnomalyAdd'                      : 'handleConfigureClick',
      'click .configureSmtpOption'                : 'configureSMTP',
      'click .anomalyEmailRecipients \
        .link-table-input'                        : 'verifySmtpAndEmail'
    },

    // @override
    initialize: function(options) {
      BasePopupView.prototype.initialize.call(this, options);
      this.model = new AnomalyModel();
      this.smtpModel = new SMTPModel();
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      // Pop up title.
      let title = this.options.actionRoute.title;

      // Footer buttons.
      let footerButtons = CommonTemplates.FOOTER_BUTTON({
        jsCancelClass : '',
        jsSaveClass   : ''
      });

      // Add body and footer buttons.
      this.$el.html(this.defaultTemplate({
        title        : title,
        bodyContent  : viewTemplate,
        footerButtons: footerButtons
      }));

      // Cannot use file server uuid in the options as we dont have
      // mapping between the name and uuid.
      this.$('.policyForm').append(pageTemplate({
        fsName: $('.selected-file-server').attr('actiontarget')
      }));

      // Get the existing data.
      this.getExistingData();
    },

    // @private
    // Adds the anomaly configuration table in the pop up.
    addAnomalyTable: function() {
      // Initialize the configuration counts for comparison when
      // the model is closed
      this.onLoadConfigurationCount = this.newConfigurationCount =
        this.model.attributes.configurations.length;
      let tableInputView = new AnomalyPolicyTableInputView({
        idAttribute       : this.model.DP.ID,
        entityType        : AppConstants.ENTITY_ANOMALY_POLICY,
        ebTableStyle      : true,
        dataItems         : this.model.attributes.configurations,
        parent            : this,
        columns           : [],
        addCaption        : AppConstants.CONFIGURE_ANOMALY
      });

      this.$('.table-wrapper').html(tableInputView.render().el);

      // Reset the rendered table to disable the required fields.
      tableInputView.resetTable();

      // Rebuild the anti-scroll to adjust to the height.
      this._rebuildAntiscroll();
    },

    // @private
    // Renders the table in the pop up on click of add anomaly button.
    handleConfigureClick: function(e) {
      // Hide the add anomaly button.
      this.$('.no-table-wrapper').hide();

      // Show the anomaly configuration table.
      this.$('.table-wrapper').show();

      // Add anomaly table.
      this.addAnomalyTable();

      // Show editable row.
      this.$('a.link-table-input').click();
    },

    // @private
    // Check if the SMTP configuration is verified or no.
    checkSmtpConfigurationAndVerification: function() {
      let _this = this;
      this.smtpModel.getURL();
      this.smtpModel.fetch({
        success: function(data) {
          if (Object.keys(_this.smtpModel.attributes).length) {
            // SMTP is already configured, so verify if it is verified.
            _this.$('.configureSmtpOption').hide();
            _this.isSmtpVerified = true;
          } else {
            // Disable email ID text box
            _this.$('.emailContacts').attr('disabled', true);
            // Show configure SMTP options.
            _this.$('.configureSmtpOption').show();
          }
        },
        error: function(model, xhr) {
          let errorMsg = AppUtil.getErrorMessage(xhr);
          // Check if error message is coming from response
          // if empty then show the error fetching message
          if (!errorMsg) {
            errorMsg = 'Error fetching SMTP configuration.';
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, errorMsg);
        }
      });
    },

    // @private
    // Gets the existing configuration if any.
    getExistingData: function() {
      let _this = this;

      this.model.getURL();

      this.model.fetch({
        success: function(data) {
          if (data.attributes &&
            Object.keys(data.attributes.configurations).length) {
            // If there is any existing data, add the anomaly table.
            // Hide the add anomaly button.
            _this.$('.no-table-wrapper').hide();

            // Show the anomaly configuration table.
            _this.$('.table-wrapper').show();
            _this.addAnomalyTable();
          }

          // Populate the email address text field.
          _this.populateEmailAddress(
            data.attributes.notification_receiver_list);

          // Check if SMTP configuration is verified.
          _this.checkSmtpConfigurationAndVerification();
        },
        error: function() {
          // Show error in the header of the pop up.
          _this.showHeaderError(
            'Could not retrieve existing configuration');
        }
      });
    },

    // @private
    // Auto populate the receivers email address list
    // if configuration is already saved.
    // @param emailList - email address list.
    populateEmailAddress: function(emailList) {
      // If email recipients are already there
      if (emailList) {
        this.$('.emailContacts').val(emailList.join(', '));
      }
    },

    // @private
    // Validates the email address list input.
    validateEmailAddressList: function() {
      let validate = true,
          emailArray = this.getEmailAddressList(), emailId = null;

      _.each(emailArray, function(email) {
        if (validate) {
          emailId = $.trim(email);
          validate = AppUtil.validateEmail(emailId);
        }
      });

      if (!validate) {
        // If invalid email ID is entered.
        this.showHeaderError('You have entered invalid email ID');
        return false;
      }

      return true;
    },

    // @private
    // Ask for confirmation.
    openConfirmationPopup: function(message, actionMethod, paramsArr) {
      $.nutanixConfirm({
        msg: message,
        yes: function() {
          actionMethod(paramsArr);
        },
        context: this
      });
    },

    // @private
    // Gets the list of email address input and convert it into an array.
    getEmailAddressList: function() {
      let emailList = this.$('.emailContacts').val();

      // If email address list exists, trim each email Id and
      // convert into an array.
      if (emailList) {
        return emailList.split(',').map(item => item.trim());
      }
      return [];
    },

    // @private
    // Saves form data on form submission.
    saveOnSubmit: function() {
      // If the email address list is not valid, return.
      if (!this.validateEmailAddressList()) {
        return;
      }

      // If there is some value in the email address field and
      // SMTP configuration is not configured/verified.
      if ((this.$('.emailContacts').length &&
        this.$('.emailContacts').val()) && !this.isSmtpVerified) {
        this.showHeaderError('Please configure/verify SMTP.');
        return;
      }

      let _this = this;
      let fileServerModel = new FileServerModel();
      // Set the recipients list in the model.
      fileServerModel.set(fileServerModel.DP.NOTIFICATION_RECEIVER_LIST,
        this.getEmailAddressList());

      fileServerModel.patch(fileServerModel.getURL(), fileServerModel,
        this.onSuccess.bind(this), this.onError.bind(this));
    },

    // @private
    // Opens a popup for SMTP configuration.
    configureSMTP: function() {
      this.hide();
      let options = {};
      options.title = AppConstants.POPUP.SMTP;
      options.action = AppConstants.ENTITY_SMTP;
      options.actionTarget = AppConstants.ENTITY_SMTP;
      PopupManager.handleAction(options);
    },

    // @private
    // Verify the SMTP/email address
    // Triggers send email button
    verifySmtpAndEmail: function() {
      if (this.$('.emailContacts').length &&
        !this.$('.emailContacts').val()) {
        this.showHeaderError('Please enter the email ID to be verified.');
        return;
      }

      if (!this.validateEmailAddressList()) {
        // If recipient email is not entered or if any other validation failed.
        return;
      }

      let _this = this;
      this.smtpModel.set(this.smtpModel.DP.TO_EMAIL_ID,
        this.getEmailAddressList()[0]);

      this.smtpModel.getTestURL();
      this.smtpModel.isNew(true);
      this.smtpModel.save(this.smtpModel.attributes, {
        success: function(model, response) {
          let successMsg = 'Verification successful. Test email sent!';
          if (response) {
            successMsg = response.status;
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_SUCCESS, successMsg);
        },
        error: function(model, xhr) {
          let errorMsg = AppUtil.getErrorMessage(xhr);
          // Check if error message is coming from response
          // if empty then show the error fetching message
          if (!errorMsg) {
            errorMsg = 'Could not send test email.';
          }
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, errorMsg);
        }
      });
    },

    onSuccess: function(model, response) {
      // Hide the pop up.
      this.hide();
      this.updatePage();
      // Show success notification.
      NotificationManager.showClientNotification(
        AppConstants.NOTIFY_SUCCESS,
        'Successfully defined anomaly rules');
    },

    onError: function(xhr, textStatus, errorThrown) {
      this.showHeaderError('Error in updating data');
    },

    // Validate changes done on anomaly configurations when
    // user clicks cancel on model
    onCancel: function() {
      this.hide();
      this.updatePage();
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

    // Check if configurations have been updated
    // and call page refresh. Render widgets if there
    // are existing configurations or show configureAlertPage
    updatePage: function() {
      const pageUuid = AppUtil.getCurrentPageId();
      // if current page is anomaly page, reload view
      if (pageUuid === AppConstants.ANOMALY_PAGE_ID) {
        // Validate if the configuration length have been updated
        if (this.onLoadConfigurationCount !== this.newConfigurationCount) {
          // If previous count or current length is 0, update the page view
          if (!this.newConfigurationCount || !this.onLoadConfigurationCount) {
            // Update URL for anomaly.
            let anomalyTempl = AppUtil.getPageUrlTemplate(
              pageUuid, this.options.actionRoute);
            AppUtil.navigateToUrl(anomalyTempl);
          }
        }
      }
    }
  });
});
