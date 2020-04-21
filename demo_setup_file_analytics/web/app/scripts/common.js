//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// Loads common AMD modules. For applications to use in main.js to ensure that
// common modules are loaded before app sources reference them.
//

require(
  [
    'backbone',
    'jquery',
    'bootstrap',
    'jqueryplugins',
    'underscore'
  ],
  function(
    $,
    Backbone,
    Bootstrap,
    jqueryplugins,
    _
  ) {

    'use strict';

  }
);
