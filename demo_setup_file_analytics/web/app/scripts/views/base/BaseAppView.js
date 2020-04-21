//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// BaseAppView is the global view that holds the navigation, content, modals
// and all other UI components. It also handles the paging, popup creation.
//
define([
  // Core classes
  'jquery',
  'views/base/BaseView',
  'text!templates/pages/AppView.html',
  // Views
  'views/common/Header',
  'views/dashboard/DashboardView',
  'views/search/SearchView',
  'views/anomalyscreen/AlertDashboardView',
  'views/notification/NotificationView',
  'views/fileserver/FileServerEnablePageView',
  'views/health/HealthDashboardView',
  // Models/Collections
  'models/fileservers/FileServerModel',
  'models/fileservers/FileServerSubscriptionModel',
  'models/analytics/PrismModel',
  // Data
  'data/DataProperties',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/SubViewHelper',
  'utils/SVG',
  'utils/CommonTemplates',
  'utils/RoutingURLConstants',
  'utils/FileAnalyticsEnableUtil',
  // Managers
  'managers/PopupManager',
  'managers/NamespaceManager',
  'managers/NotificationManager',
  'managers/IdleManager',
  // Templates
  'text!templates/base/errorTemplate.html'],
function(
  // References of core classes
  $,
  BaseView,
  viewTemplate,
  // Views
  Header,
  DashboardView,
  SearchView,
  AlertDashboardView,
  NotificationView,
  FileServerEnablePageView,
  HealthDashboardView,
  // References of models/collections
  FileServerModel,
  FileServerSubscriptionModel,
  PrismModel,
  // Data
  DataProp,
  // References of utils
  AppConstants,
  AppUtil,
  SubViewHelper,
  SVG,
  CommonTemplates,
  RoutingURLConstants,
  FileAnalyticsEnableUtil,
  // Managers
  PopupManager,
  NamespaceManager,
  NotificationManager,
  IdleManager,
  // Template
  errorTemplate) {

  'use strict';

  // Loading
  var LOADING = `<div class="n-loading app-view-loader">
                  <div class="donut-loader-blue-large"></div>
                    Loading...
                  </div>
                </div>`;

  // The error template.
  var errorTempl = _.template(errorTemplate);

  // Extend the BaseView
  var BaseAppView = BaseView.extend({

    // Constants
    //----------

    name : 'BaseAppView',

    // Properties
    //-----------

    // @inherited
    // Represents the actual DOM element that corresponds to the HTML body
    el: 'body',

    // Represents the actual DOM element of the body of content
    elContent: '#n-content-wrapper',

    // Represents the actual DOM element of the page container
    elPage: '#n-ctr-page',

    // Represents the actual DOM element of the loader container
    elLoader: '.page-loader',

    // @view
    // Contains the Nutanix logo, spotlight,
    // user-info (profile, change password, help, logout)
    headerView: null,

    // Stores the page views
    subViewHelper: null,

    // Boolean - To make sure the file servers are fetched only once.
    fileServerListLoaded: false,

    // Boolean to make sure that the app is rendered only once.
    renderApp: false,

    // Boolean to make sure that the alert is rendered only once.
    renderAlert: false,

    renderNoFSAlert: false,

    // @view
    // Contains the notification system
    notificationView: null,

    // Events Listeners
    //-----------------

    // @override
    events: {
      'click .enableAnalytics' : 'enableFileAnalytics',
      'mouseover'              : 'restartIdleManager',
      'keypress'               : 'restartIdleManager',
      'click .deleteAnalytics' : 'deleteFileAnalyticsData'
    },

    // Functions (Core)
    //-----------------

    // @override
    // Constructor
    initialize: function() {
      // Initialize subViewHelper
      this.subViewHelper = new SubViewHelper();

      this.initializeManagers();

      // Bind 'this' to callback functions
      _.bindAll(this, 'renderPageView');
    },

    // Functions
    //-------------------

    // The starting point of the app.
    renderInit: function() {
      this.render();
      // Reset the download attribute in local storage when the application is
      // loaded for the first time.
      localStorage.setItem('download', '');
    },

    // @override
    // Renders the application's body structure. The structures are:
    // content (pages holder), header, etc.
    render: function() {
      // Set the background color
      // Old body color '#f2f4f6'
      this.$el.css('background-color', '#ffffff');

      // Add the body content
      if (!this.renderApp) {
        this.renderAppView();
      }

      // Add the notification view
      this.notificationView = new NotificationView(
        { el: this.$('#n-ctr-notification') });

      // Add the header.
      this.createHeaderView();

      // Disable header options other than the <username> option
      // 1. till the fetch is complete.
      // 2. even if error occurs as per ENG-255576.
      // 3. if user is on enable page and some error occurs so in order to let
      // the user download the logs, the download log action under the username
      // option should be available.
      // 4. Keep the health page link active for the user to navigate
      $('#n-header *').not('.healthMonitoring, .n-user *')
        .prop('disabled', true);

      // Initialize the idle session manager
      IdleManager.initialize();
    },

    // Render the app view
    renderAppView: function() {
      // Setting the view's template property
      let template = _.template(viewTemplate);

      this.$(this.elContent).append(template);
      this.renderApp = true;
    },

    // NOTE: Meant to be overridden by individual App projects
    // Initialize all managers for the App
    initializeManagers: function(){
      // Actual App View can override to initialize App related Mangers
    },

    // Create the header view
    createHeaderView: function() {
      let fileServerUuid = AppUtil.getParameterByName('fs_id',
        window.location.href);
      let username = this.getUserName();
      this.headerView = new Header({
        el: this.$('#n-header'),
        userName: username,
        fsId: fileServerUuid
      });
    },

    // It is important to get the file server list before loading any view.
    // This function gets the fileserver list.
    // @param pageId - the Id of the page to render.
    // @param options - contains the parameters needed render the page view.
    _showOrLoadPage: function(pageId, options) {
      // const referrerValidated =
      //   AppUtil.isSessionStorageProperty('referrerValidated');
      // const authorizedReferrer =
      //   AppUtil.isSessionStorageProperty('authorizedReferrer');
      // const isExplorer = AppUtil.isIEOrEdge();
      // const isSafari = AppUtil.isSafari();
      // const isLoggedOut = AppUtil.isSessionStorageProperty('isLoggedOut');

      // Commented the session management for Tech Preview
      // if ((!isLoggedOut && (isExplorer || isSafari)) ||
      //   (referrerValidated && authorizedReferrer) ||
      //   (AppUtil.isLocalStorageProperty(
      //   AppConstants.LOCAL_STORAGE.DISABLE_AUTH_VALIDATION) &&
      //   window.location.protocol === 'http:')) {
      //   // Set flag to indicate referrer is not authorized
      //   AppUtil.setSession('authorizedReferrer', true);
      //   // Set flag to indicate referrer validation is done or not
      //   AppUtil.setSession('referrerValidated', true);
      //   // If referrer is validated then fetch file server directly
      this.getFileServers(pageId, options);
      // } else {
        // If referrer is not validated then validate it before
        // file server fetch
      // this.getReferralDetails(pageId, options);
      // }
    },

    // @private
    // Gets the user name if found in the URL or localstorage.
    getUserName: function() {
      // If the URL contains user name
      let user = AppUtil.getUserName(),
          username = AppUtil.isParameterPresent('user_name')
            ? AppUtil.getParameterByName('user_name', window.location.href)
            : user;

      // Add the body content if not already rendered
      if (!this.renderApp) {
        this.renderAppView();
      }

      if (!username) {
        // Hide header
        this.$('#n-header').hide();

        if (!this.renderAlert) {
          $('.page-content').html(errorTempl);
          let options = {
            action : AppConstants.ENTITY_ALERT,
            actionTarget : AppConstants.ENTITY_ALERT,
            actionRouteOverlay : false,
            message   : 'Session time out!'
          };
          this.$('.n-not-found .sub').hide();
          this.$('#n-body-content').css('margin-top', '0');
          PopupManager.handleAction(options);
          this.renderAlert = true;
          // Hide the loader and proceed
          this.$(this.elLoader).hide();
        }
      } else {
        // Set the user name displayed to user name entered in the URL.
        $('.n-username').text(username);

        // Remove user name from the URL.
        AppUtil.removeUserNamefromtheURL(username);

        // Set the user name in the local storage.
        AppUtil.setUserName(username);

        return username;
      }
    },

    // @private
    // Fetch the file servers list
    // @param pageId - the Id of the page whose view is to be rendered.
    // @param options - the options to render the view.
    getFileServers: function(pageId, options) {
      this.options.searchInput = options.searchInput;
      this.options.searchVal = options.searchVal;
      this.options.fsId = options.fsId;

      // If file server list is not already loaded, then fetch it.
      if (!this.fileServerListLoaded || !this.options.fileServerList) {
        this.fileServerListLoaded = true;

        let _this = this, username = this.getUserName(),
            fsModel = new FileServerModel();

        if (username) {
          this.options.username = username;
          fsModel.getURL(username);

          // Show loading until fetch is completed
          this.$(this.elLoader).html(LOADING);
          fsModel.fetch({
            success: function(data) {
              let fileServerList = data.attributes;

              if (Object.keys(fileServerList).length) {
                let fileServer = '', fileServerUuid = '';
                // Set fileserver corresponding values in to
                // NamespaceManager
                fileServerList = _this.setFileServerValues(fileServerList);
                if (Object.keys(fileServerList).length) {
                  fileServer = fileServerList[0].fileserver_name;
                  fileServerUuid = fileServerList[0].fileserver_uuid;
                }
                _this.options.fileServerList = fileServerList;
                _this.options.fileServer = fileServer;
                _this.options.fileServer_uuid = fileServerUuid;
                _this.options.userName = username;

                // Check if file server selected is valid or not
                _this.checkValidFileServer(pageId);
              } else {
                // Fetch file server info in case not in the list to validate
                // and redirect
                _this.fetchFileServerInfo(pageId);
              }

              // Update File Analytics Health Status for the first time after page load
              FileAnalyticsEnableUtil.getHealthData(_this.options);
            },
            error: function(model, xhr) {
              // Hide the loader and proceed
              _this.$(_this.elLoader).hide();
              // If the page requested is health page, then load the page even
              // if error occurs
              if (pageId === AppConstants.HEALTH_PAGE_ID) {
                _this.loadPageView(pageId, _this.options);
              } else {
                // Get Health page data even if fileserver API throws error
                FileAnalyticsEnableUtil.getHealthData(_this.options);
                _this.onDataError(xhr);
              }
            }
          });
        }
      } else if (this.options.fileServerList &&
        Object.keys(this.options.fileServerList).length) {
        // Check if file server selected is valid or not
        this.checkValidFileServer(pageId);
      }
    },

    // @private
    // Set values for the fileserver into NamespaceManager
    setFileServerValues: function(fileServerList) {
      let newFileserverList = {}, i = 0;
      _.each(fileServerList, function(fileserver, key) {
        if (!fileserver.is_fileserver_active &&
          fileserver.data_retention_months === 0) {
          // Remove file server from the list in case file server is not
          // active and data retention is 0
          delete fileServerList[key];
          return;
        } else if (!fileserver.is_fileserver_active) {
          // Append (Deleted) to fileserver name in case its deleted
          fileserver.fileserver_name =
            fileserver.fileserver_name + ' (Deleted)';
        }
        // Create a separate object to maintain keys
        newFileserverList[i] = fileserver;
        NamespaceManager.set(fileserver.fileserver_uuid,
          fileserver.data_retention_months);
        NamespaceManager.set(
          'analytics_enabled_' + fileserver.fileserver_uuid,
          fileserver.is_analytics_active);
        NamespaceManager.set(
          'fileserver_active_' + fileserver.fileserver_uuid,
          fileserver.is_fileserver_active);
        i++;
      });
      return newFileserverList;
    },

    // Check if the file server entered is valid or not and update the
    // view accordingly
    checkValidFileServer: function(pageId) {
      let validFs = this.validateFileServer(this.options, pageId);
      if (validFs) {
        this.options.fsId = validFs;

        // Show nav links
        this.headerView.showNavLinks();

        // Check if fileserver is active
        if (!NamespaceManager.get('fileserver_active_' + validFs)) {
          // If fileserver is deleted show a warning message
          this.showDeletedFileServerMsg();
        } else if (!NamespaceManager.get('analytics_enabled_' + validFs)) {
          // Check if analytics is disabled
          // If file analytics is disabled show a warning message
          this.showEnableNotificationBar();
        } else {
          // If file analytics is enabled hide a warning message
          this.hideNotificationBar();
        }

        // Load the requested page
        this.loadPageView(pageId, this.options);
        // Render the file server dropdown
        this.renderFileServerDropdown(this.options);
        // Update the fileserver, as there is a possibility that fileserver
        // entered during initialization was not correct
        this.headerView.updateFileServer(this.options.fsId);
      }

      // Hide the loader and proceed
      this.$(this.elLoader).hide();
    },

    // @private
    // Checks if the file server uuid in the URL matches with one of those
    // in the fileserver list.
    // @param options - contains the fileserver list.
    validateFileServer: function(options, pageId) {
      let fileServer =
        _.find(options.fileServerList, function(fileserver) {
          return fileserver.fileserver_uuid === options.fsId &&
            !fileserver.is_new;
        });

      if (fileServer) {
        return fileServer.fileserver_uuid;
      } else {
        // Fetch file server info in case not in the list to validate and
        // redirect
        this.fetchFileServerInfo(pageId);
      }
    },

    // @private
    // If fileserver in the url does not match the fileservers in the list,
    // we fetch its info from again from different source.
    fetchFileServerInfo: function(pageId, options) {
      let fsOptions = options || this.options, _this = this;
      // Check username
      if (!fsOptions.userName) {
        fsOptions.userName = this.getUserName();
      }

      // Fetch file server info
      if (fsOptions.userName && fsOptions.fsId) {
        const fsSubscriptionOptions = {
          username : fsOptions.userName,
          fsId : fsOptions.fsId
        };
        let fsSubscriptionModel = new FileServerSubscriptionModel();
        fsSubscriptionModel.getURL(fsSubscriptionOptions);
        fsSubscriptionModel.fetch({
          success: function(data) {
            // Hide the loader and proceed
            _this.$(_this.elLoader).hide();

            // Set file server subscription model to fsOptions in order to
            // pass it to enable page and avoid fetching again
            fsOptions.fsSubscriptionModel = fsSubscriptionModel;

            // Set pageId to FILE_SERVER_ENABLE_PAGE_ID i.e. enable page
            pageId = AppConstants.FILE_SERVER_ENABLE_PAGE_ID;
            _this.loadPageView(pageId, fsOptions);

            // Get page url template
            const enablePageUrlTempl =
              AppUtil.getPageUrlTemplate(pageId, fsSubscriptionOptions);

            // Update the URL for enable page.
            AppUtil.updateUrl(enablePageUrlTempl);


            // Find if the file server uuid already exists in the list or not
            let newFs = null;
            if (fsOptions.fileServerList &&
              Object.keys(fsOptions.fileServerList).length) {
              newFs =
                _.find(fsOptions.fileServerList, function(fileserver) {
                  return fileserver.fileserver_uuid === fsOptions.fsId;
                });
            } else {
              fsOptions.fileServerList = {};
            }

            // Append file server to the dropdown if not present
            if (!newFs) {
              _this.addNewFileserverDropdown(fsOptions);
            }

            // Hide nav links
            _this.headerView.hideNavLinks();
          },
          error: function(model, xhr) {
            // Hide the loader and proceed
            _this.$(_this.elLoader).hide();

            // Check if file server list exisits or not
            if (fsOptions.fileServerList) {
              // If file server list exists, redirect to default fileserver
              _this.selectDefaultFileServer(pageId);
            } else {
              // If there is file server in the list, show no file server
              _this.noFileServerFound();
            }
            // fetch error message from response
            let errorMsg = AppUtil.getErrorMessage(xhr);
            // Check if error message is coming from response
            // if empty then show the error fetching message
            if (!errorMsg) {
              errorMsg = 'Error fetching file server configuration';
            }
            // Show notification
            NotificationManager.showClientNotification(
              AppConstants.NOTIFY_ERROR, errorMsg);
          }
        });
      } else if (fsOptions.fileServerList) {
        // Hide the loader and proceed
        this.$(_this.elLoader).hide();

        // If list exists and there is not file server in the url, select the
        // first file server as the default
        this.selectDefaultFileServer(pageId);
      } else {
        // Hide the loader and proceed
        this.$(_this.elLoader).hide();

        // If there is file server in the list, show no file server
        this.noFileServerFound();
      }
    },

    // @private
    // Append new file server to the file server dropdown, in case of enable
    addNewFileserverDropdown: function(fsOptions) {
      // Update the file server dropdown with the new file server
      let fsLength = 0;
      if (fsOptions.fileServerList) {
        fsLength = Object.keys(fsOptions.fileServerList).length;
      }

      // Need to add is_new flag to distinguish between file server
      // already in the list and a fresh file server, thus will be
      // used to validate file server as well
      fsOptions.fileServerList[fsLength] = {
        fileserver_name:
          fsOptions.fsSubscriptionModel.get(
            fsOptions.fsSubscriptionModel.DP.FILESERVER_NAME) || '',
        fileserver_uuid: fsOptions.fsId,
        is_new: true
      };
      this.renderFileServerDropdown(fsOptions);
    },

    // @private
    // Show error template with the alert saying no file server found.
    noFileServerFound: function() {
      $('.page-content').html(errorTempl);
      let options = {
        action : AppConstants.ENTITY_ALERT,
        actionTarget : AppConstants.ENTITY_ALERT,
        actionRouteOverlay : false,
        message   : 'No file server found!'
      };
      PopupManager.handleAction(options);
    },

    // @private
    // In case of incorrect file server in the url, redirect user to default
    // file server i.e. first file server in the list and to the dashboard page
    // by default
    selectDefaultFileServer: function(pageId, opt) {
      let options = opt || this.options;

      let fsUuid = Object.keys(options.fileServerList) ?
        options.fileServerList[0].fileserver_uuid : '';

      // Default file server is the first file server in the list.
      let validFileServer = options.fileServer_uuid || fsUuid;

      // Update the file server as there is a possibility that the
      // file server passed to the header during initialization
      // could be incorrect.
      this.headerView.updateFileServer(validFileServer);

      // In this case redirect user to default page i.e. dashboard page
      let template = _.template(
        RoutingURLConstants.DEFAULT_DASHBOARD, {
          fileServer: validFileServer
        });
      AppUtil.navigateToUrl(template);

      // Show nav links
      this.headerView.showNavLinks();
    },

    // @private
    // Get fileserver name for the corresponding fileserver uuid
    getFileServerName: function(options) {
      let fsName = null;
      _.each(options.fileServerList, function(fs) {
        if (fs.fileserver_uuid === options.fsId) {
          fsName = fs.fileserver_name;
        }
      });
      return fsName;
    },

    // @private
    // Renders the file server dropdown in the header.
    // @param options - contains the file server list to view.
    renderFileServerDropdown: function(options) {
      let fsName = this.getFileServerName(options);
      $('.file-server-dropdown').html(CommonTemplates.FILESERVER_DROPDOWN({
        SVG: SVG,
        fileServerList: options.fileServerList,
        fileServerId: options.fsId,
        fileServer: fsName
      }));
    },

    // Setup polling for auto update of Health page and Health summary
    // Remove polling of Health page if only summary needs to be updated
    // Remove polling of Health summary when health page is loaded
    setAutoUpdateHealthDetails: function(pageId) {
      // Check if the current page to be loaded is health page
      if (pageId !== AppConstants.HEALTH_PAGE_ID) {
        // Remove polling if set for health page
        if (NamespaceManager.get('healthDataPolling')) {
          clearInterval(NamespaceManager.get('healthDataPolling'));
          NamespaceManager.set('healthDataPolling', null);
        }
        // Setup polling for summary data if not set
        if (!NamespaceManager.get('healthSummaryPolling')) {
          const healthSummaryPolling = setInterval(function() {
            FileAnalyticsEnableUtil.getHealthData();
          }, AppConstants.TASK_POLLING_INTERVAL);
          NamespaceManager.set('healthSummaryPolling', healthSummaryPolling);
        }
        // Clear polling set for summary data if page is Health page
      } else if (NamespaceManager.get('healthSummaryPolling')) {
        clearInterval(NamespaceManager.get('healthSummaryPolling'));
        NamespaceManager.set('healthSummaryPolling', null);
      }

    },

    // Loads the page view.
    // @param pageId - the ID of the page to render.
    // @param options - contains the parameters needed render the page view.
    loadPageView: function(pageId, options) {

      // Setup auto update of health page
      this.setAutoUpdateHealthDetails(pageId);

      // The default fileserver value if file server uuid is not passed in URL.
      let opt = { fileServer : options.fileServer_uuid };

      // If file server uuid is passed in the URL, use that.
      if (options.fsId) {
        opt = { fileServer: options.fsId };
      }

      // Append fileServer to each API call.
      AppUtil.preRequestSetup(opt);

      // Get File Analytics update status
      FileAnalyticsEnableUtil.getfileAnalyticsVMUpdateStatus();

      // Default to load the Dashboard View
      switch (pageId) {
        case AppConstants.DASHBOARD_PAGE_ID:
          this.renderPageView(DashboardView, pageId, options);
          break;
        case AppConstants.SEARCH_PAGE_ID:
          this.renderPageView(SearchView, pageId, options);
          break;
        case AppConstants.ANOMALY_PAGE_ID:
          this.renderPageView(AlertDashboardView, pageId, options);
          break;
        case AppConstants.FILE_SERVER_ENABLE_PAGE_ID:
          this.renderPageView(FileServerEnablePageView, pageId, options);
          break;
        case AppConstants.HEALTH_PAGE_ID:
          this.renderPageView(HealthDashboardView, pageId, options);
          break;
        default:
          this.renderPageView(DashboardView, pageId, options);
      }
    },

    // Changes color on click of a page in the header.
    changeColorOnClick: function(className) {
      $('.n-nav-label').css('color', 'inherit');
      if (className) {
        $('.' + className + ' .n-nav-label').css('color', '#ffffff');
      }
    },

    // Renders the page after require loads the page view with its
    // dependency tree.
    // @param PageViewClass - Page view class
    // @param pageId - ID of the page to view.
    // @param viewOptions - page specific options (optional)
    renderPageView: function(PageViewClass, pageId, pageOptions) {
      $('.n-error').empty();

      let pageView = NamespaceManager.get(NamespaceManager.APP_VIEW)
        .subViewHelper.get(pageId);

      if (pageView) {
        NamespaceManager.get(NamespaceManager.APP_VIEW).subViewHelper
          .remove(pageId);
      }

      // Adding pageId for options as page can not render without pageId
      pageOptions.pageId = pageId;

      // Get the pageUuid by getting the PageViewClass's pageId
      let pageUuid = this.getPageUuid(pageId);

      // Set the page view and uuid.
      pageOptions[DataProp.PAGEUUID] = pageUuid;

      // Pass a blank $el otherwise it takes reference of the place it is called
      // from like Header
      pageOptions.$el = $('<div></div>');

      // Create the page view.
      if (pageId !== AppConstants.NOT_FOUND_PAGE_ID) {
        pageView = new PageViewClass(pageOptions);
      }

      // Register the page view with the subview helper.
      NamespaceManager.get(NamespaceManager.APP_VIEW).subViewHelper
        .register(pageId, pageView);

      switch (pageId) {
        case AppConstants.DASHBOARD_PAGE_ID:
          this.$('#n-ctr-page').append(pageView.render());
          // Highlights the dashboard name when on dashboard page.
          this.changeColorOnClick('db-label');
          break;
        case AppConstants.SEARCH_PAGE_ID:
          this.$('#n-ctr-page').append(pageView.render());
          // Highlights the search text in the header when on search page.
          this.changeColorOnClick('auditTrail');
          break;
        case AppConstants.ANOMALY_PAGE_ID:
          this.$('#n-ctr-page').append(pageView.render());
          // Highlights the anomaly text in the header when on anomaly page.
          this.changeColorOnClick('usageAnomalies');
          break;
        case AppConstants.FILE_SERVER_ENABLE_PAGE_ID:
          this.$('#n-ctr-page').append(pageView.render());
          // Remove Highlights from any other tabs/nav links.
          this.changeColorOnClick();
          break;
        case AppConstants.NOT_FOUND_PAGE_ID:
          // User not autorized to access analytics ui
          this.renderPageNotFound();
          // Remove Highlights from any other tabs/nav links.
          this.changeColorOnClick();
          break;
        default:
          this.$('#n-ctr-page').append(pageView.render());
          // Remove Highlights from any other tabs/nav links.
          this.changeColorOnClick();
      }

      // Hide all the other pages
      $('#n-ctr-page .n-page').hide();
      if (pageId !== AppConstants.NOT_FOUND_PAGE_ID) {
        pageView.show(pageOptions);
      }

      this.setPageUuid(pageId);

      return pageView;
    },

    // Set page id
    setPageUuid: function(pageId) {
      this.currentPageUuid = pageId;
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

    // This is called when mousemove to prevent auto logout to kick in
    restartIdleManager: _.throttle(function(e) {
      if (NamespaceManager.get(NamespaceManager.IDLE_MANAGER)) {
        NamespaceManager.get(NamespaceManager.IDLE_MANAGER).restartTimer();
      }
    }, 1000),

    // @private
    // Get referral url details when analytics ui is opened on the browser for
    // the first time and if user is not coming from authenticated source
    // then redirect it to 404
    getReferralDetails: function(pageId, options) {
      const referrer = document.referrer,
            currentHost = window.location.host.split(':')[0];
      let referrerHostAdd = '', referrerHost = '';
      if (referrer) {
        referrerHostAdd = new URL(document.referrer).host;
        referrerHost = referrerHostAdd.split(':')[0];
      }

      const authorizedReferrer =
        AppUtil.isSessionStorageProperty('authorizedReferrer');
      const referrerValidated =
        AppUtil.isSessionStorageProperty('referrerValidated');
      if ((!authorizedReferrer && !referrerValidated &&
        (!referrer || referrerHost === currentHost)) ||
        (!authorizedReferrer && referrerValidated)) {
        // Set flag to indicate referrer is not authorized
        AppUtil.setSession('authorizedReferrer', false);
        // Set flag to indicate referrer validation is done or not
        AppUtil.setSession('referrerValidated', true);
        // Load page not found in case referrer host is invalid
        this.loadPageNotFound();
      } else if (!authorizedReferrer && !referrerValidated) {
        this.validateReferrerHost(referrerHost, pageId, options);
      }
    },

    // Validate the referrer ip
    validateReferrerHost: function(referrerHost, pageId, options) {
      let _this = this;
      let prismModel = new PrismModel();
      const userName = this.getUserName();
      prismModel.getURL(userName);
      prismModel.set('ip', referrerHost);
      prismModel.save(null, {
        success: function(data) {
          if (!data.get(data.DP.IS_VALID)) {
            // Set flag to indicate referrer is not authorized
            AppUtil.setSession('authorizedReferrer', false);
            // Set flag to indicate referrer validation is done or not
            AppUtil.setSession('referrerValidated', true);
            // Load page not found in case referrer host is invalid
            _this.loadPageNotFound();
          } else {
            // Get file servers
            _this.getFileServers(pageId, options);
            // Set flag to indicate referrer is not authorized
            AppUtil.setSession('authorizedReferrer', true);
            // Set flag to indicate referrer validation is done or not
            AppUtil.setSession('referrerValidated', true);
            const virtualIp = data.get(data.DP.VIRTUAL_IP) || referrerHost;
            AppUtil.setSession('referralUrl', virtualIp);
          }
        },
        error: function(model, xhr) {
          // Set flag to indicate referrer is not authorized
          AppUtil.setSession('authorizedReferrer', false);
          // Set flag to indicate referrer validation is done or not
          AppUtil.setSession('referrerValidated', false);
          // Load page not found in case referrer host is invalid or api failed
          _this.loadPageNotFound();
        }
      });
    },

    // Load page not found
    loadPageNotFound: function() {
      const pageId = AppConstants.PAGE_NOT_FOUND,
            pageClass = AppConstants.NOT_FOUND_PAGE_ID,
            options = [];
      this.renderPageView(pageClass, pageId, options);
    },

    // @private
    // Render error template in case user is not coming from
    // authenticated source
    renderPageNotFound: function() {
      // Add the body content if not already rendered
      if (!this.renderApp) {
        this.renderAppView();
      }

      // Text for authorized access
      const accessDenied = 'You are not authorized to access this page.';

      // Hide header nav link
      if (this.headerView) {
        this.headerView.hideNavLinks();
      }

      // Update body style and content
      this.$('#n-body-content').attr('style', 'margin-top: 0');
      this.$('#n-ctr-page').attr('style', 'background-color: #ffffff');
      this.$('.page-content').html(errorTempl);
      this.$('.n-not-found .main').text(accessDenied);
      this.$('.n-not-found .sub').hide();
      // Hide the loader and proceed
      this.$(this.elLoader).hide();
    },

    // Functions (Notification)
    //-------------------------

    // Shows the notification
    showNotification: function(notificationModel, isTemporary) {
      if (this.notificationView) {
        this.notificationView.showNotification(notificationModel,
          isTemporary);
      }
    },

    // @private
    // Show notification bar in case analytics is disabled for the selected
    // file server
    showEnableNotificationBar: function() {
      // Hide setting option from header
      this.headerView.hideSettings();
      const bannerOptions = {
        parentEl: '#n-ctr-page'
      };
      const msg = 'File Analytics is disabled on the server. \
        <a class="enableAnalytics" \
          action-target-id="' + this.options.fsId + '"> \
        Enable File Analytics</a> \
        to start collecting the data again.';
      NotificationManager.showNotificationBar(msg, 'warning', bannerOptions);

      // Remove margin bottom
      $('.notificationBar .alert').css('margin-bottom', 0);
    },

    // @private
    // Hide notification bar in case analytics is disabled for the selected
    // file server
    hideNotificationBar: function() {
      // Hide setting option from header
      this.headerView.showSettings();

      // Remove any notification on the top
      $('div#n-ctr-page > div.notificationBar').remove();
    },

    // @private
    // Show notification bar in case file server is deleted
    showDeletedFileServerMsg: function() {
      // Hide setting option from header
      this.headerView.hideSettings();
      const bannerOptions = {
        parentEl: '#n-ctr-page'
      };
      const msg = 'File Server is deleted and no longer available. \
        <a class="deleteAnalytics" \
          action-target-id="' + this.options.fsId + '"> \
        Delete Analytics Data</a>';
      NotificationManager.showNotificationBar(msg, 'warning', bannerOptions);

      // Remove margin bottom
      $('.notificationBar .alert').css('margin-bottom', 0);
    },

    // @private
    // Enable file analytics
    enableFileAnalytics: function(e) {
      let linkEl = $(e.currentTarget);
      let fileserverId = linkEl.attr('action-target-id');
      this.headerView.enableFileServer(fileserverId);
    },

    // @private
    // Delete file analytics data for the selected fileserver in case
    // file server is deleted
    deleteFileAnalyticsData: function(e) {
      let linkEl = $(e.currentTarget);
      let fileserverId = linkEl.attr('action-target-id');
      this.confirmDeleteFileAnalyticsData(fileserverId);
    },

    // Delete file analytics data for the selected fileserver
    // confirm box
    confirmDeleteFileAnalyticsData: function(fileServerId) {
      const msg = 'Are you sure you want to delete File Analytics data \
      for the fileserver?';

      $.nutanixConfirm({
        title: '<strong>Delete File Analytics Data?</strong>',
        msg: msg,
        yesText: 'Delete',
        noText: 'Cancel',
        yes: function() {
          this.deleteFileServerData(fileServerId);
        },
        context: this
      });

      // Add red color to Disable button
      $('#nutanixConfirmModal .btnYes').addClass('btn-danger');
    },

    // @private
    // Update the data retention period to 0.
    deleteFileServerData: function(fileServerId) {
      let fsModel = new FileServerModel();
      fsModel.set({
        fileserver_uuid: fileServerId,
        data_retention_months: 0
      });

      fsModel.patch(fsModel.getURL(), fsModel,
        this.onSuccess.bind(this), this.onError.bind(this));
    },

    // Called when API successfully saves the data retention period.
    onSuccess: function(model, response) {
      // Show notification.
      NotificationManager.showClientNotification(
        AppConstants.NOTIFY_SUCCESS, 'File Analytics data for the \
        fileserver will be deleted.');

      // Need to fetch fileserver list again
      this.fileServerListLoaded = false;

      // In this case redirect user to default page i.e. dashboard page
      let template = _.template(
        RoutingURLConstants.DEFAULT_DASHBOARD, {
          fileServer: ''
        });
      AppUtil.navigateToUrl(template);
    },

    // Called when API gives error while saving data retention period.
    onError: function(xhr, textStatus, errorThrown) {
      let errorMsg = 'Error in deleting File Analytics data for the \
        fileserver.';
      if (xhr.responseJSON) {
        errorMsg = xhr.responseJSON.error;
      }

      // Show notification.
      NotificationManager.showClientNotification(AppConstants.NOTIFY_ERROR,
        errorMsg);
    }
  });

  // Returns the BaseAppView class
  return BaseAppView;
});
