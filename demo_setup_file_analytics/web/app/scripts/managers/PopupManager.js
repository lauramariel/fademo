//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// PopupManager handles all the popup related actions
//
define([
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Events
  'events/AppEvents'],
function(
  // References of utils
  AppConstants,
  AppUtil,
  // Events
  AppEvents) {

  'use strict';

  // PopupManager
  //-------------
  return {

    // Properties
    //------------

    // Reference for the current action route object
    currentActionRoute: null,

    // Holds the popup view(s).
    popupViews: [],

    // Popup type i.e. inline for settings page
    popupType: '',

    // Functions
    //------------

    // Setup the PopupManager
    initialize: function() {
      // Bind 'this' to callback functions
      _.bindAll(this, 'renderPopupView', 'renderMultiplePopupView',
        'reduceOpenPopupCount');

      // Hack to fix the Maximum call stack size exceeded error.
      // This happens when we invoke modal on modal.
      // Please refer to the link for further details.
      // http://stackoverflow.com/questions/13649459/twitter-bootstrap-multiple-modal-error
      $.fn.modal.Constructor.prototype.enforceFocus = function() {
        // Empty function
      };

      // Set event handler for close event
      $('body').on(AppEvents.POPUP_CLOSE, this.reduceOpenPopupCount);

    },

    // Register the PopupViewFactory to use with this console
    setPopupViewFactory: function (popupViewFactory){
      this.popupViewFactory = popupViewFactory;
    },

    // Renders the popup after require loads the popup view with its
    // dependency tree.
    renderPopupView: function(PopupViewClass, options) {
      // Hide the loader
      AppUtil.hideLoader();
      // Before instantiating the PopupViewClass, we have to dynamically add
      // the popup element to the #globalModalContainer.
      var popupId = PopupViewClass.prototype.el, popupOptions = '',
          popupView = '';
      if (this.popupType === AppConstants.MODAL.TYPE.INLINE) {
        popupOptions = _.defaults({}, options, {
          el: AppUtil.createInlinePopupContainer(popupId.replace('#', '')),
          [AppConstants.NAV_ACTION_ROUTE]: this.currentActionRoute
        });
        popupView = new PopupViewClass(popupOptions);
      } else {
        popupOptions = _.defaults({}, options, {
          el: AppUtil.createPopupContainer(popupId.replace('#', '')),
          [AppConstants.NAV_ACTION_ROUTE]: this.currentActionRoute
        });
        popupView = new PopupViewClass(popupOptions);
        this.popupViews.push(popupView);
      }

      // Show the popup. Once the popup view is closed, it will be destroyed.
      popupView.show(popupOptions[AppConstants.NAV_ACTION_ROUTE]);

      return popupView;
    },

    // Returns the current popup view
    currentPopupView: function() {
      return _.last(this.popupViews);
    },

    // Renders an instance of BaseMultiplePopupView after require loads the
    // popup view with its dependency tree.
    renderMultiplePopupView: function(MultiplePopupViewClass) {
      // Hide the loader
      AppUtil.hideLoader();

      // Get the mPopupId of the multiple-popup view.
      // Before instantiating the MultiplePopupViewClass, we have to
      // dynamically add the popup element to the #globalModalContainer.
      var mPopupId = MultiplePopupViewClass.prototype.el;

      // Check first if the multiple form popup already exists.
      if (this.popupViews.length &&
        $('body').hasClass('n-popup-show') &&
        $('#globalModalContainer').find(mPopupId).length) {
        // Use the existing visible popup
        var popupView = this.currentPopupView();
        popupView.renderCreateUpdate(this.currentActionRoute);
      }
      else {
        // Show the multiple form popup and dynamically set it here so
        // that when another popup action is called, it could be referenced.
        // Once the popup view is closed, it will be destroyed.
        var multiplePopupView = new MultiplePopupViewClass({
          el : AppUtil.createPopupContainer(mPopupId.replace('#',''))
        });
        multiplePopupView.show(this.currentActionRoute);
        this.popupViews.push(multiplePopupView);
      }
    },

    // Render the wizard popup view
    // @param WizardPopupViewClass - Wizard popup extends from WizardView
    // @param actionRoute - action route
    renderWizardPopupView: function(WizardPopupViewClass, actionRoute) {
      this.currentActionRoute = actionRoute;
      this.renderPopupView(WizardPopupViewClass);
    },

    // Does an application action
    handleAction: function(actionRoute) {
      this.currentActionRoute = actionRoute;
      AppUtil.showLoader();

      // Show the popup
      this.showPopup(actionRoute,
        actionRoute[AppConstants.NAV_ACTION_TARGET]);
    },

    // Shows the popup. Inline require is used here.
    // NOTE: The file name/path parameter to require needs to be unbroken
    // so in this case it's ok to exceed the width limit of 79 chars.
    showPopup: function(action, actionTarget) {
      // Set popup type
      this.popupType = action.popupType || '';

      if (this.popupViewFactory) {
        this.popupViewFactory.showPopup(action, actionTarget,
          this.renderPopupView, this.renderMultiplePopupView);
      } else {
        throw new Error ('PopupManager: Missing PopupViewFactory.');
      }
    },

    // Attempt to hide the current popup.
    hidePopup(forceHide) {
      var currentView = this.currentPopupView();
      if (this.popupViews.length &&
        currentView.$el &&
        currentView.$el.is(':visible')) {
        currentView.hide(forceHide);
      }
    },

    // Boolean to indicate whether there exists any popup currently visible.
    isPopupVisible: function() {
      var popupEl =
        $('#globalModalContainer .modal:visible:not(#nutanixConfirmModal)');

      return popupEl.length > 0;
    },

    // Update count of popups open
    reduceOpenPopupCount: function() {
      this.popupViews.pop();
    }
  };
});
