//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// AboutAFSView displays the details of capacity and current version
//
define([
  // Core classes
  'views/base/BasePopupView',
  // Models
  'models/fileservers/FileServerDetails',
  //  Utils
  'utils/AppUtil',
  'utils/StatsUtil',
  'utils/AppConstants',
  // Templates
  'text!templates/popup/fileserver/FileServerAboutTemplate.html'],
function(
  // Core classes
  BasePopupView,
  // Models
  FileServerDetails,
  // Utils
  AppUtil,
  StatsUtil,
  AppConstants,
  // Templates
  aboutAFSTemplate) {

  'use strict';

  // Page template
  var viewTemplate = '<div data-ntnx-content-inner><div class="about-afs">\
  </div></div>';

  var footerCopyrightTemplate = _.template(
    '<div class="n-product-copyright">\n' +
    '      File Analytics is a product of Nutanix Inc. <br>\n' +
    '      Copyright <span class="lblYear"><%= currentYear %></span>. ' +
    'All rights reserved.\n' +
    '    </div>');

  var capacityTemplate = _.template(
    '<span class="lblCapacityUsed">Files capacity data in ' +
    'File Analytics : <%= capacityValue %></span>');

  var aboutTemplate = _.template(aboutAFSTemplate);

  return BasePopupView.extend({
    name: 'popupVersion',

    model: null,

    el: '#popupVersion',

    LOADING: '<div class="donut-loader-gray" ></div>',

    // Events
    events: {
      'click .btnClose': 'hide',
      'click .modal-header .close': 'hide'
    },

    // @override
    // Set up the buttons and title depending on the action
    render: function() {
      let footerButtons = '<button type="button" class="btnClose ' +
        'btn n-primary-btn" data-dismiss="modal">Close</button>';

      let footerCopyright = footerCopyrightTemplate({
        currentYear: new Date().getFullYear()
      });

      this.$el.html(this.defaultTemplate({
        title: this.options.actionRoute.title,
        bodyContent: viewTemplate,
        footerButtons: footerCopyright + footerButtons
      }));
      this.$('.about-afs').append(aboutTemplate);
      this.$('.n-product-div').append(this.LOADING);
      this.fetchData();

    },

    // @private
    // Fetch details of all file servers total capacity and current version
    fetchData: function() {
      this.model = new FileServerDetails();
      let _this = this;
      // We are overriding the default setup to pass only username
      // and ignore fileServerUuid that gets preset while sending a request.
      let url = this.model.getURL({ username: AppUtil.getUserName() });
      this.model.fetch({
        // to override the ajaxsetup
        beforeSend: function() {
          return true;
        },
        url: url,
        success: function(data) {
          if (data && Object.keys(data).length) {
            _this.displayCapacity();
            _this.displayVersion();
          }
        },
        error: function(data, xhr) {
          _this.showError(xhr);
        }
      });
    },

    // Display current capacity of all fileservers
    displayCapacity: function() {
      let totalCapacity = this.model.getTotalCapacity();
      this.$('.n-product-div').html(capacityTemplate({
        capacityValue: totalCapacity === AppConstants.NOT_AVAILABLE ?
          totalCapacity : StatsUtil.formatBytes(totalCapacity)
      }));
    },

    // Display current version of File analytics
    displayVersion: function() {
      this.$('.lblVersion').html(this.model.getVersion());
    },

    // Show error from baseView, reset el to previously set el for
    // modal so the events bound with popup do not break.
    showError: function(xhr) {
      this.$('.n-product-div').empty();
      this.$('.n-product-version').empty();
      const el = this.el;
      this.$el = $('.n-product-div').parent();
      this.onDataError(xhr);
      this.$el = $(el);
    }
  });
});
