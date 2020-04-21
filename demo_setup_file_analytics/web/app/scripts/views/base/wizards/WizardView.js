//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// WizardView is the view that manages a wizard interaction in the UI
//
define([
  // Views/Models
  'views/base/BasePopupView',
  // Utils
  'utils/SubViewHelper',
  'utils/AppConstants',
  'utils/SVG',
  // The template
  'text!templates/base/wizards/WizardView.html'],
function(
  // Views/Models
  BasePopupView,
  // References of util
  SubViewHelper,
  AppConstants,
  SVG,
  // The template
  wizardTemplate) {

  'use strict';

  // Constants
  // ---------

  // Wizard types
  var WIZARD_TYPES = {
    LINEAR: 'linear',
    ADHOC : 'adhoc'
  };

  // The wizard content template.
  var wizardContentTemplate = '<div data-ntnx-content-inner>' +
    '<div class="wizard-page-container"></div></div>';

  // Extending the BasePopupView
  return BasePopupView.extend({

    el: '#wizardPopup',

    // Forward to next page
    NEXT_PAGE : 1,
    // Backward to previous page
    PREVIOUS_PAGE : -1,

    // Instance variables
    wizardConfiguration:     null,
    subViewHelper:           null,
    currentPageIdx:          null,
    title:                   null,

    // Precompiled template
    template        : _.template(wizardTemplate),
    contentTemplate : _.template(wizardContentTemplate),


    // Events on the container.
    // Page events are handled by individual  page views
    events: {
      // Wizard events
      'click  .modal-header .close': 'hide',
      'keypress input'             : 'onKeyPress',
      'click .btnCancel'           : 'onCancel',
      'click .bttnPrevious'         : 'onPrevious',
      'click .bttnNext'             : 'onNext',
      'click .btnSave'             : 'onSave',
      'click .next-page'           : 'onNext',
      'click .previous-page'       : 'onPrevious',
      'click .go-to-page'          : 'onGoToPage',
      'click .close_alert'         : 'clearHeader'
    },

    // Event handler,
    onCancel: function() {
      if (this.subViewHelper.get(this._getCurrentPageId()).onPageCancel()) {
        this.onCancelClicked = true;
        this.hide();
      }
    },

    // Event handler - previous button
    // Note: when going back, we don't save the current page to the
    // backend
    onPrevious: function(e) {
      var elem = $(e.currentTarget);
      // transition to previous tabs unless the button is meant to trigger a
      // transition within the same tab, indicated by class 'btnBack'
      if (elem.hasClass('btnBack') &&
        typeof this.subViewHelper.get(
          this._getCurrentPageId()).onPageBack === 'function') {
        this.subViewHelper.get(this._getCurrentPageId()).onPageBack();
      } else if (this.currentPageIdx > 0) {
        // for page view with notifyOnPrevious set to true,
        // notify it with onPageTransition(continuation, true)
        // we limit the notification to the notifyOnPrevious flag
        // to avoid potential regression on other wizard pages
        const currentPage = this.subViewHelper.get(this._getCurrentPageId());
        if (currentPage && currentPage.notifyOnPrevious) {
          this._gotoPage(this.currentPageIdx - 1, true);
        } else {
          this._renderPage(this.currentPageIdx - 1);
        }
      }
    },

    // Event handler -- next button
    onNext: function(e) {
      var elem = $(e.currentTarget);
      var nbPages = this.wizardConfiguration.pages.length;
      if (elem.hasClass('btnApply')) {
        this._onApply();
      } else if (this.currentPageIdx < (nbPages - 1)) {
        this._gotoPage(this.currentPageIdx + 1);
      }
    },

    // Event handler - go to page
    onGoToPage: function(e) {
      var pageIdIdx = $(e.currentTarget).data('index');
      // Render the page only
      this._renderPage(pageIdIdx);
    },

    // Event handler - save button -- last page.
    onSave: function() {
      var _this = this;
      this.subViewHelper.get(this._getCurrentPageId()).onPageTransition(
        function() { _this.hide(); });
    },

    // @private
    // Subclasses should call this to initialize the wizard
    // @param options.wizardType -- the type of wizard
    initializeWizard: function(wizardConfiguration) {
      this.wizardConfiguration = wizardConfiguration;
      let errorMessage = 'Error: Register at least two pages for a wizard.';

      // Commented only as temperory fix for uncomment it once done
      // ENG-186961 | View Permission need to be removed from UI for now
      // if (!this.wizardConfiguration.pages ||
      //     this.wizardConfiguration.pages.length < 2) {
      //   throw errorMessage;
      // }

      this.subViewHelper = new SubViewHelper();
      this.currentPageIdx = 0;

      _.bindAll(this, 'onResize', 'onResizeWizardContainer');
    },

    // @private
    // Add a page view.
    // @param page - subclass of BaseWizardPage
    // @param PageClass -- this
    addPageView: function(pageId, PageClass, model, actionTargetName,
      actionTargetId, actionTargetType) {
      // Now add a hidden div for this page.
      var pageDiv = $('<div id="' + pageId + '" ' +
        'class="wizard-page"></div>');
      pageDiv.appendTo(this.$('.wizard-page-container'));
      var pageView = new PageClass({
        el: '#' + pageId,
        model: model,
        actionTargetName: actionTargetName,
        actionTargetId: actionTargetId,
        actionTargetType: actionTargetType
      });
      pageView.setWizard(this);
      this.subViewHelper.register(pageId, pageView);
    },

    // @private
    // Set the next/prev button states.
    _setButtonStates: function(pageView) {
      var pages = this.wizardConfiguration.pages;
      var nbPages = pages.length;

      // Labels for the next/previous buttons.
      var prevButtonLabel = this._getDefaultPreviousButtonLabel();
      var nextButtonLabel = this._getDefaultNextButtonLabel();
      if (typeof pageView.getButtonLabel === 'function') {
        prevButtonLabel = pageView.getButtonLabel(this.PREVIOUS_PAGE) ||
          prevButtonLabel;
        nextButtonLabel = pageView.getButtonLabel(this.NEXT_PAGE) ||
          nextButtonLabel;
      }
      this.$('.bttnPrevious').html(prevButtonLabel);
      this.$('.bttnNext').html(nextButtonLabel);

      if (this.wizardConfiguration.wizardType !== WIZARD_TYPES.ADHOC) {
        // Clear previous wizard page link
        var previousPage = this.$('.previous-page');
        if (previousPage) {
          previousPage.removeClass('previous-page');
        }

        // Clear next wizard page link
        var nextPage = this.$('.next-page');
        if (nextPage) {
          nextPage.removeClass('next-page');
        }
      }

      var canChangePageBack = true;
      var canChangePageForward = true;
      if (typeof pageView.canTransitionPage === 'function') {
        canChangePageBack = pageView.canTransitionPage(this.PREVIOUS_PAGE);
        canChangePageForward = pageView.canTransitionPage(this.NEXT_PAGE);
      }

      if ((this.currentPageIdx > 0) && canChangePageBack) {
        this.showPreviousButton();

        var previousPageClassName = 'previous-page';
        if (this.wizardConfiguration.wizardType === WIZARD_TYPES.ADHOC) {
          previousPageClassName = 'go-to-page';
        }
        // Enable previous wizard page link
        if (pageView.canEnablePageLink(this.PREVIOUS_PAGE)) {
          var previousPageId = this.wizardConfiguration.pages
            [this.currentPageIdx - 1].id;
          this.$('#title-' + previousPageId).addClass(previousPageClassName);
        }
      } else {
        this.hidePreviousButton();
      }

      if ((this.currentPageIdx < (nbPages - 1)) && canChangePageForward) {
        this.$('.bttnNext').removeClass('disabled');
        this.$('.bttnNext').show();

        var nextPageClassName = 'next-page';
        if (this.wizardConfiguration.wizardType === WIZARD_TYPES.ADHOC) {
          nextPageClassName = 'go-to-page';
          this._showSaveButton(pageView);
        } else {
          this.$('.btnSave').hide();
        }
        // Enable next wizard page link
        if (pageView.canEnablePageLink(this.NEXT_PAGE)) {
          var nextPageId = this.wizardConfiguration.pages
            [this.currentPageIdx + 1].id;
          this.$('#title-' + nextPageId).addClass(nextPageClassName);
        }
      } else {
        if (this.wizardConfiguration.wizardType !== WIZARD_TYPES.ADHOC ||
            !canChangePageForward) {
          this.$('.bttnNext').addClass('disabled');
          this.$('.bttnNext').hide();
        }

        this._showSaveButton(pageView);
      }

      if (typeof pageView.showCancelButton === 'function') {
        if (pageView.showCancelButton()) {
          this.$('.btnCancel').show();
        } else {
          this.$('.btnCancel').hide();
        }
      }

      if (typeof pageView.hideSaveButton === 'function') {
        if (pageView.hideSaveButton()) {
          this.$('.btnSave').hide();
        }
      }

      if (typeof pageView.hidePreviousButton === 'function') {
        if (pageView.hidePreviousButton()) {
          this.hidePreviousButton();
        }
      }

      if (this.wizardConfiguration.wizardType === WIZARD_TYPES.ADHOC) {
        this._setAdHocPageLink(canChangePageBack, canChangePageForward);

        var canApplyPageChanges = true;
        if (typeof pageView.canApplyPageChanges === 'function') {
          canApplyPageChanges = pageView.canApplyPageChanges();
        }
        if (!canApplyPageChanges) {
          this.$('.bttnNext').addClass('disabled');
        }
      }
    },

    // @private
    // Enable page link for for AD HOC wizard pages
    // @param canChangePageBack - true to enable page back
    // @param canChangePageForward - true to enable page forward
    _setAdHocPageLink: function(canChangePageBack, canChangePageForward) {
      _.each(this.wizardConfiguration.pages, function(pageInfo, index) {
        if ((index < this.currentPageIdx && canChangePageBack) ||
            (index > this.currentPageIdx && canChangePageForward)) {
          this.$('#title-' + pageInfo.id).addClass('go-to-page');
        } else {
          // Disable page link
          this.$('#title-' + pageInfo.id).removeClass('go-to-page');
        }
      }, this);
    },

    // @private
    // Returns the default button label for previous button
    _getDefaultPreviousButtonLabel: function() {
      if (this.wizardConfiguration.wizardType === WIZARD_TYPES.ADHOC) {
        return '< Back';
      } else {
        return 'Previous';
      }
    },

    // @private
    // Returns the default button label for next button
    _getDefaultNextButtonLabel: function() {
      if (this.wizardConfiguration.wizardType === WIZARD_TYPES.ADHOC) {
        return 'Apply';
      } else {
        return 'Next';
      }
    },

    // @private
    // Returns the default button label for the save button
    _showSaveButton: function(pageView) {
      var saveButtonLabel = 'Save';
      // Show the custom save button
      if (typeof pageView.getSaveButtonLabel === 'function') {
        saveButtonLabel = pageView.getSaveButtonLabel() || saveButtonLabel;
        this.$('.btnSave').html(saveButtonLabel);
      }
      this.$('.btnSave').show();
    },

    // @private
    // Get the id for the current wizard page
    _getCurrentPageId: function() {
      return this.wizardConfiguration.pages[this.currentPageIdx].id;
    },

    // @private
    // Render the current wizard page.
    // When we go next/previous, we only want to update the page area, not
    // the entire wizard.
    _gotoPage(pageIdx, arg) {
      var _this = this;
      this.subViewHelper.get(this._getCurrentPageId()).onPageTransition(
        function() { _this._renderPage(pageIdx); }, arg);
    },

    // @private
    // Render the page at the given page index
    // Should not be called directly. Call _gotoPage, which allows the
    // current page to be persisted.
    _renderPage:  function(pageIdx) {
      var currentPageId = this._getCurrentPageId();
      // TODO: remove this check once all the pages within the individual
      // wizard has converted to use the latest popup styling.
      if (this.cleanedPopup) {
        this.$el.find('.tab').closest('li').removeClass('active');
      } else {
        this.$('#title-' + currentPageId).removeClass('current-page');
      }
      this.$('#' + currentPageId).hide();

      // Clear previous errors
      this.clearHeader();
      this.clearCurrentPageTitleError();

      // Render and show new page
      this.currentPageIdx = pageIdx;
      var newPageId = this._getCurrentPageId();
      var pageView = this.subViewHelper.get(newPageId);
      pageView.render();

      // TodoAfterPopupCleanup : remove the condition
      if (this.cleanedPopup) {
        this.$(`.tab-${pageIdx}`).closest('li').addClass('active');
      } else {
        this.$('#title-' + newPageId).addClass('current-page');
      }
      this.$('#' + newPageId).show();

      // Set button states
      this._setButtonStates(pageView);

      this.reSizePopup();
    },

    // Resize and rebuild the scroll bar
    reSizePopup() {
      this.triggerAction(AppConstants.MODAL.ACT.AS_REBUILD);
    },

    // Apply the changes to the current page
    _onApply: function() {
      // Apply the changes without transition to next page
      this.subViewHelper.get(this._getCurrentPageId()).onPageTransition(
        function() {});
    },

    // Append to the current title of wizard view.
    setCurrentPageTitleError: function() {
      var svg = SVG.SVGIcon('Exclamation_Mark');
      var currentPageId = this._getCurrentPageId();
      this.$('.custom-title[page-id=' + currentPageId + ']').html(svg);
      this.$('#title-' + currentPageId + ' .custom-title').addClass(
        'error-icon');
    },

    // Disable save button.
    disableSaveButton: function() {
      this.$('.btnSave').prop('disabled', true);
    },

    // Enable save button.
    enableSaveButton: function() {
      this.$('.btnSave').prop('disabled', false);
    },

    // Disable next button.
    disableNextButton: function() {
      this.$('.bttnNext').prop('disabled', true);
    },

    // Enable next button.
    enableNextButton: function() {
      this.$('.bttnNext').prop('disabled', false);
    },

    // Disable cancel button.
    disableCancelButton: function() {
      this.$('.btnCancel').prop('disabled', true);
    },

    // Enable cancel button.
    enableCancelButton: function() {
      this.$('.btnCancel').prop('disabled', false);
    },

    // Disable previous button.
    disablePreviousButton: function() {
      this.$('.bttnPrevious').prop('disabled', true);
    },

    // Enable previous button.
    enablePreviousButton: function() {
      this.$('.bttnPrevious').prop('disabled', false);
    },

    // Clear the current title of wizard view
    clearCurrentPageTitleError: function() {
      var currentPageId = this._getCurrentPageId();
      this.$('.custom-title[page-id=' + currentPageId + ']').html('');
      this.$('#title-' + currentPageId + ' .custom-title').removeClass(
        'error-icon');
    },

    // Set button states for the current page
    setButtonStates : function() {
      var newPageId = this._getCurrentPageId();
      var pageView = this.subViewHelper.get(newPageId);

      // Set button states
      this._setButtonStates(pageView);
    },

    // @override
    initialize(options) {
      BasePopupView.prototype.initialize.apply(this, arguments);
      this.$el.addClass('wizard-view');
    },

    // @override
    // Render the wizard in  a popup
    render: function() {
      // TodoAfterPopupCleanup : remove the condition
      if (this.cleanedPopup) {
        var footerButtons = [
          {
            text: this.i18n('previous'),
            extraClasses: 'bttnPrevious',
            leftAligned: true
          },
          {
            text: this.i18n('cancel'),
            extraClasses: 'btnCancel'
          },
          {
            text: this.i18n('next'),
            isPrimary: true,
            extraClasses: 'bttnNext'
          },
          {
            text: this.i18n('save'),
            isPrimary: true,
            extraClasses: 'btnSave'
          }
        ];

        // Render current page
        this.$el.html(this.defaultTemplate({
          title: this.wizardConfiguration.title,
          nestedAlert: true,
          tabs: true,
          tabsList: this.defaultTabs(
            this.convertConfigToTabs(this.wizardConfiguration)),
          bodyContent: this.contentTemplate(
            { wizardConfiguration: this.wizardConfiguration }),
          footerButtons: this.defaultFooter(footerButtons)
        }));
      } else {
        // Render the container.
        this.$el.html(this.template(
          { wizardConfiguration: this.wizardConfiguration }));
      }

      if (this.wizardConfiguration.wizardType === WIZARD_TYPES.ADHOC) {
        // Add 'btnApply' for AD HOC wizard page
        this.$('.bttnNext').addClass('btnApply');
      }

      // Ensure pages are created.
      _.each(this.wizardConfiguration.pages, function(pageInfo) {
        if (!this.subViewHelper.get(pageInfo.id)) {
          this.addPageView(pageInfo.id, pageInfo.klass, pageInfo.model,
            pageInfo.actionTargetName, pageInfo.actionTargetId,
            pageInfo.actionTargetType);
        }
      }, this);

      if (this.wizardConfiguration.type === 'permission') {
        this.currentPageIdx = 1;
      }

      // Render current page
      this._renderPage(this.currentPageIdx);
    },

    // Convert the wizardConfiguration to format that BasePopupView can use
    // to create nav-tabs
    convertConfigToTabs(wizardConfiguration) {
      let tabs = [];
      _.each(wizardConfiguration.pages, (page, i) => {
        tabs.push(
          {
            isActive: (i === 0),
            extraClasses: 'wizardTab tab-' + i,
            text: page.title
          }
        );
      });
      return tabs;
    },

    // @override
    // Override to register resize handler
    show: function(actionRoute) {
      BasePopupView.prototype.show.apply(this, arguments);

      // Handle the resize event to adjust the wizard page container.
      $(window).on('resize.app', this.onResize);

      // Handle the show alert event to adjust the wizard page container
      this.$('.n-modal-alert-header').on(this.SHOW_ALERT,
        this.onResizeWizardContainer);
    },

    // Function called after popup has been hidden
    // Wizard's aren't reused -- they are destroyed on hide.
    // @override
    hide: function() {
      // Call the super.
      if (BasePopupView.prototype.hide.apply(this, arguments)) {
        this.subViewHelper.removeAll();

        // Remove the 'resize.app' event and show alert event handler
        $(window).off('resize.app', this.onResize);
        this.$('.n-modal-alert-header').off(this.SHOW_ALERT,
          this.onResizeWizardContainer);
      }
    },

    // @override
    // Override to let the current page decide if confirmation is required
    // when hiding the wizard.
    confirmHide: function(returnHandler) {
      if (this.onCancelClicked) {
        // Reset
        this.onCancelClicked = false;
        returnHandler();
      } else {
        // SubViewHelper contains BaseWizardPage based views.
        var currentPage = this.subViewHelper ?
          this.subViewHelper.get(this._getCurrentPageId()) : null;
        if (currentPage) {
          currentPage.confirmHide(returnHandler);
        } else {
          returnHandler();
        }
      }
    },

    // hide Previous button
    hidePreviousButton() {
      this.$('.bttnPrevious').hide();
    },

    // show Previous button
    showPreviousButton() {
      this.$('.bttnPrevious').show();
    },

    // @override
    // Override to handle license-warning
    clearHeader: function() {
      if (!this.$('.n-license-warning').is(':visible')) {
        BasePopupView.prototype.clearHeader.apply(this, arguments);
      }
    },

    // Check the prerequisites for the editing entity to function properly,
    // prerequisite such as required configuration or licenses.
    // Sub class can override this to show any required configuration or
    // licenses warning
    // @param options - prerequisite(s) to check for this view
    checkPrerequisites: function(options) {
      // Override to add view specific check
    },

    // Event Handler -- Window resize
    onResize: _.throttle(function() {
      this.resizePageContainer();
    }, 100),

    // Resize to set the max-height for the page container if need.
    // @param postCallback - callback when resize is done (optional)
    // TODO: Clean up the function as it is just calling the callback
    resizePageContainer: function(postCallback) {
      if ($('#wizardPopup').length === 0) {
        // No resize needed, popup is already closed.
        // Need this check because resize is in throttle
        return;
      }

      // Call post resize callback if the callback is defined
      if (postCallback) {
        postCallback();
      }
    },

    // Resize the wizard container when any wizard page content changes
    // @param event        - event trigger this resize (optional)
    // @param postCallback - post resize callback (optional)
    onResizeWizardContainer : function(event, postCallback) {
      var _this = this;
      // Resize to accommodate any page content changes such as showing
      // alert header or page content loaded.
      // Allow slight delay for the page content to render
      setTimeout(function() {
        // Resize the page container max height
        _this.resizePageContainer(postCallback);
      }, 300);
    },

    // @override
    // Override to scroll to the bottom of the wizard page container
    scrollToBottom: function() {
      var p = this.$('.wizard-page-container');
      $(p).animate({
        scrollTop: $(p).prop('scrollHeight') - $(p).height()
      }, 0, 'fast');
    },

    // @override
    // Override to scroll to element within wizard page container
    // @param element - element to scroll to (optional)
    scrollToElement: function(element) {
      var p = this.$('.wizard-page-container');
      // If element is undefined, scroll to bottom of page
      var newScrollTop = element ? $(element).prop('offsetTop')
        : $(p).prop('scrollHeight') - $(p).height();

      $(p).animate({ scrollTop: newScrollTop }, 'fast');
    }
  },
  {
    WIZARD_TYPES:  WIZARD_TYPES
  });
});
