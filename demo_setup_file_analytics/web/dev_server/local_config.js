//
// Copyright (c) 2013 Nutanix Inc. All rights reserved.
//
// Environment and configuration for node aphrodite application and proxy
// servers.
//
// jsHint options on the next lines
/*global define: false, require: false */
/*jshint globalstrict: true, node: true */
'use strict';

var fs = require('fs')
var env = {

    // Config settings for the app script.
    app: {
        // Listener port #
        listenerPort: 3050,
        // Debug Mode true/false
        // debugMode: true,
        mockData: true,

        // Library directory.
        // Do NOT edit the below placeholder in this file. Copy the dev_server
        // folder and then edit this file.
        // nutanix_lib_dir: '/home/sahil/main/prism/aphrodite/grunt/release',
        // nutanix_lib_dir: '/home/sahil/workspace_ecosystem/ecosystem/experimental/AFS_Analytics/web',
        // Project directory
        // Do NOT edit the below placeholder in this file. Copy the dev_server
        // folder and then edit this file.
        // nutanix_dev_dir: '/home/sahil/main/prism/aphrodite/web',
        // nutanix_dev_dir: '/home/sahil/workspace_ecosystem/ecosystem/experimental/AFS_Analytics/web',
        // App source
        app_src: 'app/',
        // Hot scale up status json file
        memory_change: '/mnt/containers/logs/memory_change_status.json',
        // App source
        // app_src: '../web/',
        // Minified directory
        // ([path-to]/workspace/main/prism/aphrodite/grunt/release)
        // Do NOT edit the below placeholder in this file. Copy the dev_server
        // folder and then edit this file.
        // nutanix_minified_dir : '/home/sahil/main/prism/aphrodite/grunt/release',

        // Enable LESS middleware to compile the stylesheets just-in-time.
        // Note, set to false if you are using "grunt develop".
        compileStyles: true,
        options: {
          // cert: fs.readFileSync('/mnt/containers/config/certs/cert.pem'),
          // key: fs.readFileSync('/mnt/containers/config/certs/key.pem')
        }
    }
};

module.exports = env;
