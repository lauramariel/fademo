//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// Set the base Require.js configuration for Aphrodite sources.
// Anteros projects can override/extend any configuration with a second
// require.config({...}) call after this config.js module is loaded.
//
/* eslint strict: "off" */

'use strict';

require.config({
  // Increasing the timeout to 30 sec to fix timeout during development
  // on single node cluster. This will not affect production as we use
  // minified code.
  waitSeconds : 30,

  // See conditional dev mode at bottom of file for disabling this.
  // urlArgs: '_=@@uiVersion',

  paths: {

    // FileAnalytics
    //----------

    events           : 'app/scripts/events',
    models           : 'app/scripts/models',
    collections      : 'app/scripts/collections',
    routers          : 'app/scripts/routers',
    utils            : 'app/scripts/utils',
    data             : 'app/scripts/data',
    views            : 'app/scripts/views',
    managers         : 'app/scripts/managers',
    components       : 'app/scripts/components',

    // Shortcut so we can put our HTML templates outside the scripts dir
    templates        : 'app/templates',

    // Shortcut so we can put stuff into the extras folder
    extras           : 'app/extras',

    // NutanixJQueryPlugins --  Custom plugins for jQuery by Nutanix
    jqueryplugins    : 'app/scripts/plugins/jqueryplugins',

    // Libraries
    //----------

    // Third party script alias names. Typing 'jquery' is better
    // than 'lib/jquery/jquery'.

    // Core Libraries
    jquery           : 'lib/jquery/jquery.min',
    underscore       : 'lib/underscore/underscore-min',
    backbone         : 'lib/backbone/backbone-min',
    bootstrap        : 'lib/bootstrap/bootstrap.min',

    // D3 and Related Libraries
    d3               : 'lib/d3/d3.v3',
    nv               : 'lib/nvd3/nvd3',

    // Progress bars
    progressBar      : 'lib/progress-bar/progressbar',

    // Datagrid Library
    datatable       : 'lib/datatables/jquery.dataTables',
    colresize       : 'lib/colresize/dataTables.colResize',

    // Gridster library
    gridster         : 'lib/gridster/js/jquery.gridster',

    // Widget Libraries:
    // AntiScroll --  A thin scroller library.
    antiscroll       : 'lib/antiscroll/js/antiscroll',

    // DatePicker --  Bootstrap Datepicker.
    datepicker       : 'lib/datepicker/js/bootstrap-datepicker',

    // FancySelect --  Used for styling select tags (replacing them).
    fancySelect      : 'lib/fancy-select/fancySelect',

    // Moment -- Used for date time format with local and timezone support
    moment           : 'lib/moment/moment-with-locales.min',
    momentTimeZone   : 'lib/moment/moment-timezone-with-data.min',

    // Components
    //----------

    // nutanixListDropdown -- Component of dropdown with list filter
    // nutanixListDropdown:
    //     'lib/nutanix/components/' +
    //     'list-dropdown/nutanixListDropdown',

    // nutanixMoreInfo -- Adds (?) or (i) icon and associated tooltip
    nutanixMoreInfo  : 'lib/nutanix/components/more-info/moreInfo'
  },

  // Configuration for third party scripts that are not AMD compatible
  shim: {
    // Exports 'underscore' to '_' for libraries (like Flotr) to use it
    underscore: {
      exports: '_'
    },

    // Attaches 'Backbone' to the window object
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },

    // Attaches 'Bootstrap' to the window object
    bootstrap: {
      deps: ['jquery'],
      exports: 'Bootstrap'
    },

    // Attaches 'DataTables' to the window object
    datatable: {
      deps: ['jquery'],
      exports: 'DataTables'
    },

    // Attaches 'Gridster' to the window object
    gridster: {
      deps: ['jquery'],
      exports: 'Gridster'
    },

    // Attaches 'AntiScroll' to the window object
    antiscroll: {
      deps: ['jquery'],
      exports: 'antiscroll'
    },

    // Attaches 'DatePicker' to the window object
    datepicker: {
      deps: ['jquery'],
      exports: 'DatePicker'
    },

    // Attaches 'FancySelect' to the window object
    fancySelect: {
      deps: ['jquery'],
      exports: 'fancySelect'
    },

    // Attaches 'jqueryplugins' plugins to the window object
    jqueryplugins: {
      deps: ['jquery'],
      exports: 'jqueryplugins'
    },

    // Attaches the 'd3' library to the window object
    d3: {
      exports: 'd3'
    },

    // Attaches the 'nv' library to the window object
    nv: {
      deps: ['d3'],
      exports: 'nv'
    },

    // Shim the nutanixMoreInfo component
    nutanixMoreInfo: {
      deps: ['underscore', 'jquery', 'bootstrap'],
      exports: 'nutanixMoreInfo'
    },

    // Attaches 'moment' to the window object
    moment: {
      exports: 'moment'
    },

    // Attaches 'momentTimeZone' library to the window object
    momentTimeZone: {
      deps: ['moment'],
      exports: 'momentTimeZone'
    }
  }
});

// Cache bust disable
if (localStorage &&
    localStorage.getItem &&
    localStorage.getItem('disable_cache_busting') === 'true') {
  // An empty string prevents the cache busting from happening
  require.config({
    urlArgs: ''
  });
}
