//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// LogUtil contains common logging utility functions
//
/* eslint-disable no-console */
define([],
  function() {

    'use strict';

    var LogUtil = {
      // The console logger of the application. It's better to have a
      // centralized location of the debugger as IE doesn't run the console
      // when the F12 tools developer is closed. We can also disable logging
      // in this function.
      log: function() { this.console('log', arguments); },
      error: function() { this.console('error', arguments); },
      info: function() { this.console('info', arguments); },
      warn: function() { this.console('warn', arguments); },
      console: function(console_key, log) {
        if (typeof console === 'undefined') {
          return;
        }
        const console_func = console[console_key];
        if (!console_func) {
          return;
        }
        log = Array.prototype.slice.call(log);
        log.unshift(this.getLogDatePrefix() + ' nutanix.ui.' + log.shift());
        console_func.apply(console, log);
      },

      getLogDatePrefix: function() {
        const d = new Date();
        const datePrefix = d.getHours() +
          ':' + d.getMinutes() +
          ':' + d.getSeconds();
        return datePrefix;
      },

      // Similar to the log function above, takes in objects
      // @param source: String - classname where log originates
      // @param logObject : JS object to log
      logObject: function(source, logObject) {
        if (typeof console !== 'undefined') {
          var d = new Date();
          var datePrefix = d.getHours() +
            ':' + d.getMinutes() +
            ':' + d.getSeconds();
          console.log(datePrefix + ' nutanix.ui.' + source, logObject);
        }
      },

      // Set the debug function to do nothing by default for performance
      // considerations.
      debug: function() {
        // In debug mode these become log
      },

      // Set the debugObject function to do nothing by default for performance
      // considerations.
      debugObject: function() {
        // In debug mode these become logObject
      },

      // Logging function for debug level messages that only get displayed
      // if localStorage.nutanix_debug is set.
      //
      // All arguments passed to this function will be logged as a single
      // log entry.
      logDebug: function() {
        if (typeof console !== 'undefined') {
          var d = new Date(),
              datePrefix = d.getHours() +
                ':' + d.getMinutes() +
                ':' + d.getSeconds(),
              args = Array.prototype.slice.call(arguments);

          console.log('DEBUG: ' + datePrefix + ' nutanix.ui.' + args.join(''));
        }
      }
    };

    return LogUtil;
  });
/* eslint-enable no-console */
