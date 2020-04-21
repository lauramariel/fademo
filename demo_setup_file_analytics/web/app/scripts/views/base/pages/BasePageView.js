//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// BasePageView is the parent class of all pages (e.g. Dashboard, Filesearch, etc). It
// has the functions that handles data rendering, screen transition animations,
// and other default page actions. This is meant to standardize page views.
//
// The components that are automatically generated:
// - page template
// - page action button group
//
define([
  // Core
  'views/base/BaseView',
  'views/base/pages/PageTemplateRenderer',
  // Utils
  'utils/SubViewHelper',
  'utils/LogUtil',
  'utils/AppConstants',
  // Data
  'data/DataProperties'],
function(
  // References of core
  BaseView,
  PageTemplateRenderer,
  // References of utils
  SubViewHelper,
  LogUtil,
  AppConstants,
  // Data
  DataProp) {

  'use strict';

  // Extending the BaseView
  var BasePageView = BaseView.extend({

    // Page Uuid passed in from AppView which is the following concatenation:
    // 1) If page is common page like Search, Dashboard, etc):
    //    pageId + AppConstants.PAGE_UUID_SEPARATOR + clusterId
    pageUuid: null,

    // Page id based on AppConstants
    pageId: null,

    // When there's no new subpage and currentSubPageId are identified,
    // this is used as the subpage value.
    defaultSubPageId: null,

    // The current selected sub page id
    currentSubPageId: null,

    // Subview Helper
    subViewHelper: null,

    // Set to false if you don't want to set the subpage and detail mapping
    // from the PageTemplateRenderer. Default is true.
    usePageTemplateRenderer: true,

    // The current page option parameter string from the page route
    currentOptions: null,

    // Private page loader since global loader is hidden when fileserver
    // validation is completed giving the user empty page until configuration
    // api response is received.
    LOADING: `<div class="n-loading app-view-loader pageLoader">
                <div class="donut-loader-blue-large"></div>
                  Loading...
                </div>
              </div>`,

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initialize: function(options) {
      if (options && options[DataProp.PAGEUUID]) {
        this.setPageUuid(options[DataProp.PAGEUUID]);
      } else {
        throw new Error('BasePageView: Unable to instantiate page without' +
          ' a pageUuid.');
      }

      this.eventBus = _.extend({}, Backbone.Events);

      // If $el is given to render page in the given element
      if (options.$el) {
        this.$el = options.$el;
      }

      // Check if page with same pageId already exists
      // incase of dashboard change
      if ($('.n-page.page-' + this.pageId).length) {
        this.$el = $('.n-page.page-' + this.pageId);
      } else {
        this.$el.addClass('n-page page-' + this.pageId);
      }
    },

    // @override
    // Called by the parent class to render the components of the page
    // Returns the $el property so its parent can add it to its parent's
    // body content.
    render: function() {
      // Set the id
      this.$el.attr('id', this.pageUuid);

      // Create the page template
      if (this.usePageTemplateRenderer) {
        this.template = PageTemplateRenderer.getPageTemplate(
          this.pageUuid);
      } else {
        this.template = '';
      }

      // Add the template to the $el
      this.$el.html(this.template);

      // Initialize subViewHelper
      this.subViewHelper = new SubViewHelper();

      // Return the page so the parent class can add it to its own body
      return this.$el;
    },

    // Set the page uuid.
    setPageUuid: function(pageUuid) {
      this.pageUuid = pageUuid;
    },

    // Shows the page with animation and updates the content based on the
    // pageRoute which includes: "subPageId" and "options".
    show: function(pageRoute) {
      // NOTE: If you want to add animation transition, do it here. Then
      // call this.showSubPage after the animation event is done.
      this.$el.show();

      // Start showing the subpage based on the route.
      this.showSubPage(pageRoute);
    },

    // Hides the page and stops all services of the page
    hide: function() {
      // this.stopServices();
      this.$el.hide();
      // this.onHideSubPage();
    },

    // Makes sure that all the view rendering is correct when the subpage
    // has been updated. After that, it calls the function handler,
    // 'onShowSubPage' that will manage page-data related actions.
    showSubPage: function(pageRoute) {
      // (1) Visualization
      // -----------------

      // Set the variables
      var subPageId = pageRoute.subPageId,
          options = pageRoute.options;

      // Make sure there's a subpage value and it's not undefined.
      subPageId = subPageId || this.defaultSubPageId;

      // Update the selected subpage view by hiding first the current subpage
      var pm = this.$('.n-page-master');
      if (this.currentSubPageId !== subPageId && this.currentSubPageView) {
        $(pm).find("[subpage='" + this.currentSubPageId + "']").hide();
      }

      // NOTE: If you want to add a transition, do it here.
      // Then show the newly selected subpage
      $(pm).find("[subpage='" + subPageId + "']").show();

      // Replace the currentSubPageView
      this.currentSubPageView = $(pm).find("[subpage='" + subPageId + "']");

      // Hide page nav as we dont need it for now
      this.$('.n-page-nav').hide();

      // (2) Page and Data related purposes
      // ----------------------------------

      // Update the body style based on the subPageId. We have to call this
      // first before starting the services because of rendering style timing
      this.updateBodyStyle(subPageId);

      this.currentSubPageId = subPageId;

      // Show the details if active subpage is diagram or table, otherwise,
      // hide the details.
      switch (subPageId) {
        case AppConstants.SUBPAGE_TABLE:
        case AppConstants.SUBPAGE_SEARCH:
        case AppConstants.SUBPAGE_MAIN_DASHBOARD:
        case AppConstants.SUBPAGE_BLANK:
          this.getDetailsElement().show();
          // If the options was changed, call the event function handler to
          // change the details
          // Only check for changing details on DIAGRAM and TABLE subpages.
          if (this.currentOptions !== options) {
            this.onChangeDetailsPane(options);
            // Update the current options
            this.currentOptions = options;
          }
          break;
        default:
          this.getDetailsElement().hide();
      }

      // Show the subpage
      this.onShowSubPage(subPageId, options);

      // Now that the page is being shown, start services. When the page is
      // is hidden by calling this.hide(), stopServices is called.
      // this.startServices();

      LogUtil.debug('BasePageView : pageUuid: ' + this.pageUuid +
        '\t subPageId: ' + this.currentSubPageId +
        '\t options: ' + options);
    },

    // Called when the subpage is updated to modify the body style. This
    // updates the nav body style by removing the previous class names that
    // starts with nav_* first. But preserve other class names added by the
    // customized page.
    updateBodyStyle: function(subPageId) {
      var bodyClassName = $('body')[0].className.replace(/\bnav_.*?\b/g, '');
      $('body')
        .attr('class', bodyClassName)
        .addClass('nav_' + this.pageId)
        .addClass('nav_' + subPageId);
    },

    // Hide Page loader
    hideLoader: function() {
      this.$el.find('.pageLoader').hide();
    },

    // Functions (Details)
    //--------------------

    // Returns the details component view
    getDetailsElement: function() {
      return this.$('.n-page-detail');
    },

    // Functions (Event handlers)
    //---------------------------

    // @must-be-overridden
    // Handles details pane data updates and rendering.
    onChangeDetailsPane: function(options) {
    },

    // @must-be-overridden
    // Called when a subpage is to be shown after all animation is done.
    onShowSubPage: function(subPageId, options) {
      // to be overridden in all page
    },

    // @must-be-overridden
    // Called when the subpage gets hidden.
    onHideSubPage: function() {
      // to be overridden in all page if required
    }
  });

  // Returns the BasePageView Class
  return BasePageView;
});
