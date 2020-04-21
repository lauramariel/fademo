//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AppView instantiates the routing for client-side pages
//
define([
  'jquery',
  // Utils
  'utils/AppUtil',
  'utils/AjaxUtil',
  // Views
  'views/base/BaseAppView',
  'views/base/DataTableTemplates',
  // Managers
  'managers/PopupViewFactory',
  'managers/PopupManager'],
function(
  $,
  // Utils
  AppUtil,
  AjaxUtil,
  // Views
  BaseAppView,
  DataTableTemplates,
  // Managers
  PopupViewFactory,
  PopupManager) {

  var AppView = BaseAppView.extend({

    // @override
    initialize: function(){
      BaseAppView.prototype.initialize.call(this);
    },

    // @override
    // Override to initialize the required *Manager for this AppView
    initializeManagers: function(){
      PopupManager.initialize();
      // Register the popup view factory with the popupManager
      PopupManager.setPopupViewFactory(PopupViewFactory);
    },

    // @private
    // Show error
    onDataError: function(xhr) {
      // Show the error message and details (remove the HTML tags)
      var errorDetails = '';
      // If there is a status code of 0 (meaning unable to connect to
      // server), there is no message so we have to provide our own.
      if (AppUtil.isConnectionError(xhr)) {
        errorDetails = 'Unable to connect to the server.';
        $('#n-header *').prop('disabled', false);
      } else if (AppUtil.isHttp404Error(xhr)) {
        errorDetails = 'Requested resource not available';
      } else {
        errorDetails = (
            AjaxUtil.processAjaxError(xhr.responseText) || '')
              .replace(/(<([^>]+)>)/ig, '');
      }
      $('.page-content').html(DataTableTemplates.ERROR({
        errorDetails :  errorDetails
      }));

      // Render tooltip with error block defined above
      this.showErrorTooltip('bottom');
    }
  });

  return AppView;
});
