//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// NamespaceManager controls the Nutanix global namespace. It acts as a broker
// between the UI components and the global window object. Nested namepacing
// is also managed in this component.
//
// Nutanix global namespace: window.nutanix.ns
//
define(function() {

  'use strict';

  return {

    // Properties
    //------------

    // APP ROUTER
    // ----------
    // This property handles all the global page routes and renders it to the
    // global application view.
    APP_ROUTER : 'appRouter',
    appRouter : null,

    // APP VIEW
    // --------
    // This property is the namespace for getting the global AppView. There
    // are components that need to call the global AppView object directly.
    APP_VIEW : 'appRouter.appView',

    // Idle Session Manager
    IDLE_MANAGER : 'idleManager',

    // Functions
    //----------

    // Initialize the Namespace manager
    initialize: function() {
      window.nutanix = window.nutanix || {};
      window.nutanix.ns = this;
    },

    // Retrieve a global property by parsing the string namespace prop and
    // automatically get the nested namespace value.
    // @param prop  - Name of the global property which should be a constant
    //                in this class. It could also be nested namespaces.
    //                e.g.: 'appRouter.appView' is equivalent to
    //                       window.nutanix.ns.appRouter.appView
    get : function(prop) {
      var parts = prop ? prop.split('.') : '',
          parent = window.nutanix.ns,
          pl = parts.length;
      // Check if empty
      if (_.isEmpty(parts)) {
        return;
      }

      // Look for nested namespaces
      for (var i=0; i < pl; i++) {
        if (parent) {
          parent = parent[parts[i]];
        } else {
          return;
        }
      }
      return parent;
    },

    // Set a global property by parsing the string namespace prop and
    // automatically generating nested namespaces.
    // @param prop  - Name of the global property which should be a constant
    //                in this class. It could also be nested namespaces.
    //                e.g.: 'appRouter.appView.currentPageUuid'
    // @param value - Value that will be set in the namespace.
    set : function(prop, value) {
      var parts = prop ? prop.split('.') : '',
          parent = window.nutanix.ns,
          pl = parts.length;
      // Check if empty
      if (_.isEmpty(parts)) {
        return;
      }
      // Set the nested namespaces
      for (var i=0; i < pl; i++) {
        // Create a property if it doesn't exist except the last namespace
        if (typeof parent[parts[i]] === 'undefined' && (i + 1) !== pl) {
          parent[parts[i]] = {};
        }
        // Set the value on the last namespace
        if ((i + 1) === pl) {
          parent[parts[i]] = value;
        }
      }
    }
  };
});