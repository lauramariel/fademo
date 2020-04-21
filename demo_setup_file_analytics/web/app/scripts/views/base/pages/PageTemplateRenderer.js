//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// PageTemplateRenderer is used by the BasePageView to provide the specified
// page template. This organizes all the page templates to reduce the number
// of created template files.
//
//
define([
  // Default
  'text!templates/pages/common/DefaultPageView.html',
  // Utils
  'utils/AppConstants'],
function(
  // Reference of default page
  defaultPageTemplate,
  // References of utils
  AppConstants) {

  'use strict';

  // Precompiled Templates
  //----------------------

  // Default page template
  var tmplDefault = _.template(defaultPageTemplate);


  // Renderer
  //---------
  var PageTemplateRenderer = {

    // Return the template for the specified pageUuid.
    getPageTemplate: function(pageUuid) {
      var template, subpageMap;

      // NOTE: There could be other page templates in the future.
      // Set the template as the default page template.
      template = tmplDefault;

      // Get the subpage mapping
      subpageMap = this.getSubpageMapping(pageUuid);

      // Form the template string
      return template({ subpageMap : subpageMap });
    },

    // Returns a subpage object map based on the page uuid. Refer to
    // AppConstants.SUBPAGE_<subpage> for the values.
    getSubpageMapping: function(pageUuid) {
      var subpageMap = {};

      // Set the template and supageMap based on the page id.
      switch (this.getPageIdFromPageUuid(pageUuid)) {
        // Home/Landing page
        case AppConstants.HOME_PAGE_ID:
        case AppConstants.FILE_SERVER_ENABLE_PAGE_ID:
          subpageMap = {
            blank : AppConstants.SUBPAGE_BLANK
          };
          break;
        // Dashboard
        case AppConstants.DASHBOARD_PAGE_ID:
          subpageMap = {
            main_dashboard : AppConstants.SUBPAGE_MAIN_DASHBOARD
          };
          break;
        // Search
        case AppConstants.SEARCH_PAGE_ID:
          subpageMap = {
            search : AppConstants.SUBPAGE_SEARCH
          };
          break;
        // Anomaly
        case AppConstants.SUBPAGE_ANOMALY:
          subpageMap = {
            search : AppConstants.SUBPAGE_ANOMALY
          };
          break;
        // Health
        case AppConstants.SUBPAGE_HEALTH:
          subpageMap = {
            health : AppConstants.SUBPAGE_HEALTH
          };
          break;
        // For everything
        default:
          subpageMap = {
            perspective : AppConstants.SUBPAGE_PERSPECTIVE,
            diagram     : AppConstants.SUBPAGE_DIAGRAM,
            table       : AppConstants.SUBPAGE_TABLE,
            detail      : true
          };
      }

      return subpageMap;
    },

    // Return the page id portion from a given page uuid.
    getPageIdFromPageUuid: function(pageUuid) {
      let pageId = '';
      if (_.isString(pageUuid) &&
          pageUuid.indexOf(AppConstants.PAGE_UUID_SEPARATOR) > -1) {
        pageId = pageUuid.substring(0, pageUuid.indexOf(
          AppConstants.PAGE_UUID_SEPARATOR));
      } else {
        pageId = pageUuid;
      }

      return pageId;
    }
  };

  // Returns the PageTemplateRenderer Class
  return PageTemplateRenderer;
});
