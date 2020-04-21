//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// Serve resources like JS, CSS and HTML files
//

// var lessMiddleware = require('less-middleware');
var path = require('path');
var express = require('express');
var log = console.log.bind(console);

var Resources = function () {};

Resources.prototype.setupResources = function (env, app, nutanix_dev_dir) {
	// Load and configure less.
	// app.use(lessMiddleware({
 //    src:  path.join(nutanix_dev_dir, env.app_src, 'assets/styles/includes/less'),
 //    // src:  path.join(nutanix_dev_dir, 'less'),
 //    // dest: path.join(nutanix_dev_dir, 'css'),
 //    dest: path.join(nutanix_dev_dir, env.app_src, 'assets/styles/css'),
 //    // prefix: path.join('/', 'css'),
 //    prefix: path.join(nutanix_dev_dir, env.app_src, 'css'),
 //    compress: false,
 //    // debug: env.debugMode,
 //    // force true recompiles on every request... not the
 //    // best for production, but fine in debug while working
 //    // through changes
 //    force: true
 //  }));

  // This line must be after less.
  app.use(express['static'](nutanix_dev_dir));
  // app.use(express.static('../app'));
};

module.exports = new Resources();
