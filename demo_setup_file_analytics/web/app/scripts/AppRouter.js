//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AppRouter provides functionalities for routing client-side pages, and
// connecting them to actions and events. It's the main event map of URL.
// Take note that all the main navigational routing is done in the component
//
define([
  'underscore',
  'backbone',
  'utils/AppConstants'],
function(
  _,
  Backbone,
  AppConstants) {

  var AppRouter = Backbone.Router.extend({
    // Properties
    //-----------

    // The view of the whole application.
    appView: null,

    // Routes.
    routes: {
      // Define some URL routes
      'dashboard?*queryString'          : 'showDashboardPage',
      'search?*queryString'             : 'showSearchPage',
      'search'                          : 'showSearchPage',
      'anomaly?*queryString'            : 'showAnomalyPage',
      'anomaly'                         : 'showAnomalyPage',
      'enable?*queryString'             : 'showFileServerEnablePage',
      'health?*queryString'             : 'showHealthPage',
      // Default
      '*actions'                        : 'showDashboardPage'
    },

    // @override
    // Constructor
    initialize: function(options) {
      // Initialize the AppView in the AppRouter
      if (options && options.appView) {
        this.appView = options.appView;
      }
      // Check if AppView has been initialized.
      if (!this.appView) {
        // It should never get here at product.
        // TODO: need a better html for this
        $('body').css('background-color', '#ffffff')
          .html('Missing Application View.');

        throw new Error('Internal Error: Missing Application View');
      }
    },

    // The initial function of building the app view.
    initApp: function() {
      // Kickoff the app.
      this.appView.renderInit();
    },

    // Returns the query parameters in the URL.
    // @param queryString - the query string in the URL.
    getQueryParams: function(queryString) {
      var params = {};
      if (queryString) {
        _.each(
          _.map(queryString.split(/&/g), function(el) {
            var queryParams = el.split('='), parameters = {};
            if (queryParams.length >= 1) {
              var val;
              if (queryParams.length === 2) {
                val = queryParams[1];
              }
              parameters[queryParams[0]] = val;
            }
            return parameters;
          }),
          function(parameters) {
            _.extend(params, parameters);
          }
        );
      }
      return params;
    },

    // Updates the page with the dashboard view.
    // @param queryString - the query string in the URL.
    showDashboardPage: function(queryString) {
      let params = {}, options = {};
      if (queryString) {
        params = this.getQueryParams(queryString);
        options = {
          fsId : params.fs_id
        };
        if (params.user_name) {
          options.userName = params.user_name;
        }
      }
      // Load the page view.
      this.appView._showOrLoadPage(AppConstants.DASHBOARD_PAGE_ID, options);
    },

    // Updates the page with search view.
    // @param queryString - the query string in the URL.
    showSearchPage: function(queryString) {
      let params = {}, options = {};
      if (queryString) {
        params = this.getQueryParams(queryString);
        options = {
          searchInput : params.actionTargetName,
          searchVal   : params.actionTargetValue,
          fsId        : params.fs_id
        };
        if (params.user_name) {
          options.userName = params.user_name;
        }
      }
      // Load the page view.
      this.appView._showOrLoadPage(AppConstants.SEARCH_PAGE_ID, options);
    },

    // Update the page with anomaly view
    // @param queryString - the query string in the URL.
    showAnomalyPage: function(queryString) {
      let params = {}, options = {};
      if (queryString) {
        params = this.getQueryParams(queryString);
        options = {
          fsId : params.fs_id
        };
        if (params.user_name) {
          options.userName = params.user_name;
        }
      }
      // Load the page view.
      this.appView._showOrLoadPage(AppConstants.ANOMALY_PAGE_ID, options);
    },

    // Update the page with enable page view
    // @param queryString - the query string in the URL.
    showFileServerEnablePage: function(queryString) {
      let params = {}, options = {};
      if (queryString) {
        params = this.getQueryParams(queryString);
        options = {
          fsId : params.fs_id
        };
        if (params.user_name) {
          options.userName = params.user_name;
        }
      }
      // Load the page view.
      this.appView._showOrLoadPage(AppConstants.FILE_SERVER_ENABLE_PAGE_ID,
        options);
    },

    // Updates the page with the health dashboard view.
    // @param queryString - the query string in the URL.
    showHealthPage: function(queryString) {
      let params = {}, options = {};
      if (queryString) {
        params = this.getQueryParams(queryString);
        options = {
          fsId : params.fs_id
        };
        if (params.user_name) {
          options.userName = params.user_name;
        }
      }
      // Load the page view.
      this.appView._showOrLoadPage(AppConstants.HEALTH_PAGE_ID, options);
    }
  });

  // Returns the AppRouter class
  return AppRouter;
});
