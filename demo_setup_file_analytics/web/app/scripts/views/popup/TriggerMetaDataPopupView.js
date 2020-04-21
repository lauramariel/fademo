//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// TriggerMetaDataPopupView enables a user to retrigger the
// metadata collection.
//
define([
  // Core classes
  'views/base/BasePopupView',
  'views/fileserver/metadatacollection/MetaDataShareTableView',
  //  Utils
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/AppUtil',
  // Managers
  'managers/WizardManager',
  // Models
  'models/fileservers/FileServerMetaDataModel'],
function(
  // Core classes
  BasePopupView,
  MetaDataShareTableView,
  // Utils
  AppConstants,
  CommonTemplates,
  AppUtil,
  // Managers
  WizardManager,
  // Models
  FileServerMetaDataModel) {

  'use strict';

  let popupInfo = '*Nested shares, KERBEROS authenticated NFS shares, \
    offline shares and encrypted shares are not supported.';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner> \
    <div class="metadataForm">\
    <section data-ntnx-section="type-text">' + popupInfo + '</section>\
    <div class="tableWrapper meta-data-table \
    n-base-data-table"></div> \
    </div></div>';

  return BasePopupView.extend({
    name: 'popupMetaDataCollection',

    el: '#popupMetaDataCollection',

    // @override
    initialize: function(options) {
      // Add extra events
      this.addExtraEvents({
        'click .btnOk ' : 'saveOnSubmit',
        'click .updateAdLdap' : 'onAdLdapClick'
      });
      BasePopupView.prototype.initialize.call(this, options);
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      let _this = this;

      // Footer buttons template.
      let footerButtons = CommonTemplates.CUSTOM_FOOTER_BUTTON({
        jsCancelClass : '',
        jsSaveClass   : '',
        saveBtnText   : AppConstants.BUTTON_TEXT.BTN_SCAN,
        cancelBtnText : AppConstants.BUTTON_TEXT.BTN_CANCEL
      });

      this.$el.html(this.defaultTemplate({
        title        : this.options.actionRoute.title,
        bodyContent  : viewTemplate,
        footerButtons: footerButtons
      }));

      // Fetch the share information to render in the table.
      this.renderShareTable();
    },

    // @private
    // Render the share list.
    renderShareTable: function(data) {
      // If view already exists, remove it.
      if (this.metaDataShareTableView) {
        this.metaDataShareTableView.remove();
      }

      // Render the table.
      this.metaDataShareTableView = new MetaDataShareTableView({
        parent: this
      });

      // Append the newly initialized datatable
      this.getDOM('.tableWrapper')
        .append(this.metaDataShareTableView.render().el);

      // Start fetch
      this.metaDataShareTableView.onStartServices();

      let _this = this;
      // Clear the interval on click of cancel/close button.
      $('#popupMetaDataCollection .btn.btnCancel,\
        #popupMetaDataCollection .close').on('click', function() {
        clearInterval(_this.metaDataShareTableView.pollingObj);
      });
    },

    // @private
    // Show update AD/LDAP configuration popup
    onAdLdapClick: function() {
      // Stop polling before hiding the popup.
      clearInterval(this.metaDataShareTableView.pollingObj);

      // Close the existing popup.
      this.hide();

      let options = {};
      options.title = AppConstants.POPUP.FILE_SERVER_AD_LDAP_CONFIG;
      options.action = AppConstants.ENTITY_FILE_SERVER_AD_LDAP_CONFIG;
      options.actionTarget = AppConstants.ENTITY_FILE_SERVER_AD_LDAP_CONFIG;
      options.fsId = this.options.actionRoute.fsId;
      WizardManager.handleAction(options);
    },

    // @private
    // Send the input information and trigger the metadata collection.
    saveOnSubmit: function(e) {
      let dataToSend = {};
      if (this.validateData()) {
        // If the data is valide, trigger the metadata collection.
        dataToSend = this.getFormData();
        this.triggerMetaDataCollection(dataToSend);
      }
    },

    // @private
    // Trigger the metadata collection.
    triggerMetaDataCollection: function(data) {
      let metaDataModel = new FileServerMetaDataModel(),
          _this = this;

      metaDataModel.getURL();
      metaDataModel.save(data, {
        success: function() {
          let checkedShares = [];
          // Make the status as 'In Progress for those shares which
          // are selected for scanning, till the time first fetch is done.
          _.each(_this.getCheckedCheckbox(), function(id) {
            _this.$('#' + id).prop('disabled', true);
            _this.$('.parentCheckbox').prop('disabled', true);
            _this.$('#' + id + '-current-status').html(
              AppConstants.METADATA_STATUS_TITLE.running);
            checkedShares.push(id);
          });

          // Set the share uuids in the local storage.
          localStorage.setItem('metadata_scan_' +
            _this.options.actionRoute.fsId, JSON.stringify(checkedShares));

          // Show success notification
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_SUCCESS,
            'File system scan triggered successfully.');

          // Call the fetch API after the trigger request is sent
          // to update the scan status immediately after 3s here.
          setTimeout(function() {
            _this.metaDataShareTableView.fetchModel();
          }, 3000);

          // Fetch API after regular interval till the scan is complete/failed.
          _this.metaDataShareTableView.pollingObj = setInterval(function() {
            _this.metaDataShareTableView.fetchModel();
          }, AppConstants.METADATA_SCAN_INTERVAL);
        },
        error: function(model, xhr) {
          const msg = AppUtil.getErrorMessage(xhr) ||
            'Could not trigger file system scan.';
          // Show error notification
          _this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR, msg);
        }
      });
    },

    // @private
    // Validate the input information.
    validateData: function() {
      let retVal = true;
      // One of the shares should compulsarily be selected
      // to trigger meta data collection.
      let checkedButNotDisabled =
        this.$('.childCheckbox').filter(function() {
          return !this.disabled && this.checked;
        });

      if (checkedButNotDisabled.length === 0) {
        retVal = false;
        this.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
          'Atleast one share should be selected to trigger metadata' +
          ' collection.');
      }

      return retVal;
    },

    // @private
    // Get the data from the form
    getFormData: function() {
      let retVal = {}, postObj = {}, shareUuid = '';

      this.$('tr').each(function(key, val) {
        shareUuid = '';
        if ($(val).find('.childCheckbox').prop('checked') &&
          !$(val).find('.childCheckbox').prop('disabled')) {
          shareUuid = $(val).find('.shareName').attr('actionTarget');
          retVal[shareUuid] = {};
        }
      });
      postObj.file_server_uuid = this.options.actionRoute.fsId;
      postObj.shares_info = retVal;

      return postObj;
    },

    // @private
    // Get the array of the checked checkboxes.
    getCheckedCheckbox: function(e) {
      let checkedArr = [];

      // If it is checked, push all the corresponding IDs of the
      // checkboxes in the array.
      $('.childCheckbox').each(function() {
        if ($(this).prop('checked')) {
          checkedArr.push($(this).attr('id'));
        }
      });

      return checkedArr;
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
    }
  });
});
