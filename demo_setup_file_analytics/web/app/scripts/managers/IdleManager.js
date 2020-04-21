//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// IdleManager is used to monitor login idle session and automatically
// logout the session.
//
define([
  // Managers
  'managers/NamespaceManager',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil'],
function(
  // References of managers
  NamespaceManager,
  // References of Utils
  AppConstants,
  AppUtil) {

  'use strict';

  // Constants
  var ONE_MINUTE_IN_MILLISECS = 60000;

  // Start of IdleManager
  return {

    // Properties
    //----------

    // The timer to trigger a warning when there are no key/mouse events
    warningTimer: null,

    // Number of milliseconds the session must be inactive before displaying
    // a warning of inactivity. Default is 15 minutes.
    warningTimeoutMillisecs: null,

    // The timer to trigger the logout of the idle session.
    logoutTimer: null,

    // Number of milliseconds the session must be inactive before auto
    // logout kicks in. This number must always be larger than
    // warningTimeoutMillisecs. Default is 16 minutes.
    logoutTimeoutMillisecs: null,

    // Track the last restart time
    lastIdleTime: null,

    // Skip auto logout, userful in some cases like image upload.
    skipAutoLogout: false,

    // Whether auto-logout has initiated.
    isLoggingOut: false,

    // Functions (Core)
    //-----------------

    // Initialize the alert manager.
    initialize : function() {
      if (NamespaceManager.set(NamespaceManager.IDLE_MANAGER)) {
        return;
      }

      // Register this instance to the global namespace
      NamespaceManager.set(NamespaceManager.IDLE_MANAGER, this);

      let timeoutSettings = {
        userTimeout: AppConstants.USER_TIME_OUT
      };
      this.setAutoLogoutTime(AppUtil.minutesToMilliseconds(
        timeoutSettings.userTimeout));

      const isExplorer = AppUtil.isIEOrEdge();
      const isSafari = AppUtil.isSafari();
      // By pass auto logout for Tech Preview
      if (1 || isExplorer || isSafari || AppUtil.isLocalStorageProperty(
        AppConstants.LOCAL_STORAGE.DISABLE_AUTO_LOGOUT)) {
        this.skipAutoLogout = true;
        return;
      }
      NamespaceManager.get(NamespaceManager.IDLE_MANAGER).restartTimer();
    },

    // Restart the warningTimer and logoutTimer.
    // lastIdleTime : Optional parameter.  Default to Date.now()
    // if none is passed in. This field is used internally to sync
    // the lastIdleTime across all multiple client session.
    restartTimer: function(lastIdleTime) {
      clearInterval(this.warningTimer);
      clearInterval(this.logoutTimer);

      this.lastIdleTime = lastIdleTime || Date.now();
      localStorage[AppConstants.LOCAL_STORAGE.UI_IDLE_TIME] =
        this.lastIdleTime;

      // Zero indicated that the user has disabled auto logout.
      // Don't start the timer.
      if (this.warningTimeoutMillisecs === 0) {
        return;
      }

      let _this = this;
      this.warningTimer = setTimeout(function() {
        if (_this._hasLastIdleTimeChanged()) {
          _this.restartTimer(
            Number(localStorage[AppConstants.LOCAL_STORAGE.UI_IDLE_TIME]));
          return;
        }
        if (_this.skipAutoLogout) {
          _this.restartTimer();
        } else {
          // Pop up a dialog to let user know of inactive session.
          $.nutanixConfirm({
            msg       : 'You are about to be signed out due to inactivity',
            yesText   : 'Stay Logged In',
            hideNo    : true,
            yes       : function() {
              _this.restartTimer();
            }
          });
        }
      }, this.warningTimeoutMillisecs);

      this.logoutTimer = setTimeout(function() {
        if (_this._hasLastIdleTimeChanged()) {
          _this.restartTimer(
            Number(localStorage[AppConstants.LOCAL_STORAGE.UI_IDLE_TIME]));
          return;
        }
        if (!_this.skipAutoLogout) {
          // Auto logout.
          _this.isLoggingOut = true;

          // Logout user and redirect to prism
          AppUtil.logOut();
        }
      }, this.logoutTimeoutMillisecs);
    },

    // Set a new auto logout time on idle.
    setAutoLogoutTime: function(millisecs) {
      if (millisecs === 0) {
        clearInterval(this.warningTimer);
        clearInterval(this.logoutTimer);
      }

      this.warningTimeoutMillisecs = millisecs;
      this.logoutTimeoutMillisecs =
        this.warningTimeoutMillisecs + ONE_MINUTE_IN_MILLISECS;
      this.restartTimer();
    },

    // Returns the value of the currently set auto logout time on idle.
    // The auto logout time is in milliseconds.
    getAutoLogoutTime() {
      return this.logoutTimeoutMillisecs;
    },

    // Get the idle manager instance for the app and restart the timer
    // @lastIdleTime - Defaults to current timestamp
    reset: function(lastIdleTime) {
      NamespaceManager.get(NamespaceManager.IDLE_MANAGER).restartTimer(
        lastIdleTime);
    },

    // Return true if localStorage last idle time is
    // not equal to the in memory this.lastIdleTime.
    _hasLastIdleTimeChanged: function() {
      const localStartLastIdleTime = Number(
        localStorage[AppConstants.LOCAL_STORAGE.UI_IDLE_TIME]);
      return localStartLastIdleTime !== this.lastIdleTime;
    }
  };
});
