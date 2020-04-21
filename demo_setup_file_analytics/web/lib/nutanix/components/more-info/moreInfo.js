//
// Copyright (c) 2016 Nutanix Inc. All rights reserved.
//
// Nutanix More Info Plugin
//
// A jQuery plugin to create the More Info tooltip component in the Prism UI.
//
// Dependencies:
// jQuery, Underscore, Bootstrap tooltip plugin
//
// Example:
// this.$(element).nutanixMoreInfo({
//   // GENERAL
//   id: Math.random().toString(36).substr(2, 8),
//   icon: 'question-tooltip',
//   renderMethod: 'html',
//   parseDataAttrs: false, // gets tooltip params from data attributes
//
//   // TEMPLATES
//   componentTmpl: '<span>Custom template here.</span>',
//   iconTmpl: '<svg>Custom icon here.</svg>', // or SVG.SVGIcon('Bolt')
//
//   // TOOLTIP
//   animation : true,
//   classes   : [],
//   container : 'body',
//   html      : true,
//   placement : 'top',
//   template  : '<div class="tooltip -non-interactive">' +
//       '<div class="tooltip-arrow"></div>' +
//       '<div class="tooltip-inner"></div>' +
//     '</div>',
//   title     : '',
//   trigger   : 'hover'
// });
//
// Use trigger: 'hoverable' to use the 'hoverable' extended trigger of the
// underlying tooltip which makes it hoverable with the mouse
//

