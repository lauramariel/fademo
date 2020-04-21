//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AutoCompleteSearchView is used for rendering autocomplete
// results element.
//

define([
  // Core
  'views/base/BaseView',
  // Utils
  'utils/CommonTemplates'],
function(
  // References of core
  BaseView,
  // References of utils
  CommonTemplates) {
  'use strict';

  // Precompiled templates.
  var itemTemplate = _.template(
    '<a class="btnPageAction">' +
      '<span id="n-spotlight-result" title="<%= titleText %>"' +
        'class="n-spotlight-search">' +
        '<%= result %>' +
      '</span>' +
    '</a>'),

      autoCompleteResults = '<div class="auto-complete-results"></div>';


  // Extending the BaseView
  var AutoCompleteSearchView = BaseView.extend({

    // Properties
    // Name for logging and transltion purposes
    name: 'AutoCompleteSearchView',

    // The parent element of the results element.
    el: null,

    // Used for tracking which menu item is active (ie has focus).
    active: false,

    // Events Listeners
    //-----------------

    // @inherited
    events: {
      'mousedown .n-menu-item': 'onSelect'
    },

    // Functions
    //----------

    // @inherited
    // Constructor
    initialize: function(options) {
      _.bindAll(this, 'onSelect');

      if (options) {
        this.wrapperEl = options.wrapperEl || $('body');
        this.containerEl = options.containerEl;
        if (options.el) {
          // If el is being passed, use it.
          this.$el = options.el;
        } else {
          // use the default template.
          this.wrapperEl.append(autoCompleteResults);
          this.$el = $('.auto-complete-results');
        }
      }
      this.render();
    },

    // Render the top level elements.
    render: function() {
      var ul = $('<ul>').addClass('n-spotlight-list');
      this.$el.addClass('n-spotlight-results');
      this.$el.append(CommonTemplates.ANTISCROLL);
      this.$('.box-inner').append(ul);
      this.$el.hide();
    },

    // Hide the spotlight results and deactivate the active menu item.
    close: function() {
      if (this.$el.is(':visible')) {
        this.$el.hide();
        this.$el.removeClass('active');
        this.deactivate();
      }
    },

    // Main entry point into this view which is called by SpotlightView when
    // the results have returned from the server.
    suggest: function(items) {
      $('.n-spotlight-list').empty();
      // Renders the results.
      this._renderMenu(items);
      this.deactivate();
      // Activate or deactivate menu on mouse action.
      this.refresh();
    },

    clearItems: function() {
      $('.n-spotlight-list').empty();
    },

    // Render the main content of this view using the returned search
    // results.
    _renderMenu: function(items) {
      var searchString = '',
          ul = $('.n-spotlight-list');
      if (items && items[0]) {
        searchString = items[0];
      }
      if (items.length === 0) {
      // Empty out the array so nothing else is displayed and continue.
        items = [];
        searchString = null;
        this.$el.hide();
      }
      var _this = this;
      _.each(items, function(item) {
        _this._renderItem(ul, item, searchString);
      });
    },

    // Highlight the search term within a search result.
    _highlightWordsNoCase: function(haystack, needle) {
      // convert to upper case for the search to make this part case
      // insensitive
      var haystack_upper = haystack.toUpperCase(),
          needle_upper = needle.toUpperCase();

      // handle special characters: .*+?|()[]{}\$^
      var specials = /[.*+?|()[\]{}$^]/g;
      var regex = new RegExp('(' +
        needle_upper.replace(specials, '\\$&') + ')', 'gi');
      var index = haystack_upper.search(regex);

      if (index === -1) {
        return haystack;
      }

      // Since we apply HTML to highlight the word, then we need to escape
      // portions of the result.
      var replace = '<span class="n-spotlight-search-hit">' +
        _.escape(haystack.substr(index, needle.length)) +
        '</span>';
      return _.escape(haystack.substr(0, index)) +
        replace + _.escape(haystack.substr(index + needle.length));
    },

    // Render an individual search result.
    _renderItem: function(ul, item, searchString) {
      var obj = {};
      obj.result = this._highlightWordsNoCase(item,
        searchString);
      obj.titleText = item;
      return $('<li>')
        .append(itemTemplate(obj))
        .appendTo(ul);
    },

    // Refresh the search result attributes and set up the handlers for
    // mouse events.
    refresh: function() {
      var _this = this;
      // don't refresh list items that are already adapted
      var items = this.$('.n-spotlight-list')
        .children('li:not(.n-menu-item):has(a)')
        .addClass('n-menu-item');

      items.children('a').attr('tabindex', -1)
      // mouseenter doesn't work with event delegation
        .mouseenter(function(event) {
          _this.activate(event, $(this).parent());
        })
        .mouseleave(function() {
          _this.deactivate();
        });
    },

    // Destroy this view.
    destroy: function() {
      this.$el.remove();
      // Call super destroy
      BaseView.prototype.destroy.apply(this, arguments);
    },

    // @override
    // Default select handler logic which may be overridden.
    selectHandler: function(event, resultObj) {
      this.containerEl.val(resultObj);
      this.selectCleanUp(event);
    },

    // Perform clean up after a search result has been selected and
    // processed.
    selectCleanUp: function(event) {
      // Fire a spotlight cleanup event in case the parent view needs to do
      // cleanup.
      $('.n-spotlight-control').trigger('SPOTLIGHT_CLEANUP');
      this.close(event);
    },

    // Return a boolean indicating the presence of a scroll bar.
    hasScroll: function() {
      return this.$('.box-wrap').height() <
        this.$('.antiscroll-inner').height();
    },

    // Activate the passed in menu item (this happens when the user either
    // keys to a menu item or hovers over it with the mouse).
    activate: function(event, item) {
      this.deactivate();
      this.active = item.eq(0)
        .children('a')
        .addClass('n-hover')
        .attr('id', 'n-active')
        .end();
    },

    // Deactivate the currently active menu item.
    deactivate: function() {
      if (!this.active) { return; }
      this.active.children('a')
        .removeClass('n-hover')
        .removeAttr('id');
      this.active = null;
    },

    // Event Handlers
    //---------------
    // Execute the action based on the menu item selected (by either mouse or
    // keyboard)
    onSelect: function(event, menuItem) {
      if (!menuItem) {
        menuItem = $(event.currentTarget).children('a')
          .children('span')
          .attr('title');
      }
      this.selectHandler(event, menuItem);
    }
  });
  return AutoCompleteSearchView;
});
