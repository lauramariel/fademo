//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// BaseCollection is the base class of all other collections
//
define([
  // Utils
  'utils/DataURLConstants',
  // Data
  'data/DataProperties'],
function(
  // Utils
  DataURLConstants,
  // Data
  DataProp) {
  'use strict';

  var BaseCollection = Backbone.Collection.extend({

    url: DataURLConstants.AFS_ROOT_URL,

    _jqXHR: null,

    // use payload while sending request to make POST calls
    payload: {},

    initialize: function(attributes, options) {
      // this.collection.bind("reset", this.render, this);
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
              if (item) {
                return item.split('=');
              }
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

    // Cancels any pending HTTP request.
    stopFetch: function() {
      // Set the state to canceled.
      // this.updateState(AppConstants.STATE_CANCELED);

      // Abort the HttpRequest.
      if (this._jqXHR && this._jqXHR.abort &&
          this._jqXHR.status !== 200 && this._jqXHR.readyState !== 4) {
        this._jqXHR.abort();
      }
    },

    // fetch: function(options) {
    //   console.log('options  3 = ', options);
    //   options.reset = true;
    //   console.log('options 4 = ', options);
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
    //    Backbone.Collection.prototype.fetch.apply(this, arguments);
    //   // }
    //   // else {
    //   //   AppUtil.log('BaseCollection | ' + this.name +
    //   //     ' | Fetch Ignored. Current State is:' +
    //   //     'this.state');
    //   // }
    // },

    fetch: function(options) {
      options.reset = true;
      options.contentType = 'application/json';
      if (options.data) {
        options.data = JSON.stringify(options.data);
      }
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
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
    // Override the sync function so that the options hash can be parsed and
    // the XMLHttpRequest can be stored.
    // If special request processing is needed for certain collections,
    // (e.g. cancel/resubmit of pending requests) that should be handled
    // on a case by case basis by overriding this function.
    // Make sure to add the updateState call to any overriding functions.
    // sync: function(method, model, options) {
    //   // Parse the options
    //   options = this.parseOptions(method, model, options);

    //   // Trigger the pending event if the conditions are met
    //   // this.triggerPendingEvent(options);

    //   // Set the state to loading
    //   // this.updateState(AppConstants.STATE_PENDING);

    //   // Store the options object
    //   this._previousOptions = _.clone(options);

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
    //       console.log('model.getState()  = ', model.getState());
    //       // Show the error message except for abort.
    //       // if (model.getState() !== 'Cancel') {
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

    // Set page count in the url to handle pagination
    setPageCount: function(page) {
      var pageTempl = _.template(DataURLConstants.PAGE_COUNT, {
        pageCount: page
      });
      this.urlRoot = this.urlRoot + '&' + pageTempl;
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

  // Returns the BaseCollection class
  return BaseCollection;
});