(function ($) {

  // Test for Object.create support and fallback for browsers without it
  // --------------------
  if (typeof Object.create !== 'function') {
    Object.create = function (o) {
      function F() {}
      F.prototype = o;
      return new F();
    };
  }

  // Plugin templates
  // --------------------
  var svgTmpl = "<svg viewBox=\"0 792 2048 2048\"" +
                "  class=\"svg-icon <%= className %> -id-<%= icon %>\"" +
                "  <%= attributes %>>" +
                "  <use xmlns:xlink=\"http:\/\/www.w3.org\/1999\/xlink\"" +
                "      xlink:href=\"#<%= icon %>\">" +
                "  <\/use>" +
                "<\/svg>";

  var componentTmpl = "<span class=\"more-info" +
                      "             <%= '-'+tooltip.placement %>" +
                      "             <%= classes.join(' ')%>\"" +
                      "      id=\"<%= id %>\"" +
                      "      <% _.each( tooltip, function(value, key) { %>" +
                      "        <%= 'data-' + key + '=\"' + _.escape(value) + '\" ' %>" +
                      "      <% }) %>" +
                      ">" +
                      "  <%= iconTmpl %>" +
                      "<\/span>";

  // Plugin object model
  // --------------------
  var plugin = {

    // Properties
    // ----------
    name: 'nutanixMoreInfo',

    // This will be replaced with the element this plugin is called on
    el: null,
    tooltipSourceEl: null,

    // This will be replaced with the rendered component template
    renderedTmpl: '',

    defaults: {
      // GENERAL
      id: 0,
      icon: 'question-tooltip',
      renderMethod: 'html',

      // TEMPLATES
      componentTmpl: componentTmpl,
      iconTmpl: svgTmpl,

      // TOOLTIP
      animation : true,
      classes   : [],
      container : 'body',
      html      : true,
      placement : 'top',
      template  : '<div class="tooltip -non-interactive">' +
          '<div class="tooltip-arrow"></div>' +
          '<div class="tooltip-inner"></div>' +
        '</div>',
      title     : '',
      trigger   : 'hover'
    },

    // This will be replaced with the merged defaults and passed-in params
    options: {},

    // Functions (Public)
    // ----------

    initialize: function(params, el) {
      this.defaults.id = Math.random().toString(36).substr(2, 8);
      this.defaults.container = '#'+this.defaults.id;

      // Merge passed-in params into defaults
      this.options = $.extend({}, this.defaults, params);

      // Get tooltip and source element options from the source element's data
      // attributes and merge into this.options
      if (this.options.parseDataAttrs) {
        $.extend(this.options, this._getParsedDataAttrs(el));
      }

      // Reformat the options object so that we can loop through the tooltip
      // parameters and assign them as data-* attributes.
      var tmplOptions = {
        classes  : this.options.classes,
        icon     : this.options.icon,
        iconTmpl : _.template(this.options.iconTmpl,
                              { icon: this.options.icon,
                                className: 'more-info-icon',
                                attributes: '' }),
        id       : this.options.id,
        tooltip  : {
          animation : this.options.animation,
          container : this.options.container,
          html      : this.options.html,
          placement : this.options.placement,
          template  : this.options.template,
          title     : this.options.title,
          trigger   : (this.options.trigger === 'hover' ?
                       'manual' :
                       this.options.trigger)
        }
      };

      // Initialize component template
      this.renderedTmpl = _.template(this.options.componentTmpl, tmplOptions);

      // Save the element that the plugin was initialized on
      this.el = el;

      // Add plugin name to the element for easy selection
      this.el.addClass(this.name);

      this.render();

      return this; // so we can save the initialized object model to the element
    },

    render: function() {
      switch (this.options.renderMethod) {
        case 'prepend':
          this.el.prepend(this.renderedTmpl);
          break;
        case 'append':
          this.el.append(this.renderedTmpl);
          break;
        default:
          this.el.html(this.renderedTmpl);
      }

      this.tooltipSourceEl = this.el.children('.more-info');

      if (this.options.trigger === 'hover') {
        this.tooltipSourceEl.on('mouseenter', this.onMouseenter.bind(this));
        this.tooltipSourceEl.on('mouseleave', this.onMouseleave);
      }
      else {
        this.tooltipSourceEl.tooltip();
      }
    },

    destroy: function() {
      this.tooltipSourceEl.tooltip('destroy');
      if (this.options.trigger === 'hover') {
        this.tooltipSourceEl.off('mouseenter', this.onMouseenter.bind(this));
        this.tooltipSourceEl.off('mouseleave', this.onMouseleave);
      }
      this.el.removeData(this.name);
    },

    // Functions (Event Handlers)
    // ----------

    onMouseenter: function(e) {
      var $target = $(e.currentTarget);
      // Show tooltip only if it enabled
      if (this._isEnabled($target)) {
        $target.tooltip();
        $target.tooltip('show');
      }
    },

    onMouseleave: function(e) {
      var $target = $(e.currentTarget);
      // We are destroying the tooltip here instead of just hiding it to
      // prevent buggy tooltip behavior. If you repeatedly trigger the tooltip
      // by moving your mouse on and off the icon really fast, the tooltip
      // glitches and flips it's behavior - mouseenter hides and mouseleave
      // shows and then hides.
      $target.tooltip('destroy');
    },

    // Functions (Private)
    // ----------

    // Checks if current tooltip located in enabled element
    // @return {Boolean}
    _isEnabled: function(el) {
      return el.closest('.disabled').length === 0;
    },

    // Gets the relevant data attributes from the plugin source element
    // @param  {object} el - jQuery element
    // @return {object} - An object of selected data attributes and values
    _getParsedDataAttrs: function(el) {
      return {
        animation : el.data('tooltipAnimation'),
        classes   : this._parseClasses(el.data('tooltipClasses')),
        container : el.data('tooltipContainer'),
        html      : el.data('tooltipHtml'),
        icon      : el.data('tooltipIcon'),
        placement : el.data('tooltipPlacement'),
        template  : el.data('tooltipTemplate'),
        title     : el.data('tooltipTitle'),
        trigger   : el.data('tooltipTrigger')
      };
    },

    // Parses the data-tooltip-classes attribute to build an array of classes
    // @param  data - The result of jQuery's el.data()
    // @return {array} - An array of classes to add to the tooltip source.
    _parseClasses: function(data) {
      if (typeof data === 'undefined') {
        return undefined;
      }

      return String(data).split(',');
    }
  };

  // Initialization
  // --------------------
  // Creates the nutanixMoreInfo jQuery plugin
  // @param  params - Object of plugin options || 'destroy'
  // @return {object} - The element(s) the plugin was called on.
  $.fn.nutanixMoreInfo = function(params) {
    var elements = this;

    if (params === 'destroy') {
      // Return the elements to maintain chainability
      return elements.each(function() {
        var $el = $(this);

        if (typeof $el.data(plugin.name) !== 'undefined') {
          $el.data(plugin.name).destroy();
        }
      });
    }

    // Return the elements to maintain chainability
    return elements.each(function() {
      var $el = $(this);

      // Check if the plugin has already been initalized on this element
      if (!$el.data(plugin.name)) {

        // Initialize the plugin and save the initalization state
        $el.data(plugin.name, Object.create(plugin).initialize(params, $el));

      }
    });

  };

})(jQuery);
