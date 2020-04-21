//
// Copyright (c) 2013 Nutanix Inc. All rights reserved.
//
// This file holds all the jquery plugins created by Nutanix.
// They are all wrapped in an IIFE.  To add a jquery plugin,
// place it just above the comment "Add other jQuery plugins here"
//
// jsHint options on the next line
/* global $: false, window:false, _: false, define: false, jQuery: false,
  setTimeout: false */
//

/* eslint-disable */

define([
    // Core classes
    'fancySelect',
    // Utils
    'utils/AppUtil',
    // Components
    'nutanixMoreInfo',
    // Events
    'events/AppEvents'],
  function(
    // References of core classes
    FancySelect,
    // Utils
    AppUtil,
    // References of components
    NutanixMoreInfo,
    // References of events
    AppEvents) {

    'use strict';

    // Dom element used for the app body
    const APP_BODY = 'body';

    // Class used to tell app body a popup is visible
    const N_POPUP_SHOW = 'n-popup-show';

    // Class used to tell app body a full page popup is visible
    const FULL_PAGE_POPUP_OPEN = 'full-page-popup-open';

    // IIFE holding all jquery plugins
    (function($) {

      // Nutanix Input
      //--------------

      // Plugin to append a label tag and apply classes to html input
      // checkboxes.  The label tag can be used in lieu of the checkbox since
      // it is tied to the checkbox itself by the for/id relationship.
      // If the checkbox does not have and ID attribute, a random one is
      // generated.
      $.fn.nutanixInput = function(options) {

        // Default settings
        var settings = $.extend({
            type: 'checkbox'
        }, options);

        // Style select boxes
        if(settings.type === 'select'){
          return this.each( function(){
            $(this).fancySelect({type: 'select'});
          });
        }

        // Style other input types

        // Class name of Nutanix Input Label (replacing input element)
        var className = 'n-' + settings.type;

        // return this.each( function() {
        //   var checkbox = $(this);

        //   // If there is not already a Nutanix Checkbox...
        //   if(!checkbox.next().hasClass(className) &&
        //      !AppUtil.svgHasClass(checkbox.next(), className)){

        //     var checkboxId = checkbox.attr('id');
        //     var svgInput = settings.svg === true ||
        //           (typeof settings.svg === 'object' &&
        //           settings.svg[settings.type] === true);

        //     if(!checkboxId){ // if the checkbox doesn't have an id, create one
        //       checkboxId = AppUtil.randomId('ID');
        //       checkbox.attr('id', checkboxId);
        //     }

        //     // Copy over the 'data-class' attribute on checkbox to
        //     // the label.
        //     var checkboxDataClass = checkbox.attr('data-class');
        //     if (checkboxDataClass) {
        //       className += ' ' + checkboxDataClass;
        //     }

        //     var label = $('<label />').attr({
        //       'for': checkboxId,
        //       'class': (svgInput ? className + ' svg-' + className : className)
        //     });

        //     // Add 'clicked' class on click (used for toggling state)
        //     label.click(function(){
        //       $(this).addClass('clicked');
        //     });

        //     // Remove 'clicked' class on mouseout
        //     label.mouseout(function(){
        //       $(this).removeClass('clicked');
        //     });

        //     // If SVG, insert into label
        //     if(svgInput){
        //       var svgInputEl = $(SVG.CheckboxDefault);
        //       label.append(svgInputEl);
        //     }

        //     // Append label to DOM right after checkbox
        //     checkbox.after(label);

        //     // Add class 'n-checkbox' to input element (used for CSS selectors)
        //     checkbox.addClass(className);

        //   }
        // });
      };


      // Nutanix Confirm
      //----------------

      // Pre-compiled template
      var _tmplConfirm = _.template(
        `<div id="nutanixConfirmModal" class="modal fade">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-body n-modal-body">
                <div class="n-modal-content-wrapper">
                  <div class="n-title"></div>
                  <div class="n-popup-description"></div>
                  <div class="modal-extensions"></div>
                </div>
                <div class="modal-spinner" style="display:none;">
                </div>
                <div class="modal-buttons">
                  <button type="button"
                    class="btn btn-secondary btnNo">
                  </button>
                  <button type="button"
                    class="btn btnClose btn-primary btnYes">
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>`);

      // Adding nutanixConfirm as a jQuery Object function,
      // so that we don't need an element to call it.
      $.extend({
        // Nutanix Confirm Dialog popup.
        // @param title        : title to display on the dialog header.
        // @param msg          : message to display inside the dialog body.
        // @param captcha      : CAPTCHA test function for the clicking of yes
        // @param yes          : callback function after clicking yes button.
        // @param no           : callback function after clicking no button.
        // @param yesText      : text to display inside the Yes button
        // @param noText       : text to display inside the No button
        // @param hideYes      : boolean to indicate if the Yes button is
        //                       hidden
        // @param hideNo       : boolean to indicate if the No button is hidden
        // @param defaultNo    : boolean to indicate if the No button has
        //                       default focus.
        // @param hideSpinner  : don't show spinner
        // @param context      : The value of 'this' context for the callbacks
        // @param suppressScale: boolean to indicate if the main app view scale
        //                       animation should be suppressed.
        // TODO: Consider creating a nested structure where the notification
        //       modal component extends the confirmation modal component.
        nutanixConfirm : function(options) {

          // TODO: Replace all references to modal with our nutanixPopup. Doing
          // so may cause problems with the popup closing view stack when the
          // ESC key is pressed.  Need to handle this in BaseNavigationView.js

          // Default settings. Adds flexibility for customizing.
          var settings = $.extend({
            title: '',
            msg: 'Are you sure?',
            yesText: 'Ok',
            noText: 'Cancel',
            hideYes: false,
            hideNo: false,
            hideSpinner: false,
            defaultNo: true,
            suppressScale: false,
            class: ''
          }, options);

          // Function to set up a polling interval with a timeout (along with
          // some wrapper logic). We want to make sure the handlers are called
          // after the confirm dialog has been removed from the DOM in case
          // there are any external handlers observing this.
          var setIntervalWithTimeoutWrapper = function(intervalHandler) {
            var options = {};
            var timeoutHandler = 'Timeout handler';

            var intervalHandlerWrapper = function() {
              if (! $('#nutanixConfirmModal:visible').length) {
                intervalHandler();
                return true;
              }

              return false;
            };

            options.intervalHandler = intervalHandlerWrapper;
            options.intervalPeriod  = 100;
            options.timeoutHandler  = timeoutHandler;
            options.timeoutPeriod   = 1500;

            // Use setIntervalWithTimeout to wait for the animation to
            // complete. One place this is needed is for popups which
            // perform a check on whether a confirm modal is visible before
            // the popup tries to hide.
            AppUtil.setIntervalWithTimeout(options);
          };

          // Fade the current popup's modal
          $('.modal-backdrop').addClass('popupfadeAll');

          // Create the confirm modal
          $('#globalModalContainer  #nutanixConfirmModal').remove();
          $('#globalModalContainer').append(_tmplConfirm);
          $('#nutanixConfirmModal').modal(
            {
              show:true,
              backdrop:false,
              keyboard:false
            });
          $('#nutanixConfirmModal .btnYes').html(settings.yesText);
          $('#nutanixConfirmModal .btnNo').html(settings.noText);
          $('#nutanixConfirmModal .n-title').html(settings.title);
          if (settings.class) {
            $('#nutanixConfirmModal').addClass(settings.class);
          }
          if (settings.extHTML) {
            $('#nutanixConfirmModal .modal-extensions').html(settings.extHTML);
            $('#nutanixConfirmModal').addClass('fadeExt');
          }
          if (settings.msg) {
            $('#nutanixConfirmModal .modal-body .n-popup-description')
              .html(settings.msg);
          }

          // Return true CAPTCHA test pass, default to true if no defined.
          var captchaFunc = function() {
            if (typeof settings.captcha === 'function') {
              if (settings.context) {
                return settings.captcha.call(settings.context);
              } else {
                return settings.captcha();
              }
            }
            return true;
          };

          // If Yes is clicked execute the function and hide the modal
          $('#nutanixConfirmModal .btnYes').unbind('click').click(function () {
            // Continue to Yes click callback if CAPTCHA test pass
            if (!captchaFunc()){
              return;
            }
            if (typeof settings.yes === 'function') {
              var intervalHandler = function() {
                // Check if context was provided
                if (settings.context) {
                  settings.yes.call(settings.context);
                } else {
                  settings.yes();
                }
              };

              setIntervalWithTimeoutWrapper(intervalHandler);
            }
            $('#nutanixConfirmModal').modal('hide');
            $('.modal-backdrop').removeClass('popupfadeAll');
            $('body').removeClass('n-confirm-show');

            return true;
          });

          // Function called when No or ESCAPE is clicked
          var noOrEscClickFunc = function () {
            if (typeof settings.no === 'function') {
              var intervalHandler = function() {
                if (settings.context) {
                  settings.no.call(settings.context);
                } else {
                  settings.no();
                }
              };

              setIntervalWithTimeoutWrapper(intervalHandler);
            }
            $('#nutanixConfirmModal').modal('hide');
            $('.modal-backdrop').removeClass('popupfadeAll');
            $('body').removeClass('n-confirm-show n-suppress-scale');
            return false;
          };

          // Hide or show the 'Yes' button.
          if (! settings.hideYes) {
            $('#nutanixConfirmModal .btnYes').show();
            // The class should never exist at this point but adding this line
            // for insurance.
            $('#nutanixConfirmModal').removeClass('modal-notification');
          } else {
            // Set move the button out of the visible area so that it can still
            // be clicked programmatically.
            $('#nutanixConfirmModal .btnYes').css({position: 'relative',
              left: '-1000px', top: '-1000px'});
            // If we are hiding the yes button, then this modal is being used
            // as a status indicator, hence display the spinner.
            if ( ! settings.hideSpinner ) {
              $('#nutanixConfirmModal .modal-spinner').show();
            }

            // Adjust for a smaller height to remove extra white space.
            $('#nutanixConfirmModal').addClass('modal-notification');
          }

          // Hide or show the 'No' button and bind the handler.
          if (! settings.hideNo) {
            $('#nutanixConfirmModal .btnNo').show();

            $('#nutanixConfirmModal .btnNo').unbind('click').
              click(noOrEscClickFunc);
          }
          else {
            $('#nutanixConfirmModal .btnNo').hide();
          }

          // Removing the class for modal backdrop when the dialog is closed by
          // clicking on the cross icon.
          $('#nutanixConfirmModal .close').unbind('click').click(function() {
            $('.modal-backdrop').removeClass('popupfadeAll');
          });

          // Key down event inside of the Nutanix Confirm Dialog popup
          $('#nutanixConfirmModal').unbind('keydown').keydown(
            function (event) {
              var keyCode = $.angular-ui.keyCode;
              // Escape key down
              if (event.keyCode === keyCode.ESCAPE) {
               return noOrEscClickFunc();
              } else if (!settings.hideYes &&
                (event.keyCode === keyCode.ENTER)) {
                $('#nutanixConfirmModal .btnYes').click();
              }
            });

          // Add body class
          $('body').addClass('n-confirm-show');

          // Suppress the scaling animation of the main view.
          if (settings.suppressScale) {
            $('body').addClass('n-suppress-scale');
          }

          // Set default focus.
          if (settings.defaultNo) {
            $('#nutanixConfirmModal .btnNo').focus();
          }
          else {
            $('#nutanixConfirmModal .btnYes').focus();
          }
        }
      });

      // Custom jquery promise method that repackages multiple deferred objects
      // so that the done() handler is only called when all requests have
      // completed, whether they are resolved or rejected.
      // The default when method results in done() getting fired immediately
      // upon any rejected requests and the remaining requests could still be
      // incomplete.
      $.extend({
        whenAll: function() {
          var dfd = $.Deferred(),
            promises = $.makeArray(arguments),
            len = promises.length,
            counter = 0,
            state = "resolved",
            resolveOrReject = function() {
              counter++;

              if(counter === len) {
                dfd[state === "rejected"? "reject": "resolve"]();
              }
            };

          $.each(promises, function(idx, item) {
            item.always(resolveOrReject);
          });

          return dfd.promise();
        }
      });

      // This function is used to perform an action once the given element
      // becomes visible
      $.extend({
        whenShown: function(element, callback, timeout) {
          timeout = timeout || 5000;

          if (!_.isNumber(timeout) || timeout < 100) {
            throw new Error('Timeout argument must be a number' +
             'greater than 100');
          }

          var intervalFn = function() {
            // If a jQuery selector was given then query the DOM at each
            // interval for the element until we find it.
            element = (typeof element === 'string') ? $(element) : element;

            if(element.is(':visible')){
              callback.call();
              return true;
            }
            else {
              return false;
            }
          };

          // var timeoutFn = function() {
          //   // AppUtil.log('Interval timeout for whenShown');
          // };

          // AppUtil.setIntervalWithTimeout({
          //   intervalHandler: intervalFn,
          //   timeoutHandler: timeoutFn,
          //   timeoutPeriod: timeout,
          //   intervalPeriod: 100
          // });
        }
      });


      // Nutanix Toggle Link
      //--------------------

      // Plugin that toggles the message text of a link. It also has a callback
      // for click. The link element should have attributes:
      // data-message-1 and data-message-2.
      // Params in options:
      // @param clickCallback - function called when click happens
      // @param context - context of where you want to call function
      // @param select - selected which message to show. Options are 1 or 2.
      $.fn.nutanixToggleLink = function(options) {

        // Default settings
        var settings = $.extend({ }, options),
            defaultSelection = 1;

        // Check if select exists to be the default
        if (settings.select === 1 || settings.select === 2) {
          defaultSelection = settings.select;
        }

        return this.each( function() {
          var linkEl = $(this),
              message1 = linkEl.attr('data-message-1'),
              message2 = linkEl.attr('data-message-2'),
              clickCallback = settings.clickCallback,
              callbackContext = settings.context;

          // Default selection is message1
          linkEl.attr('data-message-selected', defaultSelection);
          linkEl.text(defaultSelection === 1 ? message1 : message2);

          // Check if need to add a toggle style class
          if (!linkEl.hasClass('n-toggle-link')) {
            linkEl.addClass('n-toggle-link');
          }

          // Check if there's a clickCallback
          if (!clickCallback) {
            return;
          }

          // Function called when click event is triggered
          var toggleClickFunc = function () {
            var currentLink = $(this),
                currentSel = Number(currentLink.attr('data-message-selected')),
                msg, selected;

            // Toggle on click
            if (currentSel === 1) {
              selected = 2;
            } else {
              selected = 1;
            }

            // Set the new selection and message
            currentLink
              .attr('data-message-selected', selected)
              .text(currentLink.attr('data-message-'+selected));

            // Call clickCallback
            if (clickCallback && callbackContext) {
              clickCallback.call(callbackContext, selected);
            }
          };

          // Attach click handler
          linkEl.off('click').click(toggleClickFunc);

        });
      };

      // Nutanix Popup
      //--------------
      // @params options.overlayPopup - This is popup over popup so fade other
      //         popups.
      //         options.removePopup  - Remove the popup and DOM on hide.
      $.fn.nutanixPopup = function(options) {
        // The passed object can be a string literal ('show' or 'hide'), or an
        // object. If it is 'show', it will be converted to {show: true}. If
        // it is 'hide', the option will not need to be converted to an object.

        // If object is the string 'show', convert to object.
        if (options === 'show') {
          options = {show: true};
        }
        else if (options === 'hide') {
          options = {show: false};
        }

        // Default settings. Adds flexibility for customizing.
        var settings = $.extend({ }, options),
            popupCount = parseInt(
              $('#globalModalContainer').attr('data-popup-count'), 10);

        if (isNaN(popupCount)) {
          popupCount = 0;
        }

        // Show popup
        if (settings.show) {
          if(options.overlayPopup) {
            // This is a popup over popup so fade other popups.
            $('#globalModalContainer').addClass('overlay-popup');
            $('#globalModalContainer .modal').addClass('overlay-fade');
            this.removeClass('overlay-fade');
          }

          // If we're showing the first popup then activate the tab keypress
          // listener to prevent the user from tabbing out of the popup.
          if (popupCount === 0) {
            $(document).on('keydown', _tabTrap);
          }

          // TODO: replace bootstrap's classes with our own.
          // Render popup
          // this.addClass('modal hide fade out in');
          this.addClass('modal fade in');
          this.show();

          if (options.fullPagePopup) {
            $(APP_BODY).addClass(FULL_PAGE_POPUP_OPEN);
          }

          // Add body class
          if (options.popupType !== 'inline') {
            $(APP_BODY).addClass(N_POPUP_SHOW);
          }

          // Update popup count
          popupCount++;
        }

        // Hide popup
        else {

          if(options.overlayPopup) {
            // This is a popup over popup so remove the fade on other popups.
            $('#globalModalContainer').removeClass('overlay-popup');
            $('#globalModalContainer .modal').removeClass('overlay-fade');
          }

          if (options.fullPagePopup) {
            $(APP_BODY).removeClass(FULL_PAGE_POPUP_OPEN);
          }

          // TODO: do not accommodate invisible popups.
          // Only decrement the count if the popup was visible
          if (this.hasClass('in')) {
            // Update popup count
            popupCount = Math.max(popupCount - 1, 0);
          }

          // Hide the popup
          this.removeClass('in');

          if (popupCount === 0) {
            // Remove body class
            $(APP_BODY).removeClass(N_POPUP_SHOW);
            // Remove the tab keypress listener.
            $(document).off('keydown', _tabTrap);
          }

          // Remove popup from DOM
          // TODO: There is a problem with CSS transtion event not being
          // triggered when multiple popup or transition happening at
          // the same time.  Reverting back to use timeout until
          // we have a better solution.
          var _this = this;
          setTimeout(function(){
            if (typeof settings.cleanUp === 'function') {
              settings.cleanUp();
            }
            if(options.removePopup !== false) {
              _this.remove();
            }
          }, 500);    }

        // Update popup count
        $('#globalModalContainer').attr('data-popup-count', popupCount);
      };


      // Nutanix Tutorial
      //-----------------

      // Pre-compiled tooltip template
      var _tmplTutorialTooltip =
        '<div class="n-tutorial">' +
          '<div class="n-body">' +
            '<header class="n-header">' +
              '<i data-icon="v" aria-hidden="true" class="n-close-icon ' +
              'n-close-button"></i>' +
              '<h4 class="n-header-text">Header</h4>' +
            '</header>' +
            '<div class="n-message"></div>' +
          '</div>' +
          '<div class="n-controls">' +
            '<div class="n-steps"></div>' +
            '<div class="buttons">' +
              '<button class="btn -blue btn-next-step">OK, got it.</button>' +
              '<button class="btn -blue n-close-button try-it tryIt">' +
                'Try it!' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      // Plugin to instantiate, move, and/or destroy tutorial elements
      $.extend({
        nutanixTutorial: function(options) {
          // Default settings. Adds flexibility for customizing.
          var settings = $.extend({
            show: true,
            mode: 'mouse', // Can be mouse, highlight, or tooltip.  Not using
                           // app constant because it wouldn't be available to
                           // the json being fed in.
            targetEl: 'body', // Default target element
            jQSelector: false, // if true, targetEl can be a jQuery Selector
            targetElIndex: 0,
            offset: { y: 0, x: 0 },
            positionUpdateOnly: false,

            // Mouse properties
            mClick: false,
            mClickDelay: 300, // Time in ms

            // Highlight properties
            hlMargin: 0,
            hPadding: 20,

            // Tooltip properties
            tLocation: 'bottom', // Tooltip on bottom, left, right, top or
                                 // center (centered over element)
            tHeight: 256, // Pixel height of tooltip,
            tWidth: 278, // Pixel width of tooltip
            tHeader: '',
            tMessage: '',
            tBtnText: 'OK, got it!',
            tBtnBack: false,
            tBtnNext: false, // Set to true to replace OK btn with Next btn
            tSteps: 0, // Number of steps in current tutorial
            tCurrStep: 0, // Current step
            tTryIt: false,
            tTryItClickSelector: '',

            postDelay: 0 // Delay(ms) to wait after step is completed
          }, options);

          var mouseOpenDuration = 400; // Time in ms
          var mouseMoveDuration = 1500; // Time in ms
          var clickDuration = 600; // Time in ms
          var mode = {
            mouse:'mouse',
            tooltip: 'tooltip',
            highlight:'highlight'
          };

          var modeClasses = {
            mouse: 'n-tutorial-mouse',
            highlight: 'n-tutorial-highlight',
            tooltip: 'n-tutorial-tooltip'
          };
          var posY, posX,
              targetWidth,
              targetHeight;

          // TODO: Make page scroll to element if out of view.

          // TODO: Make tutorial element move on window resize, or convert
          // everything to % values if possible

          // Function to load the tutorial and call positioning and populating
          // functions
          function loadTutorial() {
            var translate;
            switch ( settings.mode ) {
              // Mouse - Position
              case mode.mouse:
                // Move mouse
                setTimeout(function(){
                  // TODO: Change to use transform property instead of top/left
                  /*$('body .' + modeClasses[settings.mode])
                    .css({
                      top: posY + targetHeight/2,
                      left: posX + targetWidth/2
                    });*/
                  var mouse = $('body .' + modeClasses[settings.mode]);
                  var position = {
                    top: posY + targetHeight/2,
                    left: posX + targetWidth/2
                  };
                  positionMouse(mouse, position);
                }, mouseOpenDuration);
                // Mouse click (optional) and fire finish event
                var delay = mouseOpenDuration + mouseMoveDuration +
                            settings.postDelay;
                if (settings.mClick){
                  mouseClick();
                  delay += settings.mClickDelay + clickDuration;
                }
                setTimeout(function(){
                  $('body').trigger(AppEvents.TUTORIAL_STEP_FINISH);
                }, delay);
                break;

              // Highlight - Postiion
              case mode.highlight:
                translate = 'translate(' +
                      (posX - settings.hPadding) + 'px,' +
                      (posY - settings.hPadding) + 'px)';
                position(modeClasses[settings.mode], translate);
                $('body .' + modeClasses[settings.mode])
                  .css({
                    width: targetWidth + 2 * settings.hPadding,
                    height: targetHeight + 2 * settings.hPadding
                  });
                // Fire finish event
                setTimeout(function(){
                  $('body').trigger(AppEvents.TUTORIAL_STEP_FINISH);
                }, settings.postDelay + 1900);
                break;

              // Tooltip - Position and Populate
              case mode.tooltip:
                // Toggle position value on tooltip element via the
                // 'tooltip-location' property
                $('body .' + modeClasses[settings.mode])
                  .attr('tooltip-location',settings.tLocation);
                $('body .' + modeClasses[settings.mode])
                  .css({
                    width: settings.tWidth,
                    height: settings.tHeight
                  });
                // Position the tooltip based on location
                positionToolTip(settings.tLocation);
                // Populate tooltip
                if ( !settings.positionUpdateOnly ) {
                  populateTooltip();
                }
                break;
            }
          }

          // Function to hide tutorial element
          // function hideTutorial() {
          //   switch (settings.mode) {
          //     case mode.mouse:
          //       setTimeout(function(){ // Prevents call stack size exceed
          //         $('body').trigger(AppEvents.TUTORIAL_STEP_FINISH);
          //       }, 20);
          //       break;
          //     case mode.highlight:
          //       setTimeout(function(){ // Prevents call stack size exceed
          //         $('body').trigger(AppEvents.TUTORIAL_STEP_FINISH);
          //       }, 20);
          //       break;
          //     case mode.tooltip:
          //       setTimeout(function(){
          //         $('body').trigger(AppEvents.TUTORIAL_STEP_FINISH);
          //       }, settings.postDelay);
          //       break;
          //   }
          // }

          // Show or hide tutorial elements
          if (settings.show) {

            // If not already in the DOM, place it
            if ($('body .' + modeClasses[settings.mode]).length === 0) {
              $('body').append(
                '<div class="' + modeClasses[settings.mode] + ' n-show"></div>'
                );

              // If tooltip, add template
              if (settings.mode === mode.tooltip) {
                $('body .' + modeClasses[settings.mode])
                  .append(_tmplTutorialTooltip);
              }
            }

            // Otherwise (if already in DOM), show it
            else {
              $('body .' + modeClasses[settings.mode])
                .show()
                .addClass('n-show');
            }

            // Add class to the body
            $('body').addClass(modeClasses[settings.mode]);
          }

          // Hide
          else {
            $('body .' + modeClasses[settings.mode])
              .hide()
              .removeClass('n-show');
            // Remove class from body
            $('body').removeClass(modeClasses[settings.mode]);
          }

          // Resolve target element
          // If not using jQuery selector, go based on data-tutorial attr
          if (!settings.jQSelector) {
            settings.targetEl = '[data-tutorial="' + settings.targetEl + '"]';
          }
          // If targetEl returns array with more than one, choose
          // by targetElIndex
          var targetElement;
          if($(settings.targetEl).length > 1) {
            targetElement =
              $(settings.targetEl).filter(':visible')[settings.targetElIndex];
          } else {
            targetElement = $(settings.targetEl);
          }

          // Position/populate tutorial element
          if (settings.show) {
            // Decide location for tutorial element based on its target element
            var offset = $(targetElement).offset();
            posY = offset.top - $(window).scrollTop() + settings.offset.y;
            posX = offset.left - $(window).scrollLeft() +
              settings.offset.x;
            targetWidth = $(targetElement).outerWidth();
            targetHeight = $(targetElement).outerHeight();
            loadTutorial();
          }
          else {
            // hideTutorial();
          }

          // Used for positioning the element
          function position (element, newPosition, delay) {
            delay = (delay?delay:0);

            // For IE9, if not tooltip (which doesn't animate position)
            if ($('html').hasClass('ie9') && settings.mode !== mode.tooltip) {
              $('body .' + element)
                .animate({'-ms-transform': newPosition}, delay);
            }

            // For current internet browsers
            else {
              $('body .' + element).css({
                  '-webkit-transform': newPosition,
                  '-moz-transform': newPosition,
                  '-ms-transform': newPosition,
                  '-o-transform': newPosition,
                  'transform': newPosition
                });
            }
          }

          // Used for positioning the mouse
          function positionMouse (mouse, position) {

            // For IE9
            if ($('html').hasClass('ie9')) {
              mouse.animate({
                'top': position.top,
                'left': position.left
              },mouseMoveDuration);
            }

            // For current internet browsers
            else {
              mouse.css({
                'top': position.top,
                'left': position.left
              });
            }
          }

          // Mouse click on target Element (if this is not a 'hide' step)
          function mouseClick() {
            setTimeout(function(){
              $('body .' + modeClasses[settings.mode]).addClass('clicked');
              // TODO: Click animation using jQuery for IE9
              setTimeout(function(){ // Give time for click animation to start
                $(targetElement).trigger('click');
              }, 150);
              setTimeout(function(){ // Give time for the animation to complete
                $('body .' + modeClasses[settings.mode])
                  .removeClass('clicked');
              }, clickDuration);
            }, settings.mClickDelay + mouseOpenDuration + mouseMoveDuration);
          }

          // Position tooltip (based on tooltip-location attribute)
          function positionToolTip(location) {
            var translate;
            switch ( location ) {
              case 'center':
                translate = 'translate(' +
                      Math.round(posX - settings.tWidth/2 + targetWidth/2) +
                      'px,' +
                      Math.round(posY + targetHeight/2 - settings.tHeight/2) +
                      'px)';
                position(modeClasses[settings.mode], translate);
                break;
              case 'bottom':
                translate = 'translate(' +
                      Math.round(posX - settings.tWidth/2 + targetWidth/2) +
                      'px,' +
                      Math.round(posY + targetHeight + 20) + 'px)';
                position(modeClasses[settings.mode], translate);
                break;
              case 'top':
                translate = 'translate(' +
                      Math.round(posX - settings.tWidth/2 + targetWidth/2) +
                      'px,' +
                      Math.round(posY - targetHeight -
                                         settings.tHeight - 20) +
                      'px)';
                position(modeClasses[settings.mode], translate);
                break;
              case 'left':
                translate = 'translate(' +
                      Math.round(posX - settings.tWidth - 20) + 'px,' +
                      Math.round(posY + targetHeight/2 -
                                 settings.tHeight/2) +
                      'px)';
                position(modeClasses[settings.mode], translate);
                break;
              case 'right':
                translate = 'translate(' +
                      Math.round(posX + targetWidth + 20) + 'px,' +
                      Math.round(posY + targetHeight/2 -
                                 settings.tHeight/2) + 'px)';
                position(modeClasses[settings.mode], translate);
                break;
            }
          }

          // Populate the tooltip text and set event handlers to be triggered
          function populateTooltip() {
            var tooltip = $('body .' + modeClasses[settings.mode]);

            // Header
            $(tooltip).find('.n-header-text').html(settings.tHeader);

            // Message
            var message = settings.tMessage.split('|');
            var fullText = '';
            var i;
            for ( i = 0; i < message.length; i++ ) {
              var paragraph = '<p class="n-text">' +
                                message[i] +
                              '</p>';
              fullText += paragraph;
            }
            $(tooltip).find('.n-message').html(fullText);

            // Button
            var btnText = (settings.tBtnNext ? 'Next' : settings.tBtnText);
            $(tooltip).find('.btn-next-step').html(btnText);

            // Assign event handler to close buttons
            $(tooltip).find('.n-close-button').off();
            $(tooltip).find('.n-close-button').on('click', function(){
              $('body').trigger(AppEvents.TUTORIAL_TOOLTIP_CLOSE);
            });

            // TryIt link
            if (settings.tTryIt) {
              $(tooltip).find('.tryIt').on('click', function(){
                $(settings.tTryItClickSelector).trigger('click');
              });
              $(tooltip).find('.n-controls').addClass('-try-it');
            }
            else {
              $(tooltip).find('.n-controls').removeClass('-try-it');
            }

            // Steps
            $(tooltip).find('.n-steps').html('');
            var ii;
            for ( ii = 0; ii < settings.tSteps; ii++ ) {
              var step = $('<span class="n-step"></span>');
              if ( ii < settings.tCurrStep ) { // Add class to completed
                $(step).addClass('n-complete');
              }
              else if ( ii === settings.tCurrStep ) {
                $(step).addClass('n-current'); // Add class to current step
              }
              $(tooltip).find('.n-steps').append(step);
            }
          }
        }
      });

      // Tooltip
      // $.extend(true, $.fn.tooltip.Constructor.prototype, {
      //   parentInit: $.fn.tooltip.Constructor.prototype.init,
      //   parentGetOptions: $.fn.tooltip.Constructor.prototype.getOptions,
      //   init: function(type, element, options) {

      //     // Fix for the case where called with data- attributes
      //     this.type = type;
      //     this.$element = $(element);
      //     options = this.parentGetOptions(options);

      //     // Call parent to setup tooltip
      //     this.parentInit(type, element, options);

      //     // Introduce modification for a hoverable tooltip
      //     if (options && options.trigger && options.trigger === 'hoverable') {

      //       // Current visibility state of the tooltip
      //       var visible = false;

      //       // Handler registration for timeout functions
      //       var timeout = null;

      //       // For use in anonymous functions
      //       var _this = this;

      //       // Internal function for setting the visibility of the tooltip
      //       // @param newVisibility - true for visible, false for hidden
      //       var setVisibility = function(newVisibility) {

      //         // If the visibility changed
      //         if (visible !== newVisibility) {

      //           // Going from hidden to visible
      //           if (newVisibility) {

      //             // If tooltip was instructed to hide, cancel that timeout
      //             if (timeout !== null) {
      //               clearTimeout(timeout);
      //               timeout = null;
      //             }

      //             // If tooltip is not visible, show it
      //             else {
      //               _this.show();
      //             }
      //           }

      //           // Going from visible to hidden
      //           else {

      //             // If tooltip was already instructed to hide, cancel that timeout
      //             if (timeout !== null) {
      //               clearTimeout(timeout);
      //             }

      //             // Set a short timeout (100ms) for hiding the tooltip
      //             timeout = setTimeout(function() {
      //               _this.tip().off('mouseenter');
      //               _this.tip().off('mouseleave');
      //               _this.hide();
      //               timeout = null;
      //             }, 100);
      //           }
      //         }

      //         // Register the new visibility
      //         visible = newVisibility;
      //       };

      //       // Setup triggers on entering/leaving the tooltip and the question mark
      //       $(element).on('mouseenter', function(e) {
      //         setVisibility(true);
      //         _this.tip().on('mouseenter', function(e) {
      //           setVisibility(true);
      //         });
      //         _this.tip().on('mouseleave', function(e) {
      //           setVisibility(false);
      //         });
      //       });
      //       $(element).on('mouseleave', function(e) {
      //         setVisibility(false);
      //       });
      //     }
      //   },
      //   getOptions: function(options) {
      //     var newOptions = this.parentGetOptions(options);
      //     if (newOptions && newOptions.trigger &&
      //         newOptions.trigger === 'hoverable') {
      //       newOptions.trigger = 'manual';
      //     }
      //     return newOptions;
      //   }
      // });

      // Add other jQuery plugins here


      // Private Functions
      //------------------

      // @private
      // Function called when the user presses the tab key. It's purpose is to
      // block the ability to tab into other elements that are not part of the
      // currently active modal. This problem also came up for the angular-ui
      // project so this implementation is adapted from their fix here:
      // https://github.com/angular-ui/bootstrap/pull/4004/files
      //
      // The tab behavior implemented will loop through the tabbable items
      // within the modal context. Whenever the last item is tabbed past,
      // the focus will be assigned to the first item. If the user is tabbing
      // in the opposite direction then the converse is true.
      function _tabTrap(ev) {
        var tabbableSelector =
          'a[href], area[href], input:not([disabled]), ' +
          'button:not([disabled]), select:not([disabled]), ' +
          'textarea:not([disabled]), *[tabindex], *[contenteditable=true]';
        var focusItem;

        if ($.ui && ev.which === $.ui.keyCode.TAB) {
          var $activeModal = $('#globalModalWrapper .modal:visible');
          var $activeModalInputs =
            $activeModal.find(tabbableSelector).filter(':visible');

          // Tabbing backwards past the first focusable item.
          if (ev.shiftKey && ev.target === _.first($activeModalInputs)) {
            focusItem = _.last($activeModalInputs);
          }
          // Tabbing forwards past the last focusable item. If nothing was in
          // focus then default to the first focusable item in the modal.
          else if (!ev.shiftKey && ev.target === _.last($activeModalInputs) ||
                   !$activeModal.has(ev.target).length) {
            focusItem = _.first($activeModalInputs);
          }

          // If the user has reached the last focusable item in the active
          // modal then manually set the focus.
          if (focusItem) {
            focusItem.focus();
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
      }

    }(jQuery));
  }
);
