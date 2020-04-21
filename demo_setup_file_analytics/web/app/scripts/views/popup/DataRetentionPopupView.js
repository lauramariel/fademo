//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// DataRetentionPopupView enables a user to update the data retention period.
//
define([
  // Core classes
  'views/base/BasePopupView',
  //  Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/CommonTemplates',
  // Models/collections
  'models/fileservers/FileServerModel',
  // Managers
  'managers/NotificationManager',
  // Templates
  'text!templates/dataRetention/DataRetentionPopup.html'],
function(
  // Core classes
  BasePopupView,
  // Utils
  AppConstants,
  AppUtil,
  CommonTemplates,
  // Models/collections
  FileServerModel,
  // Managers
  NotificationManager,
  // Templates
  DataRetentionPopup) {

  'use strict';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner> \
    <div class="retention-form"></div> \
    </div>';

  var retentionTemplate = _.template(DataRetentionPopup);

  return BasePopupView.extend({
    name: 'dataRentionPopupView',

    el: '#dataRentionPopupView',

    // Events
    events: {
      'click .modal-header .close:not(.disabled)' : 'hide',
      'click [data-dismiss="alert"]'              : 'clearHeader',
      'click .btnCancel'                          : 'hide',
      'click .btnOk'                              : 'saveOnSubmit'
    },

    // @override
    initialize: function(options) {
      BasePopupView.prototype.initialize.call(this, options);
      this.model = new FileServerModel();
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      let footerButtons = CommonTemplates.CUSTOM_FOOTER_BUTTON({
        jsCancelClass : '',
        jsSaveClass   : '',
        saveBtnText   : AppConstants.BUTTON_TEXT.BTN_UPDATE,
        cancelBtnText : AppConstants.BUTTON_TEXT.BTN_CANCEL
      });

      this.$el.html(this.defaultTemplate({
        title        : this.options.actionRoute.title,
        bodyContent  : viewTemplate,
        footerButtons: footerButtons
      }));
      let dataRetention = AppUtil.getDataRetentionPeriod(
        this.options.actionRoute.fsId);

      this.$('.retention-form').append(retentionTemplate({
        duration : AppConstants.RETENTION_DURATION_LIST,
        durationValues: AppConstants.RETENTION_DURATION_VALUES,
        selectedValue: dataRetention ||
          AppConstants.RETENTION_DURATION_VALUES.LAST_1_YEAR,
        selectedValueInMonths: dataRetention || AppConstants.YEAR_TO_MONTH,
        fsName: $('.selected-file-server').attr('actiontarget')
      }));
    },

    // @private
    // Update the data retention period.
    updateConfiguration: function() {
      const retentionPeriod = this.$('.retentionPeriod').val();

      this.model.set({
        fileserver_uuid: this.options.actionRoute.fsId,
        data_retention_months: retentionPeriod
      });

      this.model.patch(this.model.getURL(), this.model,
        this.onSuccess.bind(this), this.onError.bind(this));
    },

    // Called when API successfully saves the data retention period.
    onSuccess: function(model, response) {
      let retentionPeriod = this.$('.retentionPeriod').val();

      // Setting the value of data retention
      AppUtil.setDataRetentionPeriod(this.options.actionRoute.fsId,
        retentionPeriod);

      // Hide the popup.
      this.hide();

      // Render the page as soon as the data retention period is changed.
      this.updateCurrentPage();

      // Show retention period value according to years/months.
      if (retentionPeriod > 11) {
        // Sample message format - 'Successfully updated retention
        // period to 1 year(s) for the current fileserver.'
        retentionPeriod = (retentionPeriod / 12) + ' year(s)';
      } else {
        // Sample message format - 'Successfully updated retention
        // period to 1 month(s) for the current fileserver.'
        retentionPeriod += ' month(s)';
      }

      // Show notification.
      NotificationManager.showClientNotification(
        AppConstants.NOTIFY_SUCCESS, 'Successfully updated retention \
        period to ' + retentionPeriod + ' for the current fileserver.');
    },

    // Called when API gives error while saving data retention period.
    onError: function(xhr, textStatus, errorThrown) {
      if (xhr.responseJSON) {
        this.showHeaderError(xhr.responseJSON.error);
        return;
      }
      this.showError(xhr, 'Error in updating data');
    },

    // Update the dropdown options in the current page.
    updateCurrentPage: function() {
      AppUtil.navigateToUrl(window.location.hash);
    },

    // @private
    // Shows error on error condition.
    // @param xhr is the error object.
    // @param msg is the error message.
    showError: function(xhr, msg) {
      if (xhr.status === 0) {
        this.showHeaderError(
          'Error in updating fileserver as server is not reachable');
      } else {
        this.showHeaderError(msg);
      }
    },

    // @private
    // Ask for confirmation while saving data retention period.
    showNotificationPopup: function(msg) {
      let _this = this;

      $.nutanixConfirm({
        msg   : msg,
        yes   : function() {
          _this.updateConfiguration();
        },
        yesText: 'Yes',
        noText : 'No',
        class  : '',
        context: _this
      });
    },

    // Functions (Event Handlers)
    //---------------------------

    // @private
    // Handles the click of save button.
    saveOnSubmit: function() {
      let selectedRetentionPeriod = this.$('.retentionPeriod').val();
      let previousRetentionPeriod =
            AppUtil.getDataRetentionPeriod(this.options.actionRoute.fsId);

      if (selectedRetentionPeriod !== previousRetentionPeriod) {
        let message = 'Are you sure you want to change the' +
            ' data retention period?';
        this.showNotificationPopup(message);
      } else {
        this.showHeaderError('Error: Currently selected retention \
          period is same as the \
          previous retention period. Nothing has changed.');
      }
    }
  });
});
