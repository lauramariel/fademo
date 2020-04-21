//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// BaseModel is the base class of all other models
//
define([
    // Constants
  'utils/DataURLConstants',
  'utils/AppConstants',
  // Data
  'data/DataProperties',
  // Core
  'backbone'],
function(
  // Constants
  DataURLConstants,
  AppConstants,
  // Data
  DataProp,
  // References of core
  Backbone) {

  'use strict';

  var BaseModel = Backbone.Model.extend({
    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // Sometimes we have to override Backbone.isNew() to enforce 'create' or
    // 'update' method. To override, call BaseModel.isNew(<boolean>). Refer
    // to isNew() function below.
    _isNew: null,

    // use payload while sending request to make POST calls
    payload: {},

    initialize(attributes, options) {
    },

    // Builds the URL structure
    getURL: function() {
      return this.url;
    },

    // Builds the URL by setting filter criteria over the GET results
    setFilterUrl: function(filter) {
      var fetchUrl = this.url.split('?');

      // Get URL params
      var params = _.object(
        _.compact(
          _.map(fetchUrl[1].split('&'),
            function(item) {
              if (item) { return item.split('='); }
            }
          )
        )
      );

      if (filter.length) {
        _.each(filter, function(fil) {
          _.each(fil, function(val, key) {
            if (params[key]) {
              if (!val) {
                delete params[key];
              } else {
                params[key] = val;
              }
            } else if (val) {
              params[key] = val;
            }
          });
        });
      }

      // Append all the filter params to the url
      var queryString = '', i = 0;
      _.each(params, function(searchVal, searchKey) {
        if (i === 0) {
          queryString += '?' + searchKey + '=' + searchVal;
        } else {
          queryString += '&' + searchKey + '=' + searchVal;
        }
        i++;
      });

      this.url = fetchUrl[0] + queryString;
    },

    // @override
    // Override the fetch function to check if the collection is currently
    // connected to the server. This prevents multiple connections that can
    // cause views to render incorrectly. If you want to force fetch even
    // though the state is PENDING, then set options.force = true.
    // fetch: function(options) {
    //   console.log('options = ', options);
    //   options.reset = true;
    //   console.log('options 2 = ', options);
    //   // Check if the current connection needs to be aborted to give way to
    //   // the new fetch call with new options.
    //   // if (this.state === AppConstants.STATE_PENDING &&
    //   //     !this.isSameFetchCall(options)) {
    //   //   this.stopFetch();
    //   // }
    //   // If the state is still pending, then don't call super fetch unless
    //   // options.force is set to true.
    //   // if (this.state !== AppConstants.STATE_PENDING ||
    //   //     (options ? options.force : false)) {
    //    // Backbone.Collection.prototype.fetch.apply(this, options);
    //   // }
    //   // else {
    //   //   AppUtil.log('BaseCollection | ' + this.name +
    //   //     ' | Fetch Ignored. Current State is:' +
    //   //     'this.state');
    //   // }
    // },

    // @override
    // Setter and getter for this._isNew. If there's a parameter, it will
    // override this._isNew with new value. Original Backbone.Model.isNew()
    // only checks if the id exists but there are instances when our entities
    // don't have an id property.
    isNew(value) {
      // Set _isNew value if value is boolean
      if (_.isBoolean(value)) {
        this._isNew = value;
      }

      // If _isNew hasn't changed, then use the original isNew() function
      if (this._isNew === null) {
        return Backbone.Model.prototype.isNew.apply(this, arguments);
      }
      return this._isNew;
    },

    // Cancels any pending HTTP request.
    stopFetch: function() {
      // Set the state to canceled.
      this.updateState(AppConstants.STATE_CANCELED);

      // Abort the HttpRequest.
      if (this._jqXHR && this._jqXHR.abort &&
          this._jqXHR.status !== 200 && this._jqXHR.readyState !== 4) {
        this._jqXHR.abort();
      }
    },

    // Returns true if the new options data parameters are the same
    // in the previous fetch call. This function can be overridden if the
    // subclass has special cases in the data fitler. By default it only uses
    // the options.data.id as a checker.
    //
    // Reasons to return false to indicate that it's not the same fetch call:
    // 1) Fetch is called first time.
    // 2) The previous id and new id are not the same.
    isSameFetchCall: function(options) {
      var previousId, newId;
      if (options && options.data) {
        newId = options.data.id;
      }
      if (this._previousOptions && this._previousOptions.data) {
        previousId = this._previousOptions.data.id;
      }
      return this._previousOptions !== null && (previousId === newId);
    },

    // @override
    // Override the sync function so that the options hash can be parsed and
    // the XMLHttpRequest can be stored.
    // If special request processing is needed for certain models,
    // (e.g. cancel/resubmit of pending requests) that should be handled
    // on a case by case basis by overriding this function.
    // Make sure to add the updateState call to any overriding functions.
    // sync(method, model, options) {
    //   // Parse the options
    //   options = this.parseOptions(method, model, options);

    //   // Update method
    //   // method = this.getUpdatedMethod(method, model, options);

    //   // Trigger the pending event if the conditions are met
    //   // this.triggerPendingEvent(options);
    //   // this.triggerRequestEvent();

    //   // Set the state to loading and trigger a pending event.
    //   // this.updateState(AppConstants.STATE_PENDING);

    //   // Store the id
    //   this._previousId = this._newId;

    //   // Call Backbone sync and store the returned XMLHttpRequest
    //   this._jqXHR = Backbone.sync(method, model, options);
    //   return this._jqXHR;
    // },

    // Call this function to preset the option by default. If you're creating
    // a subclass of BaseCollection and overriding sync method. Make sure to
    // call this in your new sync function.
    // parseOptions: function(method, model, options) {
    //   // Set the options
    //   options = options || {};
    //   console.log('method = ', method);
    //   console.log('model = ', model);
    //   console.log('options = ', options);

    //   // Set the URL
    //   options.url = model.url;

    //   // Parse the status code
    //   // options.statusCode = this.getStatusCode();

    //   // Data type
    //   options.dataType = 'json';

    //   // Set the parameters
    //   options.data = options.data || {};

    //   // Process GET method
    //   if (method === 'read') {
    //     // Disable cache for read
    //     // For some reason, options.cache in $.ajax is not working.
    //     options.data._ = new Date().getTime();

    //     // Add the cluster id parameter to options.data for read commands.
    //     // if (this.checkAddMulticlusterPassThroughParams()) {
    //     //   // If this model has a cluster uuid property defined, use that one,
    //     //   // otherwise get it from the current cluster id in the cluster
    //     //   // manager.
    //     //   if (this[DataProp.CLUSTER_UUID]) {
    //     //     options.data[DataURLConstants.CLUSTER_PROXY_UUID] =
    //     //       this[DataProp.CLUSTER_UUID];
    //     //   }
    //     //   else {
    //     //     options.data[DataURLConstants.CLUSTER_PROXY_UUID] =
    //     //       this.clusterManager.getCurrentClusterId();
    //     //   }
    //     // }

    //     // Add the extra parameters if there's any.
    //     // if (!_.isEmpty(this._parameters)) {
    //     //   // If there's additional projection params, join the array to
    //     //   // become a string, separated by comma.
    //     //   if (_.isArray(this._parameters[AppConstants.PARAM_PROJECTION])) {
    //     //     this._parameters[AppConstants.PARAM_PROJECTION] =
    //     //       this._parameters[AppConstants.PARAM_PROJECTION].join(',');
    //     //   }

    //     //   // Merge the the existing data parameters with extra parameters.
    //     //   options.data = $.extend({}, options.data, this._parameters);
    //     //}
    //   }
    //   // else if (this.checkAddMulticlusterPassThroughParams()) {
    //   //   // Append the cluster id directly to the url for non read commands.
    //   //   options.url += DataURLConstants.MC_PASS_THROUGH_QUERY_PARAMS(
    //   //     {
    //   //       delimiter: AppUtil.getQueryStringParamDelimiter(options.url),
    //   //       uuid     : this.clusterManager.getCurrentClusterId()
    //   //     });
    //   // }

    //   // Add the filter to the data options
    //   if (options.filter) {
    //     options.data.filter = options.filter;
    //   }

    //   // Set the error function
    //   //-----------------------
    //   // Create a new error object function so that the notification
    //   // error process can be added.
    //   if (method === 'read') {
    //     var optionsError = _.isFunction(options.error) ?
    //                         options.error : null,
    //         _this = this;
    //     // Error function called by $.ajax with parameters
    //     options.error = function(xhr, textStatus, errorThrown) {
    //       var errorMessage;

    //       if (errorThrown && errorThrown.message) {
    //         errorMessage = errorThrown.message;
    //       } else {
    //         errorMessage = errorThrown;
    //       }

    //       // AppUtil.log('BaseCollection | ' + _this.name + ' | Error: ' +
    //       //   errorMessage);
    //       // console.log('model.getState()  = ', model.getState());
    //       // Show the error message except for abort.
    //       // if (model.getState() !== 'Cancel') {e
    //       //   // If there is a status code of 0 (meaning unable to connect to
    //       //   // server and request wasn't canceled by user), notify user that
    //       //   // client can't connect to server.
    //       //   if (AppUtil.isConnectionError(xhr)) {
    //       //     // Call the NotificationManager to display a connection error
    //       //     // _this.getNotificationManager().showNotification(
    //       //     //   AppConstants.NOTIFY_ERROR, model, method, xhr);
    //       //   }

    //       //   // Then call the options.error made by Backbone
    //       //   if (optionsError) {
    //       //     optionsError(model, xhr, options);
    //       //   }
    //       // }

    //     };
    //   }

    //   return options;
    // },

    fetch: function(options) {
      this.clear({ silent: true });
      options.reset = true;
      options.contentType = 'application/json';
      if (options.data) {
        options.data = JSON.stringify(options.data);
      }
      return Backbone.Model.prototype.fetch.apply(this, arguments);
    },

    // Set request payload
    setRequestPayload: function(params) {
      this.payload = params;
    },

    // Get request payload while making POST call
    getRequestPayload: function() {
      return this.payload;
    },

    // @override
    // Parse the response to return the entities and store the metadata.
    parse: function(response, jqXHR) {
      // Get the metadata
      if (typeof response.metadata !== 'undefined') {
        this._metadata = response.metadata;
      }

      // Get the entities
      if (typeof response.entities !== 'undefined') {
        return response.entities;
      } else if (typeof response.results !== 'undefined') {
        return response.results;
      } else {
        return response;
      }
    },

    // Execute the PATCH request.
    // @param url - url to send request to the server.
    // @param data - data to be sent.
    // @param successFunction - function to be called on success.
    // @param errorFunction - function to be called on error.
    patch: function(url, data, successFunction, errorFunction) {
      $.ajax({
        type   : 'PATCH',
        url    : url,
        data   : JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json; charset=UTF-8',
        async: false,
        success: function(model, response) {
          successFunction(model, response);
        },
        error: function(xhr, textStatus, errorThrown) {
          errorFunction(xhr, textStatus, errorThrown);
        }
      });
    },

    // Get an attribute value. Wrapper around BB's get() call
    // Allows subclasses to handle virtual
    // or client-side attributes. String values will be escaped for security
    // reasons.
    // This should be the primary function for retrieving a models value.
    getValue(attribute) {
      const unescapedValue = this.getUnescapedValue(attribute);
      if (_.isString(unescapedValue)) {
        // Escape string values to prevent XSS vulnerabilities.
        // Note: if the string is already escaped you should use the get
        // method directly to prevent from it being further escaped.
        return _.escape(unescapedValue);
      }
      return unescapedValue;
    },

    // Get an un-escaped attribute value. Wrapper around BB's get() call
    // Allows subclasses to handle virtual
    // or client-side attributes
    getUnescapedValue(attribute) {
      if (attribute.indexOf('.') > 0) {
        const parts = attribute.split('.');
        const innerObject = this.get(parts[0]);
        if (innerObject) {
          return innerObject[parts[1]];
        }
      }
      return this.get(attribute);
    },

    // Returns the metadata generated from Gateway
    getMetaData: function() {
      return this._metadata;
    },

    // Returns the total count based on the metadata
    getMetaDataTotalCount: function() {
      return this.getMetaData() ?
        this.getMetaData()[DataProp.META_TOTAL] : this.length;
    }
  });

  // Returns the BaseModel class
  return BaseModel;
});
