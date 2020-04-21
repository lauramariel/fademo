//
// Copyright (c) 2014 Nutanix Inc. All rights reserved.
//
// BaseSubView is a sub view within parent page. It has the core functions
// that will be used for accessing the parent page methods.
//
// jsHint options on the next line
/*global require: false, $: false, _: false, window: false, define: false */
//
define([
    // View
    'views/base/BaseView'
],
  function(
    // References of core
    BaseView) {

    'use strict';

    // BaseSubView
    // -----------

    var BaseSubView = BaseView.extend({

      // Properties
      //-----------

      // Instance of the parent view which is the container of this
      // sub view
      parentView : null,

      // Functions
      //-----------------

      // Set Parent Page instance.
      // The parent should have implemented the following methods:
      //   onClickLinkAction
      //   showError
      //   showSuccess
      //   showInfo
      //   clearHeader
      //   isModelInitialized
      // @param parentView - parent container
      setParentView: function(parentView) {
        this.parentView = parentView;
      },

      // Return the parent
      getParentView: function () {
        return this.parentView;
      },

      // Set view option
      // NOTE: can be overriden to handler specific view option
      setViewOption: function(viewOption) {
      },

      // Shows a success message
      // @param msg : message to be displayed
      showSuccess: function (msg) {
        this._showMessage(this.parentView.showSuccess, msg);
      },

      // Shows an error alert
      // @error
      showError: function (error) {
        this._showMessage(this.parentView.showError, error);
      },

      // Show the Model Error (Used mainly in the error callback)
      // @param model : model object
      // @param response : response object
      showModelError: function (model,response) {
        // this.showError(AppUtil.processAjaxError(response.responseText));
      },

      // Shows an info message
      showInfo: function (msg) {
        this._showMessage(this.parentView.showInfo, msg);
      },

      // Shows a error message
      // @param msg : message to be displayed
      showHeaderError: function (msg) {
        this._showMessage(this.parentView.showHeaderError, msg);
      },

      // Shows a warning message
      // @param msg : message to be displayed
      showHeaderWarning: function (msg) {
        this._showMessage(this.parentView.showHeaderWarning, msg);
      },

      // Shows a loading message
      // @param msg : message to be displayed
      showHeaderLoading: function (msg) {
        this._showMessage(this.parentView.showHeaderLoading, msg);
      },

      // Shows a saving message
      // @param msg : message to be displayed
      showHeaderSaving: function (msg) {
        this._showMessage(this.parentView.showHeaderSaving, msg);
      },

      // Generic function to show any message in popup header
      // @private
      // @param msgFunc : The function to show the message to be called
      // @param msg : The message to be shown
      _showMessage: function( msgFunc, msg ) {
        if (typeof msgFunc  === "function") {
          msgFunc.call(this.parentView, msg);
        } else {
          // AppUtil.log(msg);
        }
      },

      // Clears the header
      clearBaseHeader: function () {
        // If parent page defines the clearHeader function
        if (typeof this.parentView.clearHeader === "function") {
          this.parentView.clearHeader();
        }
      },

      // On click event handler
      // The link DOM element must
      // have at least the following attributes
      // (1) action            - the type of action to be made
      // (2) actionTarget      - the action's target
      // (3) actionTargetId    - the id of the action target
      // (4) actionTargetName  - target name
      // @param e - on click element
      onClickLinkAction : function (e) {
        if (typeof this.parentView.onClickLinkAction === "function") {
            this.parentView.onClickLinkAction(e);
        }else {
          // Show as unimplemented action error for debug
          this.showError("Unimplemented item click action.");
        }
      },

      // Hide this sub view
      hideView: function() {
        $(this.el).hide();
      },

      // Show this sub view
      showView: function() {
        // TODO: add animation
         $(this.el).show();
      },

      // Refresh this sub view
      // Sub view can override it
      refreshView: function(){
      },

      // Return true if this view is visible
      isViewVisible: function () {
        return this.$el.is(':visible');
      },

      // Return true if the models for the page have been initialized
      // @return true if models have been initialized
      isModelInitialized: function () {
        if (typeof this.parentView.isModelInitialized === "function") {
          return this.parentView.isModelInitialized();
        } else {
          // Default to false
          return false;
        }
      },

      // Save Data if required in the subview
      // @param callback : transition callback after the view data been saved
      saveViewData: function(callback) {
        // override in the subview class as required.
        callback();
      },

      // Function to validate form data.
      // @param inputArray : Array of input text fields
      validateForm: function(inputArray) {
        // Even if a single input field does not have a value
        // do not continue in the loop and throw an error
        for( var i=0; i<inputArray.length; i++) {
          if (($.trim($(inputArray[i]).val()).length === 0)) {
              return('Please fill required field');
          }
        }
        return '';
      }

    });

    // Returns the Sub View class
    return BaseSubView;
  }
);