//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FSUpdateFileCategoryPopupView gives an option to update file category
// for the selected file server
//
define([
  // Core classes
  'views/base/BasePopupView',
  'views/popup/fileserver/FSUpdateFileCategoryInputTableView',
  // Models
  'collections/dashboard/FileTypeCategoryCollection',
  //  Utils
  'utils/AppUtil',
  'utils/AppConstants',
  'utils/CommonTemplates',
  // Components
  'components/Components',
  // Templates
  'text!templates/popup/fileserver/FSUpdateFileCategoryPopupView.html'],
function(
  // Core classes
  BasePopupView,
  FSUpdateFileCategoryInputTableView,
  // Models
  FileTypeCategoryCollection,
  // Utils
  AppUtil,
  AppConstants,
  CommonTemplates,
  // Components
  Components,
  // Templates
  fsUpdateFileCategoryTemplate) {

  'use strict';

  var fileCategoryTemplate = _.template(fsUpdateFileCategoryTemplate);

  return BasePopupView.extend({
    name: 'fsUpdateFileCategoryPopupView',

    el: '#fsUpdateFileCategoryPopupView',

    // @override
    // Set up the template and title
    render: function() {
      // Prepare footer buttons template
      const footerButtons = CommonTemplates.CUSTOM_BUTTON({
        jsCustomClass : 'btnCancel',
        customBtnText : AppConstants.BUTTON_TEXT.BTN_CANCEL
      });

      // Pass additional attributes to the popup template
      const popupTemplate = fileCategoryTemplate({
        Components: Components
      });

      // Append default template to the el
      this.$el.html(this.defaultTemplate({
        title       : this.options.actionRoute.title,
        bodyContent : popupTemplate,
        footerButtons: footerButtons
      }));

      // Show loading
      this.$('.fileCategoryTable').html(CommonTemplates.LOADING_TEMPLATE);

      // Fetch category data and render table
      this.getFileCategoryData();
    },

    // @privat
    getFileCategoryData: function() {
      const _this = this;

      let fileTypeCategoryCollection = new FileTypeCategoryCollection();
      fileTypeCategoryCollection.getURL();
      const options = {
        type: 'POST',
        data: {},
        success: function(data) {
          _this.addFileCategoryTable(data);
        },
        error: function(model, xhr) {
          const msg = AppUtil.getErrorMessage(xhr) ||
            'Error fetching file type categories.';

          // On error, show error at the top of the popup.
          _this.showHeaderError(msg);
        }
      };
      fileTypeCategoryCollection.fetch(options);
    },

    // @private
    // Adds the file type table to the popup.
    // @param data - the data to be passed to the table.
    addFileCategoryTable: function(data) {
      const dataItems = data.toJSON({ includeAttribute : true,
        includeCustomAttributes: true });
      let fileTypeTableView = new FSUpdateFileCategoryInputTableView({
        dataItems: dataItems,
        entityType: AppConstants.ENTITY_FILE_SERVER,
        parent: this
      });

      this.$('.fileCategoryTable').html(fileTypeTableView.render().el);
    },

    // Overridden to scroll to the alert
    showHeaderSuccess(msg) {
      BasePopupView.prototype.showHeaderSuccess.apply(this, arguments);

      // To scroll to the error message and remove default chrome highlight
      // on focus
      this.$('.alert.alert-success').attr('tabindex', '1').focus()
        .css('outline', 'none');
    },

    // Overridden to scroll to the alert
    showHeaderError(m, error, isHtml) {
      BasePopupView.prototype.showHeaderError.apply(this, arguments);

      // To scroll to the error message and remove default chrome highlight
      // on focus
      this.$('.alert.alert-error').attr('tabindex', '1').focus()
        .css('outline', 'none');
    }
  });
});
