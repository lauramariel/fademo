//
// Copyright (c) 2012 Nutanix Inc. All rights reserved.
//
// SubView helper is a utility to help centralize sub view operations.
//
/*global $: false, _: false, window: false, define: false */
//
define([
  'models/base/BaseModel'
  // 'utils/AppUtil'
  ],
  function(
    BaseModel
    // AppUtil
     ) {

    'use strict';

    var SubViewHelper = BaseModel.extend( {

      // map of sub-view id to sub-view
      subViews: null,

      initialize: function() {
        // AppUtil.debug('SubViewHelper initialize cid:' + this.cid);
        this.subViews = {};
      },

      destroy: function() {
        // AppUtil.debug('SubViewHelper destroy cid:' + this.cid);
        this.removeAll();
      },

      // register a subview by id
      register: function(id, subView) {
        // AppUtil.debug('SubViewHelper register id:' + id + " cid:" + this.cid);
        this.subViews[id] = subView;
      },

      // get sub view by id
      get: function(id) {
        return this.subViews[id];
      },

      // Get IDS of all registered views
      getIds: function() {
        return _.keys(this.subViews);
      },

      // render subView with given id
      // @return subView.render() if found, null otherwise
      render: function(id) {
        // AppUtil.debug('SubViewHelper render id:' + id + " cid:" + this.cid);
        var subView = this.get(id);
        if ( subView && subView.render ) {
          return subView.render();
        }
        return null;
      },

      renderAll: function() {
        // AppUtil.debug('SubViewHelper renderAll cid:' + this.cid);
        return this.iterate('render');
      },


      // Show the view and start its services.
      // @param id String containing the id of the view.
      start: function (id) {
        var subView = this.get(id);
        if (!subView) {
          return;
        }

        // Show the view
        subView.showView();

        // Then start its services
        subView.startServices();
      },

      // Hide the view and stop its services.
      // @param id String containing the id of the view.
      stop: function (id) {
        var subView = this.get(id);
        if (!subView) {
          return;
        }

        // Hide the view
        subView.hideView();

        // Then stop its services
        subView.stopServices();
      },

      // Iterate over all sub views, invoking a named function if it
      // is available in the subView.
      //
      // @param functionName - Name of function to call on all subViews
      // @param ...args - Arguments to pass to the function call
      // @returns Array of return values for all function calls.
      //
      // TODO: Uncomment function arguments once Babel is checked in and we
      // can use ES6 rest parameters.
      iterate: function(/* functionName, ...args */) {
        var args = Array.prototype.slice.call(arguments);
        var functionName = args.shift();

        // AppUtil.debug('SubViewHelper iterate cid:' + this.cid +
                    // ' functionName:' + functionName);
        return _.map(this.subViews, function(subView) {
          return (_.isFunction(subView[functionName])) ?
            subView[functionName].apply(subView, args) : null;
        });
      },

      // remove all registered subviews
      removeAll: function() {
        // AppUtil.debug('SubViewHelper removeAll cid:' + this.cid);
        this.iterate("destroy");
        this.subViews = {};
      },

      // get sub view by id
      remove: function(id) {
        // AppUtil.debug('SubViewHelper remove id:' + id + " cid:" + this.cid);
        var subView = this.get(id);
        if (subView && subView.destroy) {
          subView.destroy();
        }
        delete this.subViews[id];
      },

      // Returns a boolean indicating if this instance has any views registered.
      isEmpty: function () {
        return _.size(this.subViews) === 0;
      }

    });

    return SubViewHelper;

  }
);
