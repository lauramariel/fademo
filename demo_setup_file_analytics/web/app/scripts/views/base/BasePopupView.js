//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// BasePopupView is the parent class of all popups.
//
// For any new Popup Created please refer to the doc https://goo.gl/0CmbxD
//
define([
  // Core
  'views/base/BaseView',
  // Templates
  'text!templates/base/popup/DefaultDashboardPopup.html',
  'text!templates/base/popup/DefaultTabs.html',
  // Data : TodoAfterPopupCleanup : Remove this line
  'data/CleanedPopups',
  // Events
  'events/AppEvents',
  // Utils
  'utils/ModalMixin',
  'utils/CommonTemplates',
  'utils/AppConstants',
  'utils/AntiscrollUtil',
  'utils/AppUtil'
  ],
function(
  // References of core
  BaseView,
  // References of templates
  defaultTemplate,
  defaultTabs,
  // References of data : TodoAfterPopupCleanup : Remove this line
  CleanedPopups,
  // Events
  AppEvents,
  // References of utils
  ModalMixin,
  CommonTemplates,
  AppConstants,
  AntiscrollUtil,
  AppUtil) {

  'use strict';

  // Default Popup Template Options
  const TEMPLATE_DEFAULT_OPTIONS = {
    closeButton         : true,
    nestedAlert         : false,
    tabs                : false,
    stepTabs            : false,
    footer              : true,
    title               : '',
    alertContent        : '',
    tabsList            : '',
    bodyContent         : '',
    footerButtons       : ''
  };

  const savingTemplate = _.template(CommonTemplates.SAVING);

  defaultTemplate = _.template(defaultTemplate);
  defaultTabs = _.template(defaultTabs);

  // Extending the BaseView
  const BasePopupView = BaseView.extend(_.extend({}, ModalMixin, {

    // PROBLEM in Backbone and Bootstrap Modal:
    // The core of the problem that people run in to when using a modal
    // dialog is that the modal plugin removes the DOM element that wraps the
    // modal, from the DOM. The problem that this usually causes is that a
    // Backbone view will lose it's event handling when the DOM element gets
    // moved around by the modal dialog.
    //
    // SOLUTION:
    // Don't modal a Backbone view, rather have a div tag in the global popup
    // container, that will contain the template.


    // Constants
    //----------

    // Show Alert event constant for the popup
    SHOW_ALERT: 'showAlert',

    // Properties
    //-----------

    // A flag that tells whether the form is update or create. The values are
    // based on AppConstants.ACTION_CREATE, AppConstants.ACTION_UPDATE or
    // AppConstants.ACTION_DELETE. Backbone.Model provides isNew property to
    // know if the Model is new / edit, however, due to the nature of some
    // entities that its 'id' is its 'name', we have to manually set the
    // mode. We can't rely on empty id.
    mode : null,

    // The action route to be implemented by the popup
    actionRoute : null,

    // Remove the DOM when hiding the popup. Set it to 'false' if you do not
    // want to destroy popup on hide.
    removePopupOnHide: true,

    // Turns the popup into a full page popup when set to true
    // TODO: Connect the styles to the full page popup mixin
    fullPagePopup: false,

    // When multiple popups are open, overlay the active popup over others.
    // Useful when opening another popup while a full page popup is also open.
    overlayPopup: false,

    // Specific Properties for Cleaned Up Popups

    // TodoAfterPopupCleanup : remove this line
    cleanedPopup: false,

    // State of the Alert
    alertIsAnimating: false,

    // Alert Sliding Callbacks
    alertCallbacks: [],

    // Store the Antiscroll container (jQuery)
    $scrollElt: null,

    // Store the Antiscroll options (Object)
    scrollOptions: {},

    // Store the Antiscroll instance (Object)
    antiscrollInstance: null,

    // setTimeout for Header Alerts
    hideHeaderTimeoutId: null,

    // for ModalMixin References
    actionReferences: {
      [AppConstants.MODAL.ACT.AS_REFRESH]   : '_refreshAntiscroll',
      [AppConstants.MODAL.ACT.AS_REBUILD]   : '_rebuildAntiscroll',
      [AppConstants.MODAL.ACT.ALERT_SHOW]   : '_showAlert',
      [AppConstants.MODAL.ACT.ALERT_HIDE]   : '_hideAlert',
      [AppConstants.MODAL.ACT.COVER_SHOW]   : '_showCover',
      [AppConstants.MODAL.ACT.COVER_HIDE]   : '_hideCover',
      [AppConstants.MODAL.ACT.TABS_SHOW]    : '_showTabs',
      [AppConstants.MODAL.ACT.TABS_HIDE]    : '_hideTabs',
      [AppConstants.MODAL.ACT.SET_TITLE]    : '_setTitle',
      [AppConstants.MODAL.ACT.REVERT_TITLE] : '_revertTitle',
      [AppConstants.MODAL.ACT.SET_STEP]     : '_setStep',
      [AppConstants.MODAL.ACT.SUBVIEW_SHOW] : 'showSubview'
    },

    events: {
      'click .modal-header .close:not(.disabled)': 'hide',
      'click [data-dismiss="alert"]'             : 'clearHeader',
      'click .btnCancel'                         : 'hide',
      'keypress input'                           : 'onKeyPress'
    },

    // Functions
    //----------

    // @override
    // Call super's initialize
    initialize(options) {
      // TodoAfterPopupCleanup : remove this line
      this.cleanedPopup = !!this.el && CleanedPopups.indexOf(this.el.id) > -1;
      BaseView.prototype.initialize.apply(this, arguments);
      this.registerPopup();
    },

    // Generates the default global popup template
    // Returns the populated template
    // @param options (optional) - Options to pass to the template
    defaultTemplate(options) {
      options = options || {};
      return defaultTemplate(_.extend(
        {},
        TEMPLATE_DEFAULT_OPTIONS,
        options
      ));
    },

    // NOTE: To be overridden by subclass
    // Function called to show the popup.
    show(actionRoute) {
      // Store the current actionRoute
      this.actionRoute = actionRoute;
      // Render the view
      this.render();

      // remove the full screen alpha overlay
      $('body').removeClass('n-popup-show');
      $('#globalModalContainer').attr('data-popup-count', 0);

      // If the route is specified as an overlay, honor that. Doing this
      // will enable same popup being used as an overlay or non-overlay.
      if (this.actionRoute) {
        this.overlayPopup = this.overlayPopup ||
          this.actionRoute.actionRouteOverlay;
      }

      // Get popup type
      let popupType = actionRoute.popupType || '';

      // Show the modal
      this.$el.nutanixPopup({
        show: true,
        fullPagePopup: this.fullPagePopup,
        overlayPopup: this.overlayPopup,
        popupType: popupType
      });

      this.$scrollElt = this.$('.antiscroll-wrap');
      // TodoAfterPopupCleanup : remove this condition and return
      // Only go further is it's a cleanedPopup
      if (!this.cleanedPopup) {
        return;
      }
      // If steps are there, initialize them
      const stepIndex = this.$('.step-tabs li').filter('.active').index();
      this.triggerAction(AppConstants.MODAL.ACT.SET_STEP, stepIndex);
      this.scrollOptions = {
        x: false
      };
      // antiscroll
      this.applyAntiScroll();
    },

    // @private
    // Initialize Steps
    _initSteps() {
      // TodoAfterPopupCleanup : remove this condition and statement
      // No step tabs if it's not a cleaned up popup
      if (!this.cleanedPopup) {
        this.hasSteps = false;
        return;
      }

      // Store the steps
      this.$steps = this.$('.step-tabs li');
      // If there are Steps in the DOM
      this.hasSteps = this.$steps.length > 0;
    },

    // @private
    // Set Step
    // Called on AppConstants.MODAL.ACT.SET_STEP
    _setStep(index) {
      // If not initialized yet
      if (this.hasSteps === undefined) {
        this._initSteps();
      }

      // If there is no Steps in the DOM
      if (!this.hasSteps) {
        return;
      }

      // If there is no index or negative index then use the first Step
      if (index === undefined || index < 0) {
        index = 0;
      }

      // Get the current Step
      const currentStep = this.$steps.eq(index);

      // Reset all the steps to default
      this.$steps.removeClass('disabled active');

      // Set Active Step then Disabled Steps
      currentStep.addClass('active').nextAll().addClass('disabled');
    },

    // @private
    // Hide Alert Message
    // Called on AppConstants.MODAL.ACT.ALERT_HIDE
    _hideAlert() {
      // Slide (up) the alert
      this._slideAlert();
    },

    // @private
    // Get Options for Alert Based on the Type of Alert
    // @param options - Object containing custom settings:
    //   custom message, type, closeTiming, closeButton etc...
    _getAlertOptionsBasedOnType: (function() {
      // Default values based on type
      const types = {
        [AppConstants.MODAL.ALERT.TYPE_INFO](options) {
          return {
            closeTiming: options.closeTiming ||
              AppConstants.MODAL.ALERT.CLOSE_TYPE_DEFAULT,
            tplOptions: {
              style: AppConstants.MODAL._ALERT.STYLE_INFO,
              closeButton: options.cbSet ? options.closeButton : true,
              message: options.message
            }
          };
        },
        [AppConstants.MODAL.ALERT.TYPE_SUCCESS](options) {
          return {
            closeTiming: options.closeTiming ||
              AppConstants.MODAL.ALERT.CLOSE_TYPE_DEFAULT,
            tplOptions: {
              style: AppConstants.MODAL._ALERT.STYLE_SUCCESS,
              closeButton: options.cbSet ? options.closeButton : true,
              message: options.message
            }
          };
        },
        [AppConstants.MODAL.ALERT.TYPE_WARNING](options) {
          return {
            closeTiming: options.closeTiming ||
              AppConstants.MODAL.ALERT.CLOSE_TYPE_DEFAULT,
            tplOptions: {
              style: AppConstants.MODAL._ALERT.STYLE_WARNING,
              closeButton: options.cbSet ? options.closeButton : true,
              message: options.message
            }
          };
        },
        [AppConstants.MODAL.ALERT.TYPE_ERROR](options) {
          const newOptions = {
            closeTiming: options.closeTiming ||
              AppConstants.MODAL.ALERT.CLOSE_TYPE_PERMANENT,
            tplOptions: {
              style: AppConstants.MODAL._ALERT.STYLE_ERROR,
              closeButton: options.cbSet ? options.closeButton : true
            }
          };

          const processedError = AppUtil.processAjaxError(options.message);

          let message = AppUtil.processThrownError(
            processedError || 'Server Error',
            options.isHtml
          );

          if (options.description) {
            message = `${options.description} ${message}`;
          }

          if (options.details) {
            newOptions.tplOptions.tooltip =
              AppUtil.processAjaxError(options.details);
            newOptions._callback = function() {
              this.$('.n-error-details').tooltip({
                placement: 'bottom',
                trigger:   'hover',
                container: 'body',
                html:      !options.displayDetailsAsTxt
              });
            };
          }

          if (options.routeObj) {
            if (
              options.routeObj.options &&
              options.routeObj.options.trigger === 'click'
            ) {
              newOptions.tplOptions.clickLink = options.routeObj;
            } else {
              newOptions.tplOptions.link = options.routeObj;
            }
          }

          newOptions.tplOptions.message = message;

          return newOptions;
        },
        [AppConstants.MODAL.ALERT.TYPE_LOADING](options) {
          return types[AppConstants.MODAL.ALERT.TYPE_INFO].bind(this)(
            _.extend(
              {},
              options,
              {
                cbSet: true,
                closeButton: options.cbSet ? options.closeButton : false,
                closeTiming: options.closeTiming ||
                  AppConstants.MODAL.ALERT.CLOSE_TYPE_PERMANENT,
                message: 'Loading...'
              }
            )
          );
        },
        [AppConstants.MODAL.ALERT.TYPE_SAVING](options) {
          return types[AppConstants.MODAL.ALERT.TYPE_INFO].bind(this)(
            _.extend(
              {},
              options,
              {
                cbSet: true,
                closeButton: options.cbSet ? options.closeButton : false,
                closeTiming: options.closeTiming ||
                  AppConstants.MODAL.ALERT.CLOSE_TYPE_PERMANENT,
                message: 'Saving...'
              }
            )
          );
        },
        [AppConstants.MODAL.ALERT.TYPE_NODATA](options) {
          return types[AppConstants.MODAL.ALERT.TYPE_ERROR].bind(this)(
            _.extend(
              {},
              options,
              {
                cbSet: true,
                closeButton: options.cbSet ? options.closeButton : false,
                closeTiming: options.closeTiming ||
                  AppConstants.MODAL.ALERT.CLOSE_TYPE_DEFAULT,
                message: 'No Data Found'
              }
            )
          );
        },
        [AppConstants.MODAL._ALERT.TYPE_DEFAULT](options) {
          return types[AppConstants.MODAL.ALERT.TYPE_INFO].bind(this)(
            _.extend(
              {},
              options,
              {
                cbSet: true,
                closeButton: options.cbSet ? options.closeButton : false
              }
            )
          );
        }
      };

      return function(options) {
        // if Close Button is defined (to use this value instead of default)
        options.cbSet = _.isBoolean(options.closeButton);
        // Get the type based on the options passed or default
        const type = types[options.type] ||
          types[AppConstants.MODAL._ALERT.TYPE_DEFAULT];
        return type.bind(this)(options);
      };
    }()),

    // @private
    // Show Alert Message
    // Called on AppConstants.MODAL.ACT.ALERT_SHOW
    _showAlert(options) {
      // Return all the options we need for the Alert
      options = this._getAlertOptionsBasedOnType(options || {});

      // Populate the template
      this._populateAlertTpl(options.tplOptions);

      // Private callback (to instanciate the tooltip for instance)
      if (options._callback) {
        options._callback.bind(this)();
      }

      // Slide (down) the alert and set the timing to close it if needed
      this._slideAlert(true, this._getAlertCloseTiming(options.closeTiming));
    },


    // @private
    // Refresh the scroll and scrollbars to fit the content
    // Called on AppConstants.MODAL.ACT.AS_REFRESH
    _refreshAntiscroll() {
      AntiscrollUtil.refreshAntiscroll(this.antiscrollInstance);
    },

    // @private
    // Rebuild the whole antiscroll
    // Called on AppConstants.MODAL.ACT.AS_REBUILD
    _rebuildAntiscroll() {
      if (!this.$scrollElt) {
        // if $scrollElt doesn't exist it means the event was triggered
        // before the antiscroll is built so we ignore it
        return;
      }
      AntiscrollUtil.rebuildAntiScroll(
        this.$scrollElt,
        this.scrollOptions
      );
      this.antiscrollInstance = this.$scrollElt.data('antiscroll');
    },

    // @private
    // Show Cover layer to avoid any user action
    // Called on AppConstants.MODAL.ACT.COVER_SHOW
    _showCover() {
      this.$('.n-modal-wrapper').addClass(AppConstants.MODAL._CLASS.COVER);
    },

    // @private
    // Hide Cover layer
    // Called on AppConstants.MODAL.ACT.COVER_HIDE
    _hideCover() {
      this.$('.n-modal-wrapper').removeClass(AppConstants.MODAL._CLASS.COVER);
    },

    // @private
    // Show Tabs
    // Called on AppConstants.MODAL.ACT.TABS_SHOW
    _showTabs() {
      this.$('.n-modal-tabs').removeClass(AppConstants.MODAL._CLASS.TABS);
    },

    // @private
    // Hide Tabs
    // Called on AppConstants.MODAL.ACT.TABS_HIDE
    _hideTabs() {
      this.$('.n-modal-tabs').addClass(AppConstants.MODAL._CLASS.TABS);
    },

    // @private
    // Slide Alert Container
    // @param downward (optional) - Boolean (open if true, otherwise close)
    // @param delay (optional) - Number (Delay to wait before closing alert)
    _slideAlert(downward, delay) {
      const _arguments = arguments;

      // Clear the previous closeTiming
      clearTimeout(this.hideHeaderTimeoutId);

      if (this.alertIsAnimating) {
        // If the Alert is animating we add the action to the callback list
        // to call it after the animation is done
        // (to avoid cut in the animations)
        this.alertCallbacks.push(() => {
          this._slideAlert.apply(this, _arguments);
        });
      } else {
        // No other animation in progress we set the animating to true
        this.alertIsAnimating = true;
        // and animate the Alert container based on the direction passed
        this.$('.n-modal-alert-header')[downward ? 'slideDown' : 'slideUp']({
          duration: AppConstants.MODAL.ALERT.SLIDING_DURATION,
          complete: () => {
            // When done we set the animating to false
            this.alertIsAnimating = false;
            if (this.alertCallbacks.length) {
              // Then we call the next animation if there is any
              this.alertCallbacks.shift()();
            } else {
              // Or we set the closing timing if any needed
              if (_.isNumber(delay)) {
                this.hideHeaderTimeoutId = setTimeout(() => {
                  this._slideAlert();
                }, delay);
              }
            }
          }
        });
      }
    },

    // @private
    // Get Close Timing for Alert
    // @param closeTiming (optional) - String value for timing
    _getAlertCloseTiming: (() => {
      // Timing values based on Type
      const timings = {
        [AppConstants.MODAL.ALERT.CLOSE_TYPE_FAST] :
          AppConstants.MODAL._ALERT.CLOSE_TIMER_FAST,
        [AppConstants.MODAL.ALERT.CLOSE_TYPE_SLOW] :
          AppConstants.MODAL._ALERT.CLOSE_TIMER_SLOW,
        [AppConstants.MODAL.ALERT.CLOSE_TYPE_PERMANENT] :
          AppConstants.MODAL._ALERT.CLOSE_TIMER_PERMANENT,
        [AppConstants.MODAL.ALERT.CLOSE_TYPE_DEFAULT] :
          AppConstants.MODAL._ALERT.CLOSE_TIMER_DEFAULT
      };

      return function(closeTiming) {
        let delay;

        if (_.isNumber(closeTiming)) {
          // If timing is a number we use it instead of default
          delay = closeTiming;
        } else {
          // Get the timing based on the closeTiming passed or default
          delay = timings[closeTiming] ||
            timings[AppConstants.MODAL.ALERT.CLOSE_TYPE_DEFAULT];
        }
        return delay;
      };
    })(),

    // @private
    // Populate Alert Template
    // @param options - Object
    _populateAlertTpl(options) {
      let link = '';

      // If a link is set we use it with the according template
      // based on the type of link
      // if (options.link) {
      //   link = CommonTemplates.ALERT_LINK(options.link);
      // } else if (options.clickLink) {
      //   link = CommonTemplates.ALERT_CLICK_LINK(options.clickLink);
      // } else if (options.tooltip) {
      //   link = CommonTemplates.ALERT_TOOLTIP(_.extend({}, options, {
      //     text: this.i18n('alerts.show_why')
      //   }));
      // }

      // Populate the template and add it to the DOM
      this.$('.n-modal-alert-header').html(CommonTemplates.DEFAULT_ALERT({
        style: options.style,
        closeButton: options.closeButton,
        content: options.message + link
      }));
    },

    // NOTE: To be overridden by subclass
    // Function called to hide the popup.
    // forceHide: Use this option to force hide the popup view even
    // if there is a confirm dialog being shown.
    hide(forceHide) {
      const returnHandler = () => {
        this.$el.nutanixPopup({
          show : false,
          removePopup: this.removePopupOnHide,
          fullPagePopup: this.fullPagePopup,
          overlayPopup: this.overlayPopup,
          cleanUp: _.bind(this.destroy, this)
        });

        this.resetVerticalPosition();

        // Trigger AppEvents.POPUP_CLOSE event
        // If there's an action route defined, pass along the action info
        // as an additional parameter to the event handler so that the
        // event handler can handle the event based on the action of
        // closing the popup.
        if (this.actionRoute) {
          $('body').trigger(AppEvents.POPUP_CLOSE, [this.actionRoute]);
        } else {
          $('body').trigger(AppEvents.POPUP_CLOSE);
        }
      };
      $('#auditDetailsPopup').html('');
      if (this.canHide() || forceHide) {
        this.confirmHide(returnHandler);
      }
    },

    // NOTE: To be overridden by subclass
    // Popup subclasses can override this to show a confirm dialog. If this
    // is overridden, make sure to return a boolean.
    confirmHide(returnHandler) {
      returnHandler();
    },

    // NOTE: To be overridden by subclass
    // Check to see if the popup is in a state where it can be hidden. If
    // this is overridden, make sure to return a boolean.
    canHide() {
      // Don't allow the popup to be hidden if a confirm dialog is present.
      if ($('#nutanixConfirmModal:visible').length) {
        return false;
      } else {
        return true;
      }
    },

    // NOTE: To be overridden by subclass
    // Slides the content to show form and updates the footer and header
    // where in 'mode' is 'Create' or 'Edit'
    showForm(mode, isAnimate) {
    },

    // NOTE: To be overridden by subclass
    // Slides the content to show form and updates the footer and header
    showList() {
    },

    // NOTE: To be overridden by subclass
    // Function called to reset the popup.
    reset(actionRoute) {
    },

    // Functions (Event Handlers)
    //---------------------------

    // Function called for key inputs
    onKeyPress(e) {
      if (this.cleanedPopup) {
        this._hideAlert();
      } else {
        this.clearHeader();
      }
      if (e.keyCode === 13) {
        // If enter key is pressed.
        this.onEnterKeyPress();
        // Added to prevent the default event handling in chrome.
        e.preventDefault();
      } else {
      }
    },

    // Override this function to call your save function
    onEnterKeyPress() {
    },

    // Functions (Header Alerts)
    //--------------------------

    // Show a sub view, such as a form within the popup
    // By default we animate it to keep JC happy.
    // @param elementId - the div to be animated
    // @param direction - animation direction: 'left' or 'right'
    // TODO: Consider moving the position and animation styles to the less
    // files.
    showSubview(elementId, direction, suppressAnimation, opts) {
      opts = opts || {};
      _.defaults(opts, { duration: 500 });

      let startXpos = 0;

      if (!suppressAnimation) {
        const completeCallback = opts.complete;
        opts.complete = () => {
          if (completeCallback) {
            completeCallback();
          }
          if (this.cleanedPopup) {
            this.triggerAction(AppConstants.MODAL.ACT.AS_REBUILD);
          }
        };
        startXpos = direction === 'left' ? '600px' : '-560px';
      }
      this.$(elementId).css({ left: startXpos });
      this.$(elementId).show({
        complete: () => {
          if (this.cleanedPopup) {
            this.triggerAction(AppConstants.MODAL.ACT.AS_REBUILD);
          }
          if (!suppressAnimation) {
            this.$(elementId).animate({ left: '0px' }, opts);
          }
        },
        duration:0
      });
    },

    // Hide a sub view, such as a form within the popup
    // No animation, to keep Raj happy
    hideSubview(elementId) {
      this.$(elementId).hide({
        complete: () => {
          if (this.cleanedPopup) {
            this.triggerAction(AppConstants.MODAL.ACT.AS_REBUILD);
          }
        },
        duration: 0
      });
    },

    // Scrolls to the bottom of the modal form.
    scrollToBottom() {
      const p = this.$('.n-modal-body');
      $(p).animate({ scrollTop: $(p).prop('scrollHeight') - $(p).height() },
        0, 'fast');
    },

    // Scrolls to top of the modal form.
    scrollToTop(suppressAnimation) {
      const p = this.$('.n-modal-body');
      if (suppressAnimation) {
        $(p).animate({ scrollTop: '0px' }, 0);
      } else {
        $(p).animate({ scrollTop: '0px' }, 'fast');
      }
    },

    // Resets the top position by removing it from the inline style
    resetVerticalPosition() {
      this.$el.css('top', '');
    },

    // Clears the popup's header area of Error or Success messages
    clearHeader() {
      this.$('.n-modal-alert-header').slideUp(300);
      this.$('.n-modal-alert-header').removeClass('not-empty');
    },

    // @override
    // Destroy this instance
    destroy() {
      // Remove popup remove event.
      AppEvents.offAppEvent(AppEvents.ROUTE_CHANGE);
      // TodoAfterPopupCleanup : remove the condition (not the code inside)
      if (this.cleanedPopup) {
        if (this.antiscrollInstance) {
          this.antiscrollInstance.destroy();
        }

        // Remove Close Button (alert) handler
        this.$el.off('click.closeAlert');

        // Remove Select Step handler
        this.$el.off('click.selectStep');

        // Unregister the Popup for Actions from ModalMix
        this.unregisterPopup();
      }

      // Call the base cleanup API
      BaseView.prototype.destroy.apply(this, arguments);
    },

    // Shows success text on the popup's header
    showHeaderSuccess(msg) {
      msg = msg || 'Success';
      const successHTML = CommonTemplates.SUCCESS({ msg });
      this._showHeader(successHTML);
    },

    // Shows an error alert on the popup's header
    // @ param isHtml - boolean to determine if error contains html.
    showHeaderError(m, error, isHtml) {
      let errorMsg;

      // Show error
      if (_.isString(m)) {
        // Check if first param is a string error
        errorMsg = m;
      } else if (_.isString(error)) {
        // Check if second param is string (for validation)
        errorMsg = error;
      } else if (error && error.responseText) {
        // Check if second param is an xhr object
        errorMsg = error.responseText;
      }

      // By default it's true as we use this method in many popups in prism
      // for client side errors.
      // NOTE: Clients which are sure that error doesn't contain html
      // will need to pass in isHtml as false to prevent XSS issues.
      let isHtmlError = true;
      if (_.isBoolean(error)) {
        isHtmlError = error;
      } else if (_.isBoolean(isHtml)) {
        isHtmlError = error;
      }

      // errorMsg = 'Server Error';
      this.showHeaderTextError(errorMsg);
    },

    // Show a server side error alert on popup header
    // @param [Required] errorThrown - server side error
    // @param errorDescription - optional error description in plain text
    showHeaderErrorWithDescription(errorThrown, errorDescription) {
      let errorMsg = 'Error message';
      if (errorDescription) {
        errorMsg = `${errorDescription} ${errorMsg}`;
      }
      this.showHeaderTextError(errorMsg);
    },

    // Show error message with link ( trigger for action )
    showHeaderErrorWithAction(message, routeObj) {
      const errorHTML = CommonTemplates.ERROR_WITH_ACTION({
        error: message,
        routeObj
      });
      this._showHeader(errorHTML);
    },

    // Show plain text error alert on popup header
    // @param errorMsg - error message in plain text
    showHeaderTextError(errorMsg) {
      const errorHTML = CommonTemplates.ERROR({ error: errorMsg });
      this._showHeader(errorHTML);

      // Scroll to top
      this.$('.n-modal-body').animate({ scrollTop: 0 }, 300);
    },

    // Shows an info alert on the popup's header
    showHeaderInfo(msg) {
      msg = msg || 'Info';
      const infoHTML = CommonTemplates.INFO({ msg });
      this._showHeader(infoHTML);
    },

    // Shows a warning alert in the popup's header.
    showHeaderWarning(msg) {
      msg = msg || 'Warning';
      const warningHTML = CommonTemplates.WARNING({ msg });
      this._showHeader(warningHTML);
    },

    // Show error with details tooltip.
    showHeaderErrorWithDetails(error, details, displayAsTxt) {
      const errorObj = {};
      errorObj.error = 'Server Error';
      errorObj.details = 'No details available';
      const errorHTML = CommonTemplates.ERROR_DETAILS(errorObj);
      this._showHeader(errorHTML);

      // Adding tooltip to the error.
      this.$('.n-error-details').tooltip({
        placement: 'bottom',
        trigger:   'hover',
        container: 'body',
        html:      displayAsTxt ? false : true
      });

      // Scroll to top
      // JIRA ticket ENG-22683: scroll to top when failed remote site
      this.$('.n-modal-body').animate({ scrollTop: 0 }, 300);
    },

    // Shows loading text on the popup's header
    //
    // @param msg - Loading text to use (optional).
    showHeaderLoading(msg) {
      msg = msg || 'Loading';
      this.showHeaderInfo(msg);
    },

    // Shows saving text on the popup's header
    // @param message - custom message instead of saving.
    showHeaderSaving(message) {
      let strMessage = message || 'Saving';
      strMessage = strMessage + AppConstants.ELLIPSIS_TEXT;
      this._showHeader(savingTemplate({
        message: strMessage
      }));
    },

    // Shows no data text on the popup's header
    showHeaderNoData() {
      this._showHeader(CommonTemplates.NO_DATA);
    },

    // Show a notification, loading message, or other HTML
    // in the header
    _showHeader(headerHTML) {
      const alertHeaderVisible = this.$(
        '.n-modal-alert-header.not-empty .alert').is(':visible');

      this.$('.n-modal-alert-header').html(headerHTML);
      this.$('.n-modal-alert-header').slideDown(300);

      this.$('.n-modal-alert-header').addClass('not-empty');

      if (!alertHeaderVisible) {
        // Trigger an showAlert event
        this.$('.n-modal-alert-header').trigger(this.SHOW_ALERT);
      }
    },

    // @private
    // Set Modal Title
    // Called on AppConstants.MODAL.ACT.SET_TITLE
    _setTitle(title) {
      this.setTitle(title);
      // TodoAfterPopupCleanup : Move the code from `setTitle` here
    },

    // @private
    // Revert Modal Title to the Previous Title
    // Called on AppConstants.MODAL.ACT.REVERT_TITLE
    _revertTitle() {
      this.revertTitle();
      // TodoAfterPopupCleanup : Move the code from `revertTitle` here
    },

    // Set the popup's title
    setTitle(titleText) {
      const title = this.$('.n-title');
      title.attr('data-old-title', title.text());
      title.text(titleText);
    },

    // Revert the popup's title to the previous value set by setTitle
    revertTitle() {
      const title = this.$('.n-title');
      const oldTitle = title.attr('data-old-title');
      if (oldTitle) {
        title.text(oldTitle);
        title.removeAttr('data-old-title');
      }
    },


    // When the cluster name is changed
    onClusterChange(e) {
      this.currentSelectedClusterUUId = e.currentTarget.attr('value');
    },

    getCurrentSelectedClusterUUId() {
      return this.currentSelectedClusterUUId;
    },

    // Functions (AntiScroll)
    //-----------------------

    // Apply anti-scroll to the content with delay if specified.
    // @param delay  - set a delay
    // @param width  - antiscroll width
    // @param height - antiscroll height
    // @param options (optional) - extra config (object)
    // options.onScroll callback is expected if needed to bind it
    // to the scroll event. ex :
    // {
    //   onScroll : function () {
    //     // on scroll do something
    //   }
    // }
    applyAntiScroll(delay, width, height, options) {
      options = options || this.scrollOptions || {};
      if (delay) {
        setTimeout(
          () => {
            this._createAntiScroll(width, height, options);
          },
          delay
        );
      } else {
        this._createAntiScroll(width, height, options);
      }
    },

    // Create the anti-scroll to the modal body
    // @param width  - antiscroll width
    // @param height - antiscroll height
    // @param options (optional) - extra config (object)
    _createAntiScroll(width, height, options) {
      // options = options || {};
      options = options || {};
      width = `${width || this.$('.n-modal-body').width()}px`;
      height = `${height || this.$('.n-modal-body').height()}px`;

      // Once the popup ID logic in the initialize function is changed,
      // remove the below line and uncomment the code below it.
      // this.$scrollElt = this.$('.antiscroll-wrap');
      // Refresh the scroll element cache if it's no longer in the DOM.
      this.$scrollElt =
        (this.$scrollElt && this.el.contains(this.$scrollElt[0]))
          ? this.$scrollElt : this.$('.antiscroll-wrap');

      AntiscrollUtil.applyAntiScroll(
        this.$scrollElt,
        width,
        height,
        options
      );

      this.antiscrollInstance = this.$scrollElt.data('antiscroll');
      this.$scrollElt.css('visibility', 'visible');
    },


    // Functions (Gateway restart)
    //----------------------------
    // These functions are for those popups that make updates that result
    // in an automatic restart of prism gateway.

    // Show the gateway reload message after the server has been successfully
    // updated.
    // @param strSubject - The subject string to use in the reload display
    // @param information - The information to be displayed upon logout.
    showReload(strSubject, information) {
      // Remove the close button
      this.$('.modal-header button').remove();
      // Display the browser reload template
      this.$('.n-modal-content-wrapper')
        .html(CommonTemplates.GATEWAY_RESTART({ subject: strSubject }));

      this.$('.btnBack').hide();
      this.$('.btnSave').hide();
      this.$('.btnClose').hide();
      this.$('.btnImport').hide();

    },

    // Add 'disabled' class to the close button and show tooltip if a msg is
    // passed in.
    // @param msg - The message that will show up in the tooltip.
    disableCloseButton(msg) {
      const closeButton = this.$('.modal-header .close');

      closeButton.addClass('disabled');
      if (msg) {
        closeButton.tooltip({
          title     : msg,
          placement : 'bottom',
          trigger   : 'hover',
          html      : 'false',
          template  : '<div class="tooltip closebtn-tooltip" ' +
            'role="tooltip"><div class="tooltip-arrow"></div>' +
            '<div class="tooltip-inner"></div></div>'
        });
      }
    },

    // Remove 'disable' class to the close button and destroy the tooltip.
    enableCloseButton() {
      const closeButton = this.$('.modal-header .close');

      closeButton.removeClass('disabled');
      closeButton.tooltip('destroy');
    }
  }));

  return BasePopupView;
});
