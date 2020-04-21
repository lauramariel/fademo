//
// Copyright (c) 2014 Nutanix Inc. All rights reserved.
//
// SVG contains all the templates for SVGs so that we can inline them in
// our views with a simple namespace context, e.g. "SVG.MenuBackArrow". This
// keeps our HTML code clean and more readable, but allows us to target the
// paths of each svg in css.
//
// SVG Types
// 1. Direct
// 2. SVG Icon
// 3. AJAX (Load on demand)
//
// Directions to add SVG Icon
// Call the SVGIcon() function and pass the icon as the first parameter, and
// optional classname(s) as the second
//
// Directions to add AJAX SVGs:
// 1. Add {svgname}.svg to directory app/extras/svg/
// 2. Add to Constants in this file
// 3. Add to HTML template in this fashion:
//    <%= SVG.loadSVG(SVG.{CONSTANT_NAME}) %>
//
// jsHint options on the next line
/*global require: false, $: false, _: false, window: false, define: false */
//
define([
    // Constants
    'utils/DataURLConstants',
    'utils/AppConstants'
    ],
  function(
    // Constants
    DataURLConstants,
    AppConstants
    ) {

    'use strict';

    return {

      // Constants (SVG's to be retrieved by AJAX request)
      // -------------------------------------------------

      ICONS                      : 'App-icons',
      ENCRYPTION_KEY             : 'EncryptionKey',
      MONKEY_404                 : 'Monkey404',
      NUTANIX_LOGIN_LOGO         : 'NutanixLoginLogo',
      METIS_LOGO                 : 'MetisLogo',
      PARTICLES                  : 'particles',
      HXLOGO                     : 'HxLogo',
      LENOVOLOGO                 : 'LenovoLogo',
      FLOATING_PRISM_LOGO        : 'FloatingPrismLogo',
      FLOATING_PRISM_LOGO_SHADOW : 'FloatingPrismLogoShadow',

      // Foundation
      FOUNDATION_ICONS       : 'FoundationIcons',
      FOUNDATION_LOGO        : 'FoundationLogo',
      FOUNDATION_BLOCK       : 'FoundationBlock',
      FOUNDATION_EXCLAMATION : 'FoundationExclamation',
      FOUNDATION_RF2         : 'FoundationRF2',
      FOUNDATION_RF3         : 'FoundationRF3',

      // Licensing
      LICENSE_ICON       : 'LicensingPrismIcon',
      LICENSE_ADDON_ICON : 'LicensingAddonIcon',

      // PC Scale Out
      PRISM_GLASS_ICON     : 'PrismGlassIcon',

      // Apps
      NUTANIX_CIRCLE : 'NutanixCircleIcon',

      // Support Case
      NO_SUPPORT_CASE : 'NoSupportCase',

      // SVG Icons
      //----------
      // Template for placing icon font element
      // TODO: Change the IDs of the icons to more obvious identities when
      // TODO: Create validation if icon cannot be found
      // converting icon font references to SVG icon references.
      SVGIconTemplate : _.template('' +
        '<svg viewBox="<%= viewbox %>" '+
          'class="svg-icon <%= className %> -id-<%= icon %>"' +
          '<%= attributes %>>' +
          '<use xmlns:xlink="http://www.w3.org/1999/xlink" ' +
              'xlink:href="#<%= icon %>">' +
          '</use>' +
        '</svg>'),

      // Function for placing icon font element
      // @param icon: the name of the SVG Icon to be placed. See App-icons.svg
      //    for the id (in the id='' attr)
      // @param className: optional class name(s) to be added to the svg.
      //    Separate multiple class names with space, e.g. 'n-blue n-small'
      // SVG icon reference page: http://goo.gl/TqcyFW
      SVGIcon: function(icon, className, attributes, viewbox) {
        className = className || '';
        attributes = attributes || '';
        viewbox = viewbox || AppConstants.COMPONENTS.SVG.VIEWBOX.DEFAULT;
        return this.SVGIconTemplate({icon: icon, className: className,
          attributes: attributes, viewbox: viewbox});
      },


      // SVG List
      //----------

      // Nutanix 'N' Logo
      nutanixNLogo :
        '<svg viewBox="0 0 36 20" class="nutanix-n-logo">' +
          '<path d="' +
            'M11.957,2.070 C11.957,0.913 12.680,0.001 14.056,0.001 C14.135,' +
            '0.001 2.840,0.001 2.099,0.001 C1.359,0.001 0.000,0.814 0.000,' +
            '2.070 C0.000,3.327 0.000,20.001 0.000,20.001 C0.000,20.001 11.' +
            '957,20.001 11.957,20.001 C11.957,20.001 11.957,11.414 11.957,' +
            '2.070 Z">' +
          '</path>' +
          '<path d="' +
            'M24.007,8.966 C24.007,8.966 15.193,0.001 13.891,0.001 C12.779,0.' +
            '001 11.994,0.814 11.994,2.070 C11.994,2.753 11.994,10.346 11.994' +
            ',10.346 C11.994,10.346 21.153,20.001 21.478,20.001 C22.189,20.0' +
            '01 24.007,20.001 24.007,20.001 C24.007,20.001 24.007,8.966 24.00' +
            '7,8.966 Z">' +
          '</path>' +
          '<path d="' +
            'M24.007,17.933 C24.007,19.090 23.286,20.001 21.913,20.001 C21.' +
            '835,20.001 33.167,20.001 33.906,20.001 C34.645,20.001 36.000,1' +
            '9.189 36.000,17.933 C36.000,16.676 36.000,0.001 36.000,0.001 ' +
            'C36.000,0.001 24.007,0.001 24.007,0.001 C24.007,0.001 24.007,' +
            '8.588 24.007,17.933 Z">' +
          '</path>' +
        '</svg>',

      // Inline check icon
      inlineCheck :
        '<svg viewBox="0 0 16 16" class="inline-check">'  +
          '<polyline points="4.5,8.3 7.4,11 15.5,0.6"></polyline>' +
        '</svg>',

      // Nav menu icon, animates to back arrow
      MenuBackArrow :
        '<svg viewBox="0 0 200 200">' +
          '<path id="top" d="' +
            'M 40, 80' +
            'C 40, 80 120, 80 140, 80' +
            'C180, 80 180, 20  90, 80' +
            'C 60,100  30,120  30,120">' +
          '</path>' +
          '<path id="middle" d="' +
            'M 40,100' +
            'L140,100">' +
          '</path>' +
          '<path id="bottom" d="' +
            'M 40,120' +
            'C 40,120 120,120 140,120' +
            'C180,120 180,180  90,120' +
            'C 60,100  30, 80  30, 80">' +
          '</path>' +
        '</svg>',

      // Default Checkbox
      CheckboxDefault :
        '<svg viewBox="0 0 12 12" class="svg-input">' +
          '<path d="M3.3,6.5 5.2,8.3 10,2"></path>' +
        '</svg>',

      // Login submit arrow
      loginSubmitArrow :
        '<svg class="loginSubmitArrow" viewBox="0 0 25 25">' +
          '<path d="M12.5,0C5.596,0,0,5.596,0,12.5S5.596,25,12.5,25 ' +
          'C19.404,25,25,19.404,25,12.5S19.404,0,12.5,0z M18.017,13.845l' +
          '-2.976,2.981c-0.291,0.291-0.671,0.437-1.052,0.437 c-0.381,0-0.762' +
          '-0.146-1.052-0.437c-0.581-0.582-0.581-1.526,0-2.107l0.436-0.436H8' +
          '.036c-0.822,0-1.488-0.667-1.488-1.49 c0-0.823,0.666-1.49,1.488-1' +
          '.49h5.336l-0.436-0.436c-0.581-0.582-0.581-1.526,0-2.107c0.581-0' +
          '.582,1.523-0.582,2.104,0l2.976,2.981 C18.598,12.32,18.598,13.263' +
          ',18.017,13.845z"/>' +
        '</svg>',

      // Path for the network port icon (switch port or pnic)
      networkPortIconPath :
        'M3,2 L3,2 L3,0.998956561 C3,0.447248087 3.44371665,0 3.99980749,0 ' +
        'L7.00019251,0 C7.55237094,0 8,0.442660332 8,0.998956561 L8,2 ' +
        'L10.0044225,2 C10.5542648,2 11,2.45303631 11,2.99703014 ' +
        'L11,9.00296986 C11,9.5536144 10.555163,10 10.0044225,10 ' +
        'L0.995577499,10 C0.445735229,10 0,9.54696369 0,9.00296986 ' +
        'L0,2.99703014 C0,2.4463856 0.444836974,2 0.995577499,2 ' +
        'L3,2 L3,2 L3,2 Z M3,3 L0.995577499,3 ' +
        'C0.997898438,3 1,2.99789406 1,2.99703014 ' +
        'L1,9.00296986 C1,8.99832683 1.00166307,9 0.995577499,9 ' +
        'L10.0044225,9 C10.0021016,9 10,9.00210594 10,9.00296986 ' +
        'L10,2.99703014 C10,3.00167317 9.99833693,3 10.0044225,3 ' +
        'L8,3 L7,3 L7,2 L7,0.998956561 C7,0.997433438 7.00257692,1 ' +
        '7.00019251,1 L3.99980749,1 C3.99776836,1 4,0.997764215 ' +
        '4,0.998956561 L4,2 L4,3 L3,3 L3,3 L3,3 Z M7,7 L8,7 L8,9 L7,9 L7,7 ' +
        'L7,7 L7,7 Z M5,7 L6,7 L6,9 L5,9 L5,7 L5,7 L5,7 Z M3,7 L4,7 ' +
        'L4,9 L3,9 L3,7 L3,7 L3,7 Z',

      // Path for 10G port icon for pnic
      network10GPortIconPath:
      'M0,0.997544646 C0,0.446615951 0.444836974,0 0.995577499,0 ' +
      'L10.0044225,0 C10.5542648,0 11,0.446311399 11,0.997544646 L11,' +
      '8.00245535 C11,8.55338405 10.555163,9 10.0044225,9 L0.995577499,9 ' +
      'C0.445735229,9 0,8.5536886 0,8.00245535 L0,0.997544646 Z M1,' +
      '0.997544646 L1,8.00245535 C1,8.00169295 0.998310032,8 0.995577499,8 ' +
      'L10.0044225,8 C10.0019858,8 10,8.00199094 10,8.00245535 L10,' +
      '0.997544646 C10,0.99830705 10.00169,1 10.0044225,1 L0.995577499,1 ' +
      'C0.998014226,1 1,0.998009062 1,0.997544646 Z M2,5 L9,5 L9,6 L2,6 ' +
      'L2,5 Z M2,3 L9,3 L9,4 L2,4 L2,3 Z',

      // Path for network globe icon
      networkGlobeIconPath:
        'M228.1,1550.5c88.5,14.1,237.3,4.6,391-130.4c74.4-69.8,158.3-55.8,'+
        '200.2-46.5c65.2,18.6,107.2,60.6,116.4,93.1c51.2,190.8-32.5,256-139.6,'+
        '339.8c-93.1,69.8-228.1,181.6-135,377c51.1,102.3,65.2,177,46.5,'+
        '223.5c-18.7,37.4-65.2,74.4-153.7,107.2c-223.5-148.9-367.8-404.9-367.'+
        '8-693.6C186.2,1722.9,200.3,1634.4,228.1,1550.5z M1894.2,1816c0,'+
        '135-35.2,260.6-96.1,372.4c-45.5,0-96-9.2-121.3-42c-25.3-32.5-20.'+
        '3-93.1,5-158.3c45.6-107.2-15.3-214-80.8-321.2c-55.6-93.1-116.4-'+
        '200.2-116.4-316.6c0-55.8,25.3-88.5,75.8-111.8c20.3-9.2,35.3-14.1,'+
        '55.5-18.7C1788.1,1373.8,1894.2,1583.3,1894.2,1816z M1024,2840c563.1,'+
        '0,1024-460.9,1024-1024c0-563.2-460.9-1024-1024-1024C460.9,792,0,'+
        '1252.8,0,1816C0,2379.1,460.9,2840,1024,2840z',

      // Path for network on-prem icon
      networkOnPremIconPath:
        'M1408,792H640c-141.4,0-256,114.6-256,256v1792h1280V1048C1664,'+
        '906.6,1549.4,792,1408,792z M896,2456H640v-256h256V2456z M896,'+
        '1944H640v-256h256V1944z M896,1432H640v-256h256V1432z M1408,'+
        '2456h-256v-256h256V2456z M1408,1944h-256v-256h256V1944z M1408,'+
        '1432h-256v-256h256V1432z',

      // Path for a generic help (?) icon
      helpIconPath :
        'M7,14 C10.8659932,14 14,10.8659932 14,7 C14,3.13400675 10.8659932, ' +
        '0 7,0 C3.13400675,0 0,3.13400675 0,7 C0,10.8659932 3.13400675,14 7, ' +
        '14 Z M7,12.4166667 C9.99154239,12.4166667 12.4166667,9.99154239 ' +
        '12.4166667,7 C12.4166667,4.00845761 9.99154239,1.58333333 ' +
        '7,1.58333333 ' +
        'C4.00845761,1.58333333 1.58333333,4.00845761 1.58333333,7 ' +
        'C1.58333333,9.99154239 4.00845761,12.4166667 7,12.4166667 Z ' +
        'M6.81265944,8.98717237 C6.29012318,8.98717237 5.90411858,9.39014327 ' +
        '5.90411858,9.92583157 L5.90411858,9.94634071 C5.90411858,10.4808234 ' +
        '6.2913638,10.8849999 6.81265944,10.8849999 C7.3351957,10.8849999 ' +
        '7.7212003,10.482029 7.7212003,9.94634071 L7.7212003,9.92583157 ' +
        'C7.7212003,9.39014327 7.3351957,8.98717237 6.81265944,8.98717237 Z ' +
        'M7.00131844,3.5 C6.19455324,3.5 5.52183474,3.74371289 ' +
        '4.94468878,4.24561997 C4.76471674,4.40246322 4.66666667,4.61722077 ' +
        '4.66666667,4.85248745 C4.66666667,5.27838584 5.01047151,5.6391293 ' +
        '5.41881846,5.6391293 C5.58265498,5.6391293 5.75269461,5.57638911 ' +
        '5.89915497,5.4617733 C6.23675299,5.19634209 6.58428342,5.07328008 ' +
        '6.98021671,5.07328008 C7.49654615,5.07328008 7.79939557,5.30613562 ' +
        '7.79939557,5.71151766 L7.79939557,5.7320304 C7.79939557,6.17964349 ' +
        '7.43572962,6.4269731 6.63269,6.5331463 C6.4551992,6.55607019 ' +
        '6.30998317,6.63569919 6.21813622,6.7635871 C6.12752988,6.88906387 ' +
        '6.09277758,7.04953105 6.11884181,7.23050375 L6.21441063,7.92182974 ' +
        'C6.26157659,8.25361785 6.50608703,8.48888814 6.81017708,8.48888814 ' +
        'L6.88712913,8.48888814 C7.22473086,8.48888814 7.44193645,8.20173862 ' +
        '7.48289558,7.92424449 L7.50275297,7.79394184 C8.78985469,7.50800149 ' +
        '9.41416661,6.81908665 9.41416661,5.69462884 L9.41416661,5.6741161 ' +
        'C9.41292599,4.33128043 8.48949022,3.5 7.00131844,3.5 Z',

      // New icons
      newSuccessIcon:
        `<svg viewBox="0 0 12 12">
          <path d="M3.3,6.5 5.2,8.3 10,2"></path>
        </svg>`,

      newFailedIcon:
        `<svg viewBox="0 0 12 12">
          <path d="M3.8,3.8 8.2,8.2"></path>
          <path d="M8.2,3.8 3.8,8.2"></path>
        </svg>`,

      // Load on Demand Asynchronusly
      //---------------------------------------------------------
      // This is where SVGs that are unique to pages and are more
      // resource intensive will be called to avoid bloating our
      // minified code.

      loadSVG(svg, options) {
        options = _.defaults({}, options, {
          success() { /* noop */ },
          error() { /* noop */ }
        });

        if (!svg) {
          throw new Error('SVG not defined');
        }
        else {

          // Put placeholder and add callback to AJAX request that replaces
          // placeholder with actual SVG.

          $.ajax({
            contentType : "text/plain",
            dataType    : "html",
            url         : DataURLConstants.SVG + svg + ".svg",
            success     : function (response) {
              $(".svg-placeholder-" + svg).replaceWith(response);
              options.success(response);
            },
            error       : function() {
              if (typeof console !== 'undefined') {
                // Can't use AppUtil.log here, to avoid circular dependency.
                /* eslint-disable */
                console.log('loadSVG : SVG file not found');
                /* eslint-enable */
              }
              $(".svg-placeholder-" + svg).replaceWith('<div ' +
                'class="svg-loader -error">Image not found.</div>');
              options.error();
            }
          });

          return '<div class="svg-loader svg-placeholder-' + svg + '"></div>';
        }
      }

    };
  }
);
