//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AppUtil contains common utility functions
//
define([
  // Utils
  'utils/AjaxUtil',
  'utils/TimeUtil',
  'utils/DataURLConstants',
  'utils/RoutingURLConstants',
  'utils/AppConstants',
  'progressBar',
  'data/DataProperties',
  // Managers
  'managers/NamespaceManager',
  // Views
  'views/base/DataTableTemplates'],
function(
  // Utils
  AjaxUtil,
  TimeUtil,
  DataURLConstants,
  RoutingURLConstants,
  AppConstants,
  ProgressBar,
  DataProp,
  // Managers
  NamespaceManager,
  // Views
  DataTableTemplates) {

  'use strict';

  const TASK_PROGRESS = {
    failed      : '#cf6a6d',
    in_progress : '#26bbf0',
    not_started : '#26bbf0',
    completed   : '#26925e',
    warning     : '#ffd055'
  };

  var AppUtil = {

    name : 'AppUtil',

    // Allow valid IPv4 addresses. Do not allow 0 as prefix in octet
    // Invalid IP address would be 10.0.01.1
    // Valid IP address would be 10.0.1.1
    ipAddressRegex : ['^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9]?)',
      '\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9]?)',
      '\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9]?)',
      '\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9]?)$'],

    hostNameRegex : '^([a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,}$',

    emailAddrRegex : ['^(([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()',
      '[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))',
      '@((\\[[0-9]{1,3}\\.',
      '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|',
      '(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'],

    isNumberRegex : '^[0-9]*$',

    // Allow only alphabets and numbers with spaces
    isAlphaNumericRegex: /^[A-Za-z0-9 ]+$/i,

    // Allows extensions with numbers, symbols, spaces and alphabets except
    // forward slash (/), starting with dot (.)
    // e.g: .txt, .tar 1, .@123, .*a etc
    isValidExtension: /^[.]{1}([^/.]+)$/i,

    // Allows username with netbios\username
    // e.g child-3\administrator
    isValidUsername: /^([A-Za-z0-9._-]+|[^\\u0000-\\u007F]+)[\\]{1}([A-Za-z0-9._-]+|[^\\u0000-\\u007F]+)$/,

    // Allows SID as username
    // e.g S-1-5-21-2562418665-3218585558-1813906818-1576
    isValidSID: /^[Ss]-[0-9]-[0-9]-[0-9]{2}(-[0-9]+){4}$/,

    // Allows UID as username
    // e.g 123412432
    isValidUID: /(^[0-9]$)|(^[1-9][0-9]+$)/,

    // Marker to indicate the infinity end value of an int range
    // IE 11 and under doesn't support Number.MAX_SAFE_INTEGER
    filterRangeMax : Number.MAX_SAFE_INTEGER || (Math.pow(2, 53) - 1),

    // Validates the number in the input field is
    // greater than max safe integer i.e. 9007199254740991.
    isMaxSafeInteger: function(value) {
      if (value <= AppUtil.filterRangeMax) {
        return true;
      }
      return false;
    },

    // Validates the IP address or the domain name in the input field.
    // @param value is the IP address or the host.
    validateIPaddress: function(value) {
      let regIP = new RegExp(AppUtil.ipAddressRegex.join('')),
          regHost = new RegExp(AppUtil.hostNameRegex);

      if (regIP.test(value) || regHost.test(value)) {
        return true;
      }
      return false;
    },

    // Validates the entered email ID.
    // @param email is the email ID entered.
    validateEmail: function(email) {
      var reg = new RegExp(AppUtil.emailAddrRegex.join(''));

      if (!reg.test(email)) {
        return false;
      }
      return true;
    },

    // Validates the passed value has only alpha numeric characters.
    // @param value(string) to validate.
    validateAlphaNumeric: function(value) {
      const reg = new RegExp(AppUtil.isAlphaNumericRegex);

      return reg.test(value);
    },

    // Replace all special characters including space in a string with "_" and
    replaceSpecialCharWithUnderscore: function(str) {
      return str ? str.replace(/[^a-zA-Z0-9]/g, '_') : '';
    },

    // Process a simple text error or an ajax error response body
    // @errorThrown - a string or a serialized object
    // @return - returns a converted text error message
    processThrownError: function(errorThrown, isHtmlError) {
      if (!_.isBoolean(isHtmlError)) {
        isHtmlError = true;
      }
      var errorMsg;
      if (_.isString(errorThrown)) {
        // Show client side error
        errorMsg = _.escape(errorThrown);
      } else if (this.isConnectionError(errorThrown)) {
        // Show Connection error
        errorMsg = 'Unable to connect to the server.';
        $('#n-header *').prop('disabled', false);
      } else if (this.isHttp404Error(errorThrown)) {
        // Show 404 error
        errorMsg = 'Requested resource not available.';
      } else if (this.isHttp405Error(errorThrown)) {
        // Show 405 error
        errorMsg = _.escape(errorThrown.statusText);
      } else {
        if (errorThrown && errorThrown.responseText) {
          errorMsg = errorThrown.responseText;
        } else {
          errorMsg = errorThrown;
        }
        errorMsg = AjaxUtil.processAjaxError(errorMsg, isHtmlError);
        if (!_.isString(errorMsg)) {
          return 'Server Error : ' + _.escape(errorThrown.statusText);
        }
        errorMsg =
          this.removeServerException(errorMsg) || 'Server Error';
      }
      return errorMsg;
    },

    // Removes any Java exception message from the backend
    // (e.g. 'com.nutanix.util.Exception').
    removeServerException: function(str) {
      var msg = (str || '').split(' ');
      if (msg.length && msg[0].indexOf('com.nutanix') > -1) {
        str = _.rest(msg, 1).join(' ');
      }
      return str;
    },

    // Returns true if the app has a scrollbar
    hasScrollBar: function() {
      var hContent = $('#n-view-wrapper').height(); // get the height of your content
      var hWindow = $(window).height();  // get the height of the window

      // If the height of your content is bigger than the height of the
      // browser window, we have a scroll bar
      if (hContent > hWindow) {
          return true;
      }
      return false;
    },

    // Returns true if there's a connection error based on the XHR passed.
    isConnectionError: function(xhr) {
      return (xhr.status === 0);
    },

    // Returns true if there's a http 404 error
    isHttp404Error: function(xhr) {
      return (xhr.status === 404);
    },

    // Returns true if there's a http 405 error
    isHttp405Error: function(xhr) {
      return (xhr.status === 405);
    },

    // Checks if the input parameter is present in the URL.
    isParameterPresent: function(parameter) {
      return window.location.href.includes(parameter);
    },

    // Returns the value of query parameter based on it's name.
    getParameterByName: function(name, url) {
      if (!url) {
        url = window.location.href;
      }
      name = name.replace(/[\]]/g, '\\$&');
      var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
          results = regex.exec(url);

      if (!results) {
        return null;
      }
      if (!results[2]) {
        return '';
      }
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    },

    // Show error
    onDataError: function(xhr) {
      // Get error message
      let errorDetails = this.getErrorMessage(xhr);
      $('.page-content').html(DataTableTemplates.ERROR({
        errorDetails :  errorDetails
      }));
    },


    // Return error message from xhr object
    getErrorMessage: function(xhr) {
      // Show the error message and details (remove the HTML tags)
      var errorDetails = '';
      // If there is a status code of 0 (meaning unable to connect to
      // server), there is no message so we have to provide our own.
      if (this.isConnectionError(xhr)) {
        errorDetails = 'Unable to connect to the server.';
        $('#n-header *').prop('disabled', false);
      } else if (this.isHttp404Error(xhr)) {
        errorDetails = 'Requested resource not available';
      } else {
        errorDetails = (
          AjaxUtil.processAjaxError(xhr.responseText) || '')
          .replace(/(<([^>]+)>)/ig, '');
      }

      return errorDetails;
    },

    // Truncate the message if its longer than a particular limit
    // Also add an ellipsis to the message indicating that there
    // is more content to this message.
    truncateNotificationMessage: function(message, length) {
      length = length || AppConstants.NOTIFICATION_LENGTH_LIMIT;
      length -= AppConstants.ELLIPSIS_TEXT.length;

      if (message && message.length > length) {
        message = message.slice(0, length);
        return message.concat(AppConstants.ELLIPSIS_TEXT);
      } else {
        return message;
      }
    },

    // Returns the template url for the pageid passed
    getPageUrlTemplate: function(pageId, options) {
      let urlTempl = '', fsUuid = options.fsId || '';

      switch (pageId) {
        case AppConstants.SEARCH_PAGE_ID:
          if (options.searchVal && options.searchInput) {
            // Search template while searching for a particular value.
            urlTempl = _.template(RoutingURLConstants.SPECIFIC_SEARCH, {
              searchInput : options.searchInput,
              searchVal   : encodeURIComponent(options.searchVal),
              fileServer  : fsUuid
            });
          } else {
            urlTempl = _.template(RoutingURLConstants.DEFAULT_SEARCH, {
              fileServer  : fsUuid
            });
          }
          break;
        case AppConstants.ANOMALY_PAGE_ID:
          urlTempl = _.template(
            RoutingURLConstants.ANOMALY, {
              fileServer: fsUuid
            });
          break;
        case AppConstants.FILE_SERVER_ENABLE_PAGE_ID:
          urlTempl = _.template(
            RoutingURLConstants.ENABLE_FILE_SERVER, {
              fileServer: fsUuid
            });
          break;
        case AppConstants.DASHBOARD_PAGE_ID:
        default:
          urlTempl = _.template(
            RoutingURLConstants.DEFAULT_DASHBOARD, {
              fileServer: fsUuid
            });
          break;
      }

      return urlTempl;
    },

    // Shows the loader
    showLoader: function() {
      $('.page-loader').show();
    },

    // Shows the loader
    showProgressLoader: function() {
      $('.progress-loader-wrapper').css('visibility', 'visible');
    },

    // Hides the loader
    hideLoader: function() {
      $('.page-loader').hide();
    },

    // Hides the loader
    hideProgressLoader: function() {
      $('.progress-loader-wrapper').css('visibility', 'hidden');
    },

    // Hides the loader
    failedTaskLoader: function(modelId) {
      $('.task-progress-loader-wrapper .task-progress-loader_' + modelId +
        ' svg path').css('stroke', '#cc6164');
      $('.n-task-menuitem .msg_' + modelId).css('color', '#cc6164');
      $('.n-task-menuitem .pct_' + modelId).css('color', '#cc6164');
    },

    successTaskLoader: function(modelId) {
      $('.task-progress-loader-wrapper .task-progress-loader_' + modelId +
        ' svg path').css('stroke', TASK_PROGRESS.completed);
    },

    // Clear style for existing model
    resetTaskLoader: function(modelId) {
      $('.n-task-menuitem .msg_' + modelId).removeAttr('style');
      $('.n-task-menuitem .pct_' + modelId).removeAttr('style');
    },

    // Dynamically create a container for a popup
    // The popup will be responsible for destroying it.
    // @param containerId  - DOM id for the container (without a leading #)
    createPopupContainer: function(containerId) {
      // Make sure to remove any dangling divs
      $('#globalModalContainer  #' + containerId).remove();

      // Then let's create the popup
      var popupDiv = $('<div id="' + containerId + '" ' +
      ' class="modal hide fade out" data-backdrop="static" ' +
      'tabindex="-1"></div>');
      popupDiv.appendTo('#globalModalContainer');
      return popupDiv;
    },

    // Dynamically create a container for a popup for inline style
    // used for showing popup as part of page itself.
    // The popup will be responsible for destroying it.
    // @param containerId  - DOM id for the container (without a leading #)
    createInlinePopupContainer: function(containerId) {
      // Make sure to remove any dangling divs
      $('#inlinePopupContainer  #' + containerId).remove();

      // Then let's create the popup
      var popupDiv = $('<div id="' + containerId + '" ' +
      ' class="modal hide fade out" data-backdrop="static" ' +
      'tabindex="-1"></div>');
      $('#inlinePopupContainer').html(popupDiv);
      return popupDiv;
    },

    // Removes the user name from the URL.
    removeUserNamefromtheURL: function(username) {
      let str = 'user_name=' + username,
          currentLocation = window.location.href;

      if (currentLocation.includes('&' + str)) {
        window.location = currentLocation.replace('&' + str, '');
      } else if (currentLocation.includes('?' + str + '&')) {
        window.location = currentLocation.replace(str + '&', '');
      } else if (currentLocation.includes('?' + str)) {
        window.location = currentLocation.replace('?' + str, '');
      }
    },

    formatSize: function(data) {
      let count = data;
      if (data/1000 >= 1 && data/1000000 < 1) {
        count = Math.round(data / 100) / 10 + 'k';
      } else if (data/1000000 >= 1) {
        count = Math.round(data/100000) / 10 + 'M';
      }
      return count;
    },

    // Generates random number.
    getRandomInt: function(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },

    // Generate a Random ID.
    // @param prefix - ID should start with this prefix
    // @return psuedo random ID
    randomId : function(prefix) {
      return (prefix || '') +
             Math.random().toString(16).substring(7, 13) +
             Math.random().toString(16).substring(4, 10);
    },

    // Append query parameters in all the API requests.
    preRequestSetup: function(options) {
      let _this = this;
      // Append the fileServer and userName for all API calls
      $.ajaxSetup({
        beforeSend: function(jqXHR, settings) {
          // Gets the user timezone name.
          var timeZone = 'time_zone=' + TimeUtil.getUserTimeZone();

          // Set header to send time zone.
          jqXHR.setRequestHeader('Accept', timeZone);

          var hasParams = settings.url.split('?').length > 1 ? 1 : 0,
              // If fileserver param is not set in option, set it empty
              fileServer = options.fileServer || '',
              userName = _this.getUserName();
          if (0 && settings.type === 'POST') {
            const payload = JSON.parse(settings.data);
            payload.file_server_uuid = fileServer;
            payload.user_name = userName;
            settings.data = JSON.stringify(payload);
          } else {
            // File server template to append to the URL. Fileserver might not
            // be available while making health page API calls
            var queryFs = '';
            if (fileServer) {
              queryFs = _.template(
                DataURLConstants.APPEND_FILE_SERVER, { fileServer: fileServer }
              );
            }

            // User name template to append to the URL.
            var queryUsr = _.template(
              DataURLConstants.APPEND_USER_NAME, { userName: userName }
            );

            // Check if url already has username in it
            var usernameExists = false;
            if (hasParams) {
              usernameExists =
                settings.url.split('?')[1].indexOf('user_name=') >= 0;
            }
            // Dont append anything if url already has username in it
            if (!usernameExists) {
              // Append user name in the APIs.
              if (hasParams) {
                settings.url += '&' + queryUsr;
              } else {
                settings.url += '?' + queryUsr;
              }
            }

            // Append file server name in the APIs.
            hasParams = settings.url.split('?').length > 1 ? 1 : 0;
            // Check if url already has file server uuid in it
            var fileserverExists = false;
            if (hasParams) {
              fileserverExists =
                settings.url.split('?')[1].indexOf('file_server_uuid=') >= 0;
            }
            // Append fileserver param and file server uuid only if does not
            // exist in URL and if fileserver is passed in options.
            if (!fileserverExists && queryFs) {
              if (hasParams && queryFs) {
                settings.url += '&' + queryFs;
              } else {
                settings.url += '?' + queryFs;
              }
            }
          }
        }
      });
    },

    // Compare two strings.
    // Return true if s1 contains s2 (case insensitive)
    containsCompare: function(str1, str2) {
      var s1 = str1 || '';
      var s2 = str2 || '';
      return ( s1.toLowerCase().indexOf(s2.toLowerCase()) >= 0 );
    },

    // Establish interval polling with a timeout.
    // @param options.intervalHandler - handler to be called for each
    //        interval pass. Make sure that it returns a boolean indicating
    //        whether the polling should continue.
    //        options.intervalPeriod  - (in ms) interval period.
    //        options.timeoutHandler  - handler to be called when the polling
    //        times out.
    //        options.timeoutPeriod   - (in ms) timeout period.
    setIntervalWithTimeout: function(options) {
      if (!options || !options.intervalHandler ||
          !options.timeoutHandler || !options.intervalPeriod ||
          !options.timeoutPeriod) {
        throw new Error('AppUtil: setIntervalWithTimeout: Invalid options.');
      }

      var timeoutId, intervalId;

      // Main handler that gets called with every polling interval.
      var intervalHandlerWrapper = function() {
        if (options.intervalHandler()) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      };

      // Handler for when the timeout expires before the event being
      // monitored occurs.
      var timeoutHandlerWrapper = function() {
        clearInterval(intervalId);
        options.timeoutHandler();
      };

      intervalId = setInterval(intervalHandlerWrapper,
        options.intervalPeriod);

      timeoutId = setTimeout(timeoutHandlerWrapper, options.timeoutPeriod);
    },

    // Remove all special characters from a string passed.
    removeSpecialCharacters: function(str) {
      return str.replace(/[^a-zA-Z0-9 ]/g, '');
    },

    // Remove all spaces in the string.
    removeSpaces: function(str) {
      return str.replace(/\s/g, '');
    },

    // Convert minutes to milliseconds
    minutesToMilliseconds: function(minutes) {
      return minutes * AppConstants.MILLIS_PER_MINUTE;
    },

    // Append task progress in task manager
    loadTaskProgress: function(taskModel, type) {
      let containerClass = '.task-progress-loader_' + taskModel.cid;
      let circleProgress = new ProgressBar.Circle(containerClass, {
        color: TASK_PROGRESS[type] || TASK_PROGRESS.in_progress,
        easing: 'easeInOut',
        strokeWidth: 20,
        step: function(state, circle) {
          taskModel.setPercentage(Math.round(circle.value() * 100));
        }
      });

      return circleProgress;
    },

    // Returns the data retention period
    getDataRetentionPeriod: function(fsId) {
      fsId = fsId || this.getParameterByName('fs_id');
      return NamespaceManager.get(fsId);
    },

    // Set the data retention period
    setDataRetentionPeriod: function(fsId, retentionPeriod) {
      fsId = fsId || this.getParameterByName('fs_id');
      NamespaceManager.set(fsId, retentionPeriod);
    },

    // Returns custom dropdown data
    getActionDropdownData: function(fsId, allOptions = false) {
      fsId = fsId || AppUtil.getParameterByName('fs_id');
      let retentionPeriod = AppUtil.getDataRetentionPeriod(fsId),
          data = [
            {
              action : AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_7_DAYS,
              text   : AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_7_DAYS
            },
            {
              action : AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS,
              text   : AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_30_DAYS
            }];

      if (allOptions) {
        data.push(
          {
            action : AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_1_YEAR,
            text   : AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_1_YEAR
          });
      } else if (retentionPeriod > 12) {
        // In case of retention period being more than 1 year, add the previous
        // values in years to the dropdown options.
        _.each(AppConstants.DROPDOWN_YEAR_OPTIONS_VALUE, function(opt, key) {
          if (opt <= retentionPeriod) {
            data.push({
              action : opt.toString(),
              text   : AppConstants.DROPDOWN_YEAR_OPTIONS_TEXT[key]
            });
          }
        });
      } else if (retentionPeriod > 1 && retentionPeriod < 12) {
        // In case of retention period being more than 1 month and less than 1
        // year, add the month value to the dropdown as its last option.
        data.push({
          action : retentionPeriod.toString(),
          text   : 'Last ' + retentionPeriod + ' months'
        });
      } else if (retentionPeriod === 12) {
        // In case of retention period being 1
        // year, add the year value to the dropdown as its last option.
        data.push({
          action : AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_1_YEAR,
          text   : AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_1_YEAR
        });
      }

      return data;
    },

    // Construct dropdown options in required format.
    constructDropDownData: function(type, allOptions, fsId, pageId = null) {
      let dropDownData, options, optionClass = null;
      let widgetType = type || 'table';
      let data = this.getActionDropdownData(fsId, allOptions);

      // Add 'Last 24 hours' options in case of tables on the dashboard.
      switch (pageId) {
        case AppConstants.DASHBOARD_PAGE_ID:
        case AppConstants.ANOMALY_PAGE_ID:
          if (widgetType === 'table') {
            data.unshift({
              action : AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_24_HRS,
              text   : AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_24_HRS
            });
          }

          dropDownData = data;
          break;
        case AppConstants.HEALTH_PAGE_ID:
          data = [{
            action : AppConstants.HOST_STORAGE_OPTIONS_VALUE.HOST_DISK_USAGE,
            text   : AppConstants.HOST_STORAGE_OPTIONS_TEXT.HOST_DISK_USAGE
          },
          {
            action :
              AppConstants.HOST_STORAGE_OPTIONS_VALUE.HOST_VOLUME_GROUP_USAGE,
            text   :
              AppConstants.HOST_STORAGE_OPTIONS_TEXT.HOST_VOLUME_GROUP_USAGE
          }];

          dropDownData = data;
          optionClass = 'storageChart btnDropdownAction ';
          break;
        default:
          dropDownData = data;
      }

      optionClass = optionClass || widgetType + 'btnDropdownAction last_';

      options = _.map(dropDownData, function(item) {
        return {
          attributes : AppConstants.NAV_ACTION + '="' + item.action + '"'
            + AppConstants.NAV_ACTION_TARGET + '="' + item.text + '"',
          name       : item.text,
          'class'    : optionClass + item.action
        };
      });

      return options;
    },

    // Return current page id
    getCurrentPageId: function() {
      return NamespaceManager.get(NamespaceManager.APP_VIEW).currentPageUuid;
    },

    // Return selected fileserver id
    // Check the fileserver dropdown in the header
    getSelectedFileServer: function() {
      const fsId = $('.selected-file-server').attr('actionTargetId');
      return fsId;
    },

    // Check for category in AppConstants and if it does not exist then return as it is.
    // @param category(string) - string for which display name is required
    getCategoryDisplayName: function(category) {
      category = category.trim();
      let categoryName = AppConstants.CATEGORIES[category.toUpperCase()];
      if (!categoryName) {
        return category;
      }

      return categoryName;
    },

    // Check if category name is defined in AppConstants and return the ES
    // equivalent category name, if does not exist then return the category
    // name as it is.
    // @param category(string)
    getCategoryESName: function(category) {
      const catName = category.trim();
      if (!catName) {
        return '';
      }

      // Compares the category with default category names
      let categoryName = _.find(Object.keys(AppConstants.CATEGORIES), (key) => {
        return AppConstants.CATEGORIES[key].toLowerCase() === catName
          .toLowerCase();
      });

      // If the category name does not exist in AppConstants return it.
      if (!categoryName) {
        return catName;
      }

      // Return the lower case ES value for default categories
      return categoryName.toLowerCase();
    },

    // Functions (Window)
    //-------------------

    // Updates the URL according to the input parameter.
    updateUrl: function(url) {
      window.history.pushState('', '', url, { trigger: true });
    },

    // Navigates to the URL according to the input.
    // @param - url is the url to navigate to.
    // Need to remove this in following build once everything works well
    navigateToUrlOld: function(url) {
      // Check if the current URL is same as the passed URL.
      if (window.location.hash === url) {
        Backbone.history.loadUrl(url);
      } else {
        NamespaceManager.get(NamespaceManager.APP_ROUTER).navigate(
          url, { trigger: true });
      }
    },

    // Navigates to the URL according to the input.
    // @param - url is the url to navigate to.
    navigateToUrl: function(url) {
      url = url.replace('#', '');
      if (Backbone.history.fragment === url) {
        Backbone.history.loadUrl(Backbone.history.fragment);
      } else {
        Backbone.history.navigate(url, {
          trigger: true,
          replace: false
        });
      }
    },

    // Opens a new browser window with specified URL. Default value of
    // isNewWindow is true.
    openURL: function(url, isNewWindow, windowOptions) {
      isNewWindow =
        (typeof isNewWindow === 'undefined' ? true : isNewWindow);
      var windowFeatures = [];
      if (windowOptions) {
        _.map(windowOptions, function(value, key) {
          windowFeatures.push(key + '=' + value);
        });
      }
      window.open(url, isNewWindow ? '_blank' : '_self',
        windowFeatures.join(','));
    },

    // Does this browser support localstorage?
    hasLocalStorage: function() {
      try {
        return (typeof localStorage === 'object');
      } catch (err) {
        return false;
      }
    },

    // Does this browser support session storage?
    hasSessionStorage: function() {
      try {
        return (typeof sessionStorage === 'object');
      } catch (err) {
        return false;
      }
    },

    // General purpose function for retrieving localStorage boolean
    // properties.  When the property exists, if it is set to anything
    // other than ('0', 'false' or 'FALSE'), it will be considered true.
    // @property - local storage key to check.
    isLocalStorageProperty: function(property) {
      let localStoragePropert = false;
      if (localStorage &&
          localStorage[property] &&
          localStorage[property] !== '0' &&
          localStorage[property].toUpperCase() !== 'FALSE') {
        localStoragePropert = true;
      }
      return localStoragePropert;
    },

    // General purpose function for retrieving sessionStorage boolean
    // properties.  When the property exists, if it is set to anything
    // other than ('0', 'false' or 'FALSE'), it will be considered true.
    // @property - session storage key to check.
    isSessionStorageProperty: function(property) {
      let sessionStoragePropert = false;
      if (sessionStorage &&
          sessionStorage[property] &&
          sessionStorage[property] !== '0' &&
          sessionStorage[property].toUpperCase() !== 'FALSE') {
        sessionStoragePropert = true;
      }
      return sessionStoragePropert;
    },

    // Returns the username from the storage
    getUserName: function() {
      const userName = localStorage.getItem('userName');
      return userName;
    },

    // Set the username to the storage
    setUserName: function(username) {
      localStorage.setItem('userName', username);
    },

    // Set the item to the session storage
    setSession: function(key, value) {
      sessionStorage.setItem(key, value);
    },

    // Get the item from the session storage,
    // used for returning string values
    getSession: function(key) {
      return sessionStorage.getItem(key);
    },

    // Redirect user to prism
    logOut: function() {
      const virtualIp = this.getSession('referralUrl');
      // Remove all saved data from sessionStorage
      sessionStorage.clear();
      this.setSession('isLoggedOut', true);
      if (virtualIp) {
        // Template for the referral URL
        let _templateLogoutURL = _.template(DataURLConstants.REFERRER_URL);
        const logoutUrl =
          _templateLogoutURL({
            protocol   : DataProp.PROTOCOLS.HTTP,
            host       : virtualIp
          });
        this.openURL(logoutUrl, true);
        window.close();
      }
    },

    // Return true if browser is IE 10 or 9 or 11 or Edge
    isIEOrEdge: function() {
      let isIE = false;
      if (/MSIE 10/i.test(navigator.userAgent)) {
        // This is internet explorer 10
        isIE = true;
      } else if (/MSIE 9/i.test(navigator.userAgent) ||
        /rv:11.0/i.test(navigator.userAgent)) {
        // This is internet explorer 9 or 11
        isIE = true;
      } else if (/Edge\/\d./i.test(navigator.userAgent)) {
        // This is Microsoft Edge
        isIE = true;
      }

      return isIE;
    },

    // Return true if browser is Safari
    isSafari: function() {
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    },

    // Validate if SID is valid
    validSID: function(sid) {
      var reg = new RegExp(AppUtil.isValidSID);
      return reg.test(sid);
    },

    // Validate if UID is valid
    validUID: function(uid) {
      var reg = new RegExp(AppUtil.isValidUID);
      return reg.test(uid);
    },

    // Validate if Username is valid
    validUsername: function(username) {
      var reg = new RegExp(AppUtil.isValidUsername);
      return reg.test(username);
    },

    // Validate if number is valid
    validNumber: function(number) {
      var reg = new RegExp(AppUtil.isNumberRegex);
      return reg.test(number);
    },

    // Validate if extension is valid
    validExtension: function(ext) {
      var reg = new RegExp(AppUtil.isValidExtension);
      return reg.test(ext);
    },

    // Validate IP address only, exclude hostname
    validIPWithoutHost: function(ipAddress) {
      var reg = new RegExp(AppUtil.ipAddressRegex.join(''));
      return reg.test(ipAddress);
    },

    // Returns array with unique values after converting the
    // string to lower case
    // @param array - Array with string type
    iUniqueArray: function(array) {
      let updatedValues = [];
      $.each(array, function(key, value) {
        updatedValues.push(value.toLowerCase());
      });
      return _.uniq(updatedValues);
    },

    // Check if the extension is valid
    // @param ext - string extension to be validated
    // @param includesDot - boolean if extension includes dot "." prefix
    // @returns type - string invalid extension type
    extensionValidityCheck: function(ext, includesDot = true) {
      if (!includesDot) {
        ext = '.' + ext;
      }
      // If the length is more than 260 characters return error. Setting 260
      // character limit currently as pre-requisite
      if (ext.length > 260) {
        // Return invalid length error message
        return 'invalid_length';
        // Validate extension with standard formats being supported
      } else if (!this.validExtension(ext)) {
        // Return invalid format error message
        return 'invalid_format';
      }
    }
  };

  return _.extend({},
    AjaxUtil, AppUtil);
});
