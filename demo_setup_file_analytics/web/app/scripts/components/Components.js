//
// Copyright (c) 2015 Nutanix Inc. All rights reserved.
//
// A library of default UI components
//
//
define(
  [
    // Utils
    'utils/AppUtil',
    'utils/SVG',
    'utils/AppConstants',
    // Templates
    'text!templates/basecomponents/checkboxes/default.html',
    'text!templates/basecomponents/radio/default.html',
    'text!templates/basecomponents/select/default.html',
    'text!templates/basecomponents/buttons/default.html',
    'text!templates/basecomponents/icons/menu.html',
    'text!templates/basecomponents/icons/circles.html',
    'text!templates/basecomponents/icons/grid.html',
    'text!templates/basecomponents/icons/plus.html',
    'text!templates/basecomponents/icons/minus.html',
    'text!templates/basecomponents/icons/square.html',
    'text!templates/basecomponents/dropdowns/default.html',
    'text!templates/basecomponents/bubbles/default.html',
    'text!templates/basecomponents/popover/default.html'
  ],
  function(
    // Utils
    AppUtil,
    SVG,
    AppConstants,
    // Templates
    checkboxDefault,
    radioDefault,
    selectDefault,
    buttonDefault,
    iconMenu,
    iconCircles,
    iconGrid,
    iconPlus,
    iconMinus,
    iconSquare,
    dropdownDefault,
    bubbleDefault,
    popoverDefault) {

    'use strict';

    // Precompiled Templates
    var checkboxDefaultTemplate = _.template(checkboxDefault),
        selectDefaultTemplate = _.template(selectDefault),
        radioDefaultTemplate = _.template(radioDefault),
        buttonTemplate = _.template(buttonDefault),
        css_icon_menu = _.template(iconMenu),
        css_icon_circles = _.template(iconCircles),
        css_icon_grid = _.template(iconGrid),
        css_icon_plus = _.template(iconPlus),
        css_icon_minus = _.template(iconMinus),
        css_icon_square = _.template(iconSquare),
        dropdownDefaultTemplate = _.template(dropdownDefault),
        bubbleDefaultTemplate = _.template(bubbleDefault),
        popoverDefaultTemplate = _.template(popoverDefault);

    // TEMPLATES
    //----------

    var defaultIconTmpl = _.template(
      '<%= SVG.CheckboxDefault %>'
    );

    var favoriteStarIconTmpl = _.template(
      '<%= SVG.SVGIcon("Star_Empty", "star") %>' +
      '<%= SVG.SVGIcon("Star", "star-favorite") %>'
    );

    // Component Event Handlers
    //-------------------------

    // On click drop down callback when click on drop down menu
    var onClickDropdownOption = function(ev){
      var option = $(ev.currentTarget);
      // Update the drop down toggle to the selected menu item
      $(ev.currentTarget)
        .closest('.dropdown')
        .find('.dropdown-toggle > .text')
        .html(option.html());
    };

    // Remove the bubble when close button is clicked
    var onClickBubbleClose = function(e) {
      $(e.currentTarget).parent().remove();
    };

    // Component Events Object
    var events = {
      'click .dropdown-menu > li > a:not([disabled])': onClickDropdownOption,
      'click .filter-bubbles .close-btn': onClickBubbleClose
    };

    // Register all component event handlers on the document body.
    _.each(events, function(handler, selector) {
      // Regex to match an event selector of the form
      // "<event> <jQuery selector>"
      var eventParts = selector.match(/^(\S*)(.*)/);
      var eventId = eventParts[1];
      var eventSelector = eventParts[2];

      if (eventId && eventSelector && _.isFunction(handler)) {
        $('body').on(eventId, eventSelector, handler);
      }
    });

    // Template type
    var TEMPLATE_TYPES = {
      DEFAULT  : 'default',
      COMBOBOX : 'combobox',
      CIRCULAR : 'circular',
      FAVORITE : 'favorite',
      COMPACT  : 'compact',
      SELECT_SEARCHABLE: 'select_searchable',
      BUBBLE   : 'bubble'
    };

    // Components
    //-----------

    return {
      TEMPLATE_TYPES: TEMPLATE_TYPES,

      // Name for i18n and logging
      name : 'UIComponents',

      // Icons
      // This handles both CSS and SVG Icons automatically by ID.
      // If the id of the icon matches a CSS icon, that will be returned,
      // else an SVG with the passed id will be returned.
      icon: function(icon, className, attributes) {

        // CSS Icon Settings
        var cssIconSettings = {
          icon: icon,
          classes: className,
          attributes: attributes
        };

        // CSS Icons
        switch (cssIconSettings.icon) {
          case 'menu' :
            return css_icon_menu(cssIconSettings);
          case 'circles' :
            return css_icon_circles(cssIconSettings);
          case 'grid' :
            return css_icon_grid(cssIconSettings);
          case 'plus' :
            return css_icon_plus(cssIconSettings);
          case 'square' :
            return css_icon_square(cssIconSettings);
          case 'square-small' :
            cssIconSettings.classes += ' -small';
            return css_icon_square(cssIconSettings);
          case 'minus' :
            return css_icon_minus(cssIconSettings);
          case 'plus-small' :
            cssIconSettings.classes += ' -small';
            return css_icon_plus(cssIconSettings);
          case 'plus-large' :
            cssIconSettings.classes += ' -large';
            return css_icon_plus(cssIconSettings);
          case 'minus-large' :
            cssIconSettings.classes += ' -large';
            return css_icon_minus(cssIconSettings);
          case 'plus-thick' :
            cssIconSettings.classes += ' -thick';
            return css_icon_plus(cssIconSettings);
          case 'minus-thick' :
            cssIconSettings.classes += ' -thick';
            return css_icon_minus(cssIconSettings);
          case 'plus-large-thick' :
            cssIconSettings.classes += ' -large -thick';
            return css_icon_plus(cssIconSettings);
          case 'minus-large-thick' :
            cssIconSettings.classes += ' -large -thick';
            return css_icon_minus(cssIconSettings);
        }

        // SVG Icon
        var viewbox;
        switch (icon) {
          case 'exclamation_badge':
            viewbox = AppConstants.COMPONENTS.SVG.VIEWBOX.SIZE_12;
            className += ' -size-12';
            break;
          case 'Anomaly':
          case 'Constrained':
            viewbox = AppConstants.COMPONENTS.SVG.VIEWBOX.SIZE_10;
            break;

          default:
            viewbox = AppConstants.COMPONENTS.SVG.VIEWBOX.DEFAULT;
            break;
        }
        return SVG.SVGIcon(icon, className, attributes, viewbox);
      },

      // Checkbox
      // @param options is an object of options to pass to the checkbox html
      // defaults are set below
      checkbox: function(options) {
        var defaultSettings = {
          type        : TEMPLATE_TYPES.DEFAULT,
          id          : AppUtil.randomId('ID'),
          partialCheck: false,
          checked     : false,
          disabled    : false,
          jsClasses   : '',
          value       : '',
          typeClasses : 'n-checkbox svg-n-checkbox',
          classes     : '',
          variants    : '',
          attributes  : '',
          name        : '',
          SVG,
          iconTmpl    : defaultIconTmpl({ SVG: SVG }),
          stringParams: false,
          labelText   : '',
          // Need special dataTestAttribute for checkboxes since attributes
          // are applied to a hidden input element and selenium can't click
          // elements that are hidden. If using this property directly instead
          // of through attributes, make sure data-test= is prepended
          dataTestAttribute: ''
        };

        if (typeof options === 'string') {
          options = this.parseStringParams(options);
        }

        var settings = $.extend(defaultSettings, options);

        if (settings.attributes) {
          // Regex should match the different ways data-test attribute can be written
          // Ex. data-test="id", data-test='id', data-test=id
          const dataTestRegex = new RegExp('data-test=\\S+');
          const dataTestMatch = dataTestRegex.exec(settings.attributes);
          // If there is a data-test attribute in attributes property, remove
          // it and add it to a special dataTestAttribute property
          if (dataTestMatch) {
            settings.dataTestAttribute = dataTestMatch[0];
            settings.attributes =
              settings.attributes.replace(dataTestMatch[0], '');
          }
        }

        var checkboxTemplate;

        // Choose template based on type
        switch (settings.type) {
          case TEMPLATE_TYPES.DEFAULT:
          case TEMPLATE_TYPES.CIRCULAR:
            checkboxTemplate = checkboxDefaultTemplate;
            break;
          case TEMPLATE_TYPES.FAVORITE:
            settings.typeClasses = 'favorite-star';
            settings.iconTmpl = favoriteStarIconTmpl({ SVG: SVG });
            checkboxTemplate = checkboxDefaultTemplate;
            break;
          default:
          // do nothing
            break;
        }
        return checkboxTemplate(settings);
      },

      // Checkbox util functions
      // Sets a parially selected state for a checkbox
      // @param checkboxEl - the checkbox element
      checkboxSetPartialSelect: function(checkboxEl) {
        checkboxEl.addClass('partial-check');
      },

      // Removes the partially selected state from a checkbox
      // @param checkboxEl - the checkbox element
      checkboxUnsetPartialSelect: function(checkboxEl) {
        checkboxEl.removeClass('partial-check');
      },

      // Radio Button
      // @param options is an object of options to pass to the radio html
      // defaults are set below
      radio: function(options){

        var defaultSettings = {
          type        : TEMPLATE_TYPES.DEFAULT,
          name        : '',
          id          : AppUtil.randomId('ID'),
          checked     : false,
          disabled    : false,
          typeClasses : 'n-radio',
          classes     : '',
          jsClasses   : '',
          variants    : '',
          attributes  : '',
          value       : '',
          SVG         : SVG,
          iconTmpl    : '',
          stringParams: false,
          labelText   : ''
        };

        if (typeof options === "string") {
          options = this.parseStringParams(options);
        }


        var settings = $.extend(defaultSettings, options);

        var radioTemplate;

        // Choose template based on type
        switch(settings.type) {
          case TEMPLATE_TYPES.DEFAULT:
            radioTemplate = radioDefaultTemplate;
            break;
          case TEMPLATE_TYPES.FAVORITE:
            settings.typeClasses = "favorite-star";
            settings.iconTmpl = favoriteStarIconTmpl({SVG: SVG});
            radioTemplate = radioDefaultTemplate;
            break;
          default:
            // do nothing
            break;
        }

        return radioTemplate(settings);
      },

      // Select Box
      // @param options is an object of options to pass to the select html
      // defaults are set below
      select: function(options) {

        const variantListDefinitions = {
          'bottom-anchor' : 'fancy-select-bottom-anchor'
        };

        let variantsList = options.variants || '';

        variantsList = variantsList.split(/\s+/);
        for (var i = 0; i < variantsList.length; i++) {
          if (variantListDefinitions.hasOwnProperty(variantsList[i])) {
            variantsList[i] = variantListDefinitions[variantsList[i]];
          }
        }
        options.variants = variantsList.join(' ');

        const defaultSettings = {
          type      : TEMPLATE_TYPES.DEFAULT,
          id        : AppUtil.randomId('ID'),
          options   : [],
          disabled  : false,
          jsClasses : '',
          classes   : '',
          variants  : '',
          attributes: '',
          useBrowserSelect: false
        };
        const settings = $.extend(defaultSettings, options);
        let selectTemplate;

        switch (settings.type) {
          case TEMPLATE_TYPES.DEFAULT:
            selectTemplate = selectDefaultTemplate;
            break;
        }

        return selectTemplate(settings);
      },

      // Button component.
      // Generates a button based on the options passed as argument
      //   ("Added this for generic buttons in Cleaned Popups.
      //   If we need it globally please make sure the style
      //   /includes/less/layouts/popup/buttons.less is imported globally
      //   not nested in layouts/popup/popup.less" - Nick)
      // @param buttonOptions is an object of options to pass to the button html
      //   isPrimary: (Boolean - default: false):
      //     If set to true the button is a primary one (blue)
      //     otherwise is a secondary (white)
      //   extraClasses: (String - default: ''):
      //     Any extra classes needed on the button
      //     disabled: (boolean) - Disable button
      //   extraAttr: (Array - default: null):
      //     Pass an Array of Objects, each containing a key (attr) property
      //     and a value (attr value) property
      //     (ex: [{ key: 'data-loading-text', value: 'Saving...' }])
      //   text: (String - default: ''):
      //     Text content
      //   iconLeft: (String - default: null):
      //     Expect a String matching the name of the icon to add
      //     in the left side of the button (ex : 'caret-left')
      //   iconRight: (String - default: null):
      //     Expect a String matching the name of the icon to add
      //     in the right side of the button (ex : 'caret-right')
      button: function(buttonOptions) {
        buttonOptions = buttonOptions || {};
        _.defaults(buttonOptions, {
          isPrimary           : false,
          extraClasses        : '',
          disabled            : false,
          extraAttr           : null,
          text                : '',
          iconLeft            : null,
          iconRight           : null
        });
        buttonOptions.Components = this;
        return buttonTemplate(buttonOptions);
      },

      // Dropdown
      // NOTE: To manually dismiss the popup, do the following:
      // $(dropdownTriggerEl).dropdown('toggle').
      //
      // @param options is an object of options to pass to the dropdown
      // html defaults are set below
      dropdown : function(options){

        var defaultSettings = {
            type      : TEMPLATE_TYPES.DEFAULT,
            id        : AppUtil.randomId('ID'),
            options   : [],
            classes   : '',
            variants  : '',
            attributes: '',
            rightAlign: false,
            Components: this
        };
        var settings = $.extend(defaultSettings, options);
        var dropdownTemplate;

        if (settings.type === TEMPLATE_TYPES.DEFAULT ) {
          dropdownTemplate = dropdownDefaultTemplate;
        }

        return dropdownTemplate(settings);
      },

      // Bubble
      // NOTE: To create bubble for options specified
      //
      // @param options is an object of options to pass to the dropdown
      // html defaults are set below
      bubbles : function(options) {

        var defaultSettings = {
          type      : TEMPLATE_TYPES.DEFAULT,
          id        : AppUtil.randomId('ID'),
          options   : [],
          classes   : '',
          variants  : '',
          attributes: '',
          rightAlign: false,
          Components: this
        };
        var settings = $.extend(defaultSettings, options);
        var bubbleTemplate;

        if (settings.type === TEMPLATE_TYPES.DEFAULT) {
          bubbleTemplate = bubbleDefaultTemplate;
        }

        return bubbleTemplate(settings);
      },

      // Popover
      // NOTE: To create popover with options specified
      //
      // @param options is an object of options to pass to the
      // Popover component, text and popoverText are mandatory
      popover: function(options) {

        var defaultSettings = {
          type        : TEMPLATE_TYPES.DEFAULT,
          placement   : 'right',
          dataTrigger : 'hover',
          popoverTitle: '',
          element     : 'span',
          link        : ''
        };
        var settings = $.extend(defaultSettings, options);
        var popoverTemplate;

        if (settings.type === TEMPLATE_TYPES.DEFAULT) {
          popoverTemplate = popoverDefaultTemplate;
        }

        return popoverTemplate(settings);

      },
      // Util
      // ----

      // Function to parse and extract necessary parameters
      // passed to a component in the form of a string.
      // @param stringParams - string of parameters being passed
      //   to component
      // returns an object with extracted parameters and cleaned
      //   stringParams (stringParams minus things extracted).
      parseStringParams: function(stringParams) {
        var options = {};

        var paramsForLabel = ['id', 'class'];

        // Extract attribute from stringParams if present
        for (var i = 0; i < paramsForLabel.length; i++) {
          var param = paramsForLabel[i];
          var newRegex = new RegExp(param + '=([\'"]).+?\\1', 'gi');
          var val = stringParams.match(newRegex)[0];
          if (val) {
            val = val.substring(param.length + 2, val.length - 1);
            stringParams.replace(newRegex, '');

            // "class" is a reserved word, so we need to "classes"
            param = param === 'class' ? 'classes' : param;
            options[param] = val;
          }
        }

        // Pass cleaned stringParams to options
        options.stringParams = stringParams;

        return options;
      }
    };
  }
);