//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// The starting point of the main application.
//

// Analytics App
//----------
// Set the Require.js configuration for the application.
require(['app/scripts/config'], function() {

  'use strict';

  // Load common modules.
  require(['app/scripts/common'], function() {

    // Kick-off the application.
    require([
      'backbone',
      'views/AppView',
      'app/scripts/AppRouter',
      'managers/NamespaceManager'],
      function(
        Backbone,
        AppView,
        AppRouter,
        NamespaceManager) {

        // Initialize NamespaceManager to create the Nutanix global namespace.
        NamespaceManager.initialize();

        // Create the global router that will provide the
        // functionalities for routing client-side pages and
        // connecting them to actions and events.
        // Then set it to the Nutanix global namespace.
        NamespaceManager.set(
          NamespaceManager.APP_ROUTER,
          new AppRouter({ appView: new AppView() })
        );

        // Kick-off the application!
        NamespaceManager.get(NamespaceManager.APP_ROUTER).initApp();

        // Start watching for hashchange events.
        Backbone.history.start();
      }
    );
  });
});
