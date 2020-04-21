//
// Copyright (c) 2013 Nutanix Inc. All rights reserved.
//
// BaseWizardPage is the class that wizard pages should extend.
// It implements the interface that the wizard framework needs.
//
define([
  // Views/Models
  'views/base/BaseView'],
function(
  // Views/Models
  BaseView) {

  'use strict';

  return BaseView.extend({

    // Instance of the wizard view that this page is being redered within
    theWizard: null,

    // Set the wizard Instance
    setWizard: function(wizard) {
      this.theWizard = wizard;
    },

    // Get the wizard instance.
    getWizard: function() {
      return this.theWizard;
    },

    // Called to check if wizard page title can be a link to the page
    // itself, by default it's enabled if the page can be transitioned
    // to based on the direction
    // @param direction - Integer (> 0 for forward
    //                             < 0 for backward)
    // @return true/false
    canEnablePageLink: function(direction) {
      return this.canTransitionPage(direction);
    },

    // Called to check if a page can be transitioned out
    // @param direction - Integer (> 0 for forward) (< 0 for backward)
    // @return false
    canTransitionPage: function(direction) {
      return true;
    },

    // Called to get next/previous button label
    // @param direction - Integer (> 0 for forward) (< 0 for backward)
    // @return null if you want default labels, or page specific label
    getButtonLabel: function(direction) {
      return null;
    },

    // Called to get the Save button label
    // @return null if you want default label, or page specific label
    getSaveButtonLabel : function() {
      return null;
    },

    // Called to check if Cancel button is visible
    // @return true if if Cancel button is visible for the page
    showCancelButton : function() {
      return true;
    },

    // Called to check if can apply the changes
    // @return true if if changes can be applied to the page
    canApplyPageChanges : function() {
      return true;
    },

    // Transition a page
    // @param continuation - callback, after transition is complete
    onPageTransition: function(continuation) {
      // Sub pages to override
      continuation();
    },

    // This page was canceled, the page can update its state.
    // @return true, to continue, false to stay on the page
    // TODO  this function should be renamed to something like doPageCancel()
    onPageCancel: function() {
      // Sub pages to override if necessary
      return true;
    },

    // NOTE: To be overridden by subclass
    // Wizard page subclasses can override this to show a confirm dialog.
    confirmHide: function(returnHandler) {
      returnHandler();
    },

    // Shows an error alert on the wizard header
    // @param error - error message
    showError: function(error) {
      this.getWizard().showHeaderError(error);
    },

    // Shows a warning on the wizard header
    // @param warningMsg - warningMsg message
    showWarning: function(warningMsg) {
      this.getWizard().showHeaderWarning(warningMsg);
    },

    // Shows a warning on the wizard header
    // need to use same function name in both popup and wizard page.
    // @param warningMsg - warningMsg message
    showHeaderWarning: function(warningMsg) {
      this.getWizard().showHeaderWarning(warningMsg);
    },

    // Show Error
    // @param error - error message
    // @param details - details of the error
    showHeaderErrorWithDetails: function(error, details) {
      this.getWizard().showHeaderErrorWithDetails(error, details);
    },

    // Clear wizard header
    clearHeader: function() {
      this.getWizard().clearHeader();
    },

    // Shows an info alert on the wizard header
    // @param info - info message
    showInfo: function(msg) {
      this.getWizard().showHeaderInfo(msg);
    },

    // Shows an success alert on the wizard header
    // @param msg - success message
    showSuccess: function(msg) {
      this.getWizard().showHeaderSuccess(msg);
    },

    // @override
    // Override to handle resize
    // @param postResizeCallback - callback when resize is done (optional)
    onResize: function(postResizeCallback) {
      // Resize the wizard container
      this.getWizard().onResizeWizardContainer(null, postResizeCallback);
    },

    // @override
    // Override to scroll to the bottom of the wizard page container
    scrollToBottom: function() {
      this.getWizard().scrollToBottom();
    },

    // @override
    // Override to scroll to element within wizard container
    // @param elem - element to scroll to
    scrollToElement: function(elem) {
      // Let the wizard handles
      this.getWizard().scrollToElement(elem);
    },

    // Disable save button.
    disableSaveButton: function() {
      this.getWizard().disableSaveButton();
    },

    // Enable next button.
    enableNextButton: function() {
      this.getWizard().enableNextButton();
    },

    // Disable next button.
    disableNextButton: function() {
      this.getWizard().disableNextButton();
    },

    // Enable save button.
    enableSaveButton: function() {
      this.getWizard().enableSaveButton();
    },

    // Disable cancel button.
    disableCancelButton: function() {
      this.getWizard().disableCancelButton();
    },

    // Enable cancel button.
    enableCancelButton: function() {
      this.getWizard().enableCancelButton();
    },

    // Disable previous button.
    disablePreviousButton: function() {
      this.getWizard().disablePreviousButton();
    },

    // Enable previous button.
    enablePreviousButton: function() {
      this.getWizard().enablePreviousButton();
    }
  });
});
