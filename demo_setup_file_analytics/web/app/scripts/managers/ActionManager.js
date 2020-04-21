//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// ActionManager contains routing utility functions
//
define([
  // Utils
  'utils/AppConstants',
  // Data
  'data/DataProperties',
  // Managers
  'managers/NamespaceManager'],
function(
  // Utils
  AppConstants,
  // Data
  DataProp,
  // Managers
  NamespaceManager) {

  'use strict';

  var ActionManager = {

    name : 'ActionManager',

    // Directs to a paticular page.
    // @param pageId - Id of the page to view.
    // @param pageViewClass - the class of the page view to render.
    // @param options - contains the paramaters to render thepage view.
    // @param actionTargetId is the Id of dashboard.
    directToPageView: function(pageId, PageViewClass, options, actionTargetId) {
      $('.n-error').empty();
      let pageView = NamespaceManager.get(NamespaceManager.APP_VIEW)
        .subViewHelper.get(pageId);
      if (pageView) {
        NamespaceManager.get(NamespaceManager.APP_VIEW).subViewHelper
          .remove(pageId);
      }

      // Adding pageId for options as page can not render without pageId
      options.pageId = pageId;

      // Get the pageUuid by getting the PageViewClass's pageId
      let pageUuid = this.getPageUuid(pageId);

      // Set the page view and uuid.
      options[DataProp.PAGEUUID] = pageUuid;

      // Pass a blank $el otherwise it takes reference of the place it is called
      // from like Header
      options.$el = $('<div></div>');

      // Create the page view.
      pageView = new PageViewClass(options);

      // Register the page view with the subview helper.
      NamespaceManager.get(NamespaceManager.APP_VIEW).subViewHelper
        .register(pageId, pageView);

      switch (pageId) {
        case AppConstants.DASHBOARD_PAGE_ID:
          $('#n-ctr-page').append(pageView.render());
          // Render the dashboard.
          pageView.renderDashboard(actionTargetId);
          // Highlights the dashboard name when on dashboard page.
          // $('.n-header-cluster-health.auditTrail .n-nav-label').css('color', 'inherit');
          $('.selected-dashboard').css('color', '#ffffff');
          break;
        case AppConstants.SEARCH_PAGE_ID:
          $('#n-ctr-page').append(pageView.render());
          // Highlights the search text in the header when on search page.
          // $('.selected-dashboard').css('color', 'inherit');
          $('.n-header-cluster-health.auditTrail .n-nav-label').css('color', '#ffffff');
          break;
        default:
          $('#n-ctr-page').append(pageView.render());
      }


      // Hide all the other pages
      $('#n-ctr-page .n-page').hide();
      pageView.show(options);

      this.setPageUuid(pageId);

      return pageView;
    },

    // Return the page uuid.
    // NOTE on page uuid:
    // 1) If page is a common page like Search, dashboard, etc:
    // Page uuid is a concatenation of pageOptions.pageId +
    // AppConstants.PAGE_UUID_SEPARATOR and is needed to
    // uniquely identify pages across clusters.
    getPageUuid: function(pageId) {
      let tailId = AppConstants.TAIL_ID;
      return pageId + AppConstants.PAGE_UUID_SEPARATOR + tailId;
    },

    setPageUuid: function(pageId) {
      this.currentPageUuid = pageId;
    }

  };

  return ActionManager;
});
