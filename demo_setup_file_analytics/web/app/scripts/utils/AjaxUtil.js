//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AjaxUtil contains common AJAX utility functions
//
define(
  [
    'data/DataProperties',
    'utils/AppConstants'],
  function(
    DataProp,
    AppConstants) {

    'use strict';

    var AjaxUtil = {

      // Take a serialized object and return an actual object. If the
      // conversion fails, we return the original parameter.
      // @param serializedObj: the object or serialized object to be converted.
      processSerializedObject: function(serializedObj) {
        if (_.isString(serializedObj)) {
          try {
            var retObj = JSON.parse(serializedObj);
            return retObj;
          } catch (Error) {
            // The string is not in object format so just return it.
            return serializedObj;
          }
        }

        return serializedObj;
      },

      // If a handler is expecting a primitive (string) responseText
      // instead of an object, use this function to do the conversion.
      // @param serializedObj: the object or serialized object to be converted.
      processAjaxPrimitive: function(serializedObj) {
        var obj = this.processSerializedObject(serializedObj);

        if (obj && _.has(obj, DataProp.PRIMITIVE_KEY)) {
          return obj[DataProp.PRIMITIVE_KEY];
        }
        console.info('AppUtil: processAjaxPrimitive: Value not ' +
          'converted; returning original value.');
        // Return the original object since this value may not require
        // conversion.
        return serializedObj;

      },

      // Process an ajax error response body.
      // @param serializedObj: the object or serialized object to be converted.
      // @param isHtmlError: Boolean parameter which determines
      // if error message contains html. If it's a html error message we don't
      // escape and return it.
      processAjaxError: function(serializedObj, isHtmlError) {
        var obj = this.processSerializedObject(serializedObj);

        // We will always escape backend error messages for sanity.
        if (obj && _.has(obj, DataProp.ERROR_MESSAGE)) {
          // Make sure the error message itself is HTML safe
          return _.escape(obj[DataProp.ERROR_MESSAGE]);
        }
        console.info('AppUtil: processAjaxError: Value not ' +
          'converted; returning original value.');
        // Return the original object since this value may not require
        // conversion.
        if (obj && _.has(obj, DataProp.ERROR_MESSAGE_BACKEND)) {
          // Return as it is
          return obj[DataProp.ERROR_MESSAGE_BACKEND];
        }

        // Escape the error message if isHTMl is false.
        if (isHtmlError === false) {
          return _.escape(serializedObj);
        }
        return serializedObj;
      },

      // Given a URL add a cache-bust parameter to it
      cacheBustURL: function(url) {
        var ret = url;
        if (url.indexOf('?') <= 0) {
          ret += '?_=';
        } else {
          ret += '&_=';
        }
        // We're using the following method to get the milliseconds from epoch
        // instead of Date.now() because of an occasional conflict with Datejs
        // Datejs Date.now() returns a date/time stamp in text format.
        ret += new Date().getTime();
        return ret;
      },

      // Abort xhr request
      // @param xhr - the xhr object to abort
      abortXHRRequest: function(xhr) {
        if (xhr && xhr.abort &&
          xhr.status !== 200 &&
          xhr.readyState !== AppConstants.XHR_STATUS.DONE) {
          xhr.abort();
        }
      }
    };

    return AjaxUtil;

  }
);
