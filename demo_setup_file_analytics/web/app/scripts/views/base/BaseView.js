//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// BaseView is the base class of all the views.
//
define([
  // Cores
  'jquery',
  'underscore',
  'backbone',
  'fancySelect',
  'datepicker',
  // Views
  'views/base/DataTableTemplates',
  // Utils
  'utils/AppUtil',
  'utils/AjaxUtil'
], function(
  // Cores
  $,
  _,
  Backbone,
  fancySelect,
  datepicker,
  // Views
  DataTableTemplates,
  // Utils
  AppUtil,
  AjaxUtil
  ) {

  var BaseView = Backbone.View.extend({
    events: {},

    // Is a wudget entity?
    isWidget: false,

    // @NOTE: To be overridden by subclass
    // Set of callbacks in relation to the view's model/collection. Acts like
    // the events property of Backbone.View.
    modelEvents: null,

    // Cached regex to split keys for 'modelEvents'.
    _delegateModelEventSplitter: /^(\S+)\s*(.*)$/,

    // A map that contains functions that will be used for delegation and
    // undelegation. The main reason why we want to keep the reference of
    // functions for the modelEvents hash is because Backbone checks the
    // function reference.
    _delegatedFunctions: null,

    initialize: function(options) {
      this.initializeProperties();
    },

    initializeProperties: function() {
    },

    render: function(){
    },

    addExtraEvents: function(extraEvents) {
      if (!extraEvents) {
        throw new Error('extraEvents should not be empty.');
      }
      var newEvents = _.clone(this.events);
      _.extend(newEvents, extraEvents);
      this.events = newEvents;
    },

    destroy: function() {
      // Undelegate Events
      this.undelegateEvents();
    },

    remove: function() {
      // Undelegate Events
      this.undelegateEvents();
      this.$el.empty().off(); /* off to unbind the events */
      return this;
    },

    // Functions (Model Events)
    //-------------------------

    // NOTE: Do not override
    // Set callbacks, where 'this.modelEvents' is a hash of
    //
    // *{"event model": "callback"}*
    //
    //     {
    //       'reset   hostCollection'  : 'renderHosts',
    //       'change  diskModel'       : 'renderDiskDetails',
    //       'pending statsCollection' : function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view's model/collection, with
    // 'this' set properly. This is called when the view's service started.
    //
    // @param isUndelegateAll - Boolean flag to remove all callbacks. If you
    //        set this to true, this will unbound all callbacks including
    //        other views. Default is false.
    delegateModelEvents: function(isUndelegateAll) {
      if (!this.modelEvents) {
        return;
      }

      // Clear all event handlers first
      this.undelegateModelEvents(isUndelegateAll);

      // Add model events
      this._addRemoveModelEventHandlers(true, isUndelegateAll);
    },

    // NOTE: Do not override
    // Clears all callbacks previously bound to the view's model/collection.
    // This is called when the view gets hidden and the services stopped.
    // Makes sure that there are no dangling event handlers.
    //
    // @param isUndelegateAll - Boolean flag to remove all callbacks. If you
    //        set this to true, this will unbound all callbacks including
    //        other views. Default is false.
    undelegateModelEvents: function(isUndelegateAll) {
      // Remove the model events
      this._addRemoveModelEventHandlers(false, isUndelegateAll);
    },

    // NOTE: Do not override
    // Adds or removes the view's model/collection event handlers based on
    // the parameter, isAdd. It parses the 'modelEvents' hash to get the
    // (1) event, (2) model, (3) callback.
    //
    // @param isAdd - Boolean flag to know if to undelegate or delegate.
    // @param isUndelegateAll - Boolean flag to remove all callbacks. If you
    //        set this to true, this will unbound all callbacks including
    //        other views. Default is false.
    _addRemoveModelEventHandlers: function(isAdd, isUndelegateAll) {
      isAdd = isAdd || false;

      // Default is false
      if (typeof isUndelegateAll === 'undefined') {
        isUndelegateAll = false;
      }

      for (var key in this.modelEvents) {
        var method = this.modelEvents[key],
            methodName = _.isString(method) ? method : method.name;

        // Check if method exists
        if (!_.isFunction(method)) {
          method = this[this.modelEvents[key]];
        }
        if (!method) {
          throw new Error('Method "' + this.modelEvents[key] +
              '" does not exist');
        }

        // Check for the event and model
        var match = key.match(this._delegateModelEventSplitter),
            eventName = $.trim(match[1]),
            modelName = $.trim(match[2]);

        // Check if modelName exists
        if (!this[modelName]) {
          return;
        }

        // Check if the method is stored in the delegatedFunctions map.
        this._delegatedFunctions = this._delegatedFunctions || {};
        if (this._delegatedFunctions[methodName]) {
          method = this._delegatedFunctions[methodName];
        }
        else {
          // Make sure that the method is properly bound to this context and
          // stored in our delegatedFunctions map because _.bind creates a
          // new reference of the function. Backbone's off() and on()
          // function must have the same reference of the method.
          method = _.bind(method, this);
          this._delegatedFunctions[methodName] = method;
        }

        // How do we undelegate?
        if (isUndelegateAll) {
          // Make sure to remove all previously-bound callbacks.
          this[modelName].off(eventName);
        } else {
          // Only remove the previously-bound callback in this context.
          // This ensures that other views listening for the model's event
          // won't be removed.
          this[modelName].off(eventName, method, this);
        }

        if (isAdd) {
          // Add event handler if necessary
          this[modelName].on(eventName, method, this);
        }
      }
    },

    // Deletes all the data models based on the 'modelEvents' hash. It parses
    // the 'modelEvents' hash to get the model's name. Example:
    //     {
    //       'reset   hostCollection'  : 'renderHosts',
    //       'change  diskModel'       : 'renderDiskDetails',
    //       'pending statsCollection' : function(e) { ... }
    //     }
    // Then hostCollection, diskModel and statsCollection will be deleted.
    deleteModelsFromModelEventsHash: function() {
      for (var key in this.modelEvents) {
        // Check for the model's name
        var match = key.match(this._delegateModelEventSplitter),
            modelName = $.trim(match[2]);

        // Check if model exists
        if (this[modelName]) {
          this[modelName] = null;
        }
      }
    },

    // Returns the DOM(s) element of the specified class name within the
    // context of the view el
    getDOM: function(className) {
      return this.$el.find(className);
    },

    // Show the loading
    showLoading: function() {
      this.getDOM('.n-loading-wrapper').show();
    },

    // Hide the loading
    hideLoading: function() {
      this.getDOM('.n-loading-wrapper').hide();
      this.$el.parents('.n-vantage-point').find('.n-loading-wrapper').hide();
      // Enable dropdown option on the widget title
      this.$el.parents('.n-vantage-point').find('.dropdown > button')
        .removeClass('disabled');
    },

    // Show no data available.
    showNoDataAvailable: function() {
      if (this.$el.parents('.n-vantage-point').find('.noData').length) {
        this.$el.parents('.n-vantage-point').find('.noData').show();
      } else {
        this.$el.find('.noData').show();
      }
    },

    // Hide the error
    hideError: function() {
      this.getDOM('.n-error').hide();
    },

    onDataError: function(xhr) {
      this.$('.n-error').remove();
      // The loading element was blocking the other tabs.
      // Commenting as fix for ENG-240547
      // this.$('.n-loading-wrapper').hide();
      this.hideLoading();
      $('.btnPrevious').prop('disabled', true);
      $('.btnNext').prop('disabled', true);
      // Show the error message and details (remove the HTML tags)
      var errorDetails = '';
      // If there is a status code of 0 (meaning unable to connect to
      // server), there is no message so we have to provide our own.
      if (AppUtil.isConnectionError(xhr)) {
        errorDetails = 'Unable to connect to the server.';
        $('#n-header *').prop('disabled', false);
      } else if (AppUtil.isHttp404Error(xhr)) {
        errorDetails = 'Requested resource not available';
      } else {
        errorDetails = (
            AjaxUtil.processAjaxError(xhr.responseText) || '')
              .replace(/(<([^>]+)>)/ig, '');
      }
      let errorTempl = DataTableTemplates.ERROR({
        errorDetails :  errorDetails
      });

      // Render tooltip with error block defined above
      this.showErrorTooltip('bottom');

      const errorDiv = this.isWidget ?
        this.$el.parents('.n-content').find('.n-error') :
        this.getDOM('.n-error');

      // Remove the pre-existing error template.
      if (errorDiv.length) {
        errorDiv.remove();
      }

      if (this.isWidget) {
        // Hiding the following divs allows the title tag to be displayed.
        // Else as it overlaps the error div, the title tag is not shown.
        if (this.$el.parents('.n-content-column-customized').length) {
          this.$el.parents('.n-content-column-customized').hide();
          // If a widget is divided into vertical sections with
          // n-content-vertical-section-customized e.g. Operation Anomaly types
          // on anomaly page
        } else if (this.$el.parents('.n-content-vertical-section-customized')
          .length) {
          this.$el.parents('.n-content-vertical-section-customized').hide();
          // If a chart is rendered directly inside the widget under n-content
          // e.g. Storage summary on health dashboard
        } else if (this.$el.closest('.n-chart')
          .length) {
          this.$el.closest('.n-chart').hide();
          // If there are multiple containers under the el then find
          // n-content-column-container and hide e.g. Data summary view on health
          // dashboard
        } else if (this.$el.find('.n-content-column-container')
          .length) {
          this.$el.find('.n-content-column-container').hide();
          // If there are multiple containers under the el then find
          // n-content-column-customized and hide e.g. Overall health on health
          // dashboard
        } else if (this.$el.find('.n-content-column-customized').length) {
          this.$el.find('.n-content-column-customized').hide();
          // If there are multiple small containers under the el then find
          // n-vantage-point-metric-small and hide e.g. Host memory on health
          // dashboard
        } else if (this.$el.find('.n-vantage-point-metric-small').length) {
          this.$el.find('.n-vantage-point-metric-small').hide();
        }

        // If n-content is not a parent of el then append error template to el
        if (this.$el.parents('.n-content').length) {
          this.$el.parents('.n-content').append(errorTempl);
        } else {
          this.$el.append(errorTempl);
        }
      } else {
        this.$el.append(errorTempl);
      }
    },

    // Show error message on tooltip
    showErrorTooltip: function(placement) {
      // The block is not rendered when the tooltip is called so
      // to delay the execution of function we are adding timeout.
      setTimeout(function() {
        // Adding tooltip to the error.
        this.$('.n-error-details')
          .tooltip('destroy')
          .tooltip({
            placement: placement,
            trigger: 'hover',
            html: false
          });
      }, 50);
    },

    // Functions (Styling Input Fields)
      //---------------------------------

      // This function accepts an optional object.  The default behavior of
      // this function (if no object is passed) is to style all input elements
      // in its scope. If an object is passed, it can be used to control which
      // elements are styled.  There are two ways to control which elements
      // are styled based on the object passed:
      //
      // 1. Style element types.  If the passed object contains "types" (an
      //    array), it's values (any combination of "radio", "checkbox",
      //    "switch", or "select") will determine which elements are styled by
      //    the plugin.
      //
      //    e.g. { types: ["radio", "select"] } would style all radio and
      //    select elements
      //
      // 2. Style elements based on jQuery selectors. If the passed object
      //    contains an element named after one of the expected input types
      //    ("radio", "checkbox", "switch", or "select"), that type of element
      //    will be styled, and the value of the attribute will be used as the
      //    selector.
      //
      //    e.g. { radio: 'input[type="radio"].vm-selected',
      //           checkbox: 'input[type="checkbox"].filter-option'}
      //    would style all radio buttons with the class "vm-selected" and all
      //    checkboxes with the class ".filter-option"
      //
      //  One last note: if you wish to not style an element, you can also just
      //  add the class "n-preserve-style" to the html element before this
      //  function is run.
      applyNutanixInput: function( inputTypes ) {

        // Default jQuery selectors
        var settings = $.extend({
            radio: 'input[type="radio"]:not(".n-preserve-style")',
            checkbox: 'input[type="checkbox"]:not(".n-preserve-style")',
            checkboxSwitch:
              'input[type="checkbox"].switch:not(".n-preserve-style")',
            select: 'select:not(".n-preserve-style")',
            svg: {"checkbox": true}
        }, inputTypes);

        // Default behavior of the plugin (no object was passed)
        if ( !inputTypes ) {
          // Radio buttons
          this.$( settings.radio )
            .nutanixInput({type:'radio', svg: settings.svg});
          // Checkboxes
          this.$( settings.checkbox )
            .nutanixInput({type:'checkbox', svg: settings.svg});
          // Switch-style checkboxes
          this.$( settings.checkboxSwitch )
            .nutanixInput({type:'switch', svg: settings.svg});
          // Select
          this.$( settings.select )
            .nutanixInput({type:'select', svg: settings.svg});
        }

        // The optional object was passed.
        else {
          // Each of the following 'if's checks first to see if the inputTypes
          // array exists and has a string element of the given value (radio,
          // checkbox, checkboxSwitch, or select).  If it doesn't, then it
          // checks to see if there is an element in the object of the given
          // type.  The reason for these two possibilities is explained above
          // the beginning of this function.

          // Style radio buttons
          if (
            ( inputTypes.types && inputTypes.types.indexOf('radio') + 1 ) ||
              inputTypes.radio
          ) {
            this.$( settings.radio + ':not(".n-preserve-style")' )
            .nutanixInput({type:'radio', svg: settings.svg});
          }

          // Style checkboxes
          if (
            ( inputTypes.types && inputTypes.types.indexOf('checkbox') + 1 ) ||
              inputTypes.checkbox
          ) {
            this.$( settings.checkbox + ':not(".n-preserve-style")' )
            .nutanixInput({type:'checkbox', svg: settings.svg});
          }

          // Style "switch-style" checkboxes
          if (
            ( inputTypes.types &&
              inputTypes.types.indexOf('checkboxSwitch') + 1 ) ||
              inputTypes.checkboxSwitch
          ) {
            this.$( settings.checkboxSwitch + ':not(".n-preserve-style")' )
            .nutanixInput({type:'switch', svg: settings.svg});
          }

          // Style select boxes
          if (
            ( inputTypes.types && inputTypes.types.indexOf('select') + 1 ) ||
              inputTypes.select
          ) {
            this.$( settings.select + ':not(".n-preserve-style")' )
            .nutanixInput({type:'select', svg: settings.svg});
          }
        }
      },

      // NOTE: To be overridden by subclass
      // Add an onResize function to the subclass if it needs to re-render
      // when the window is resized. The function is commented out here for
      // efficiency reason so onResize can be called when only present
      // in the view.
      onResize: function() {
      }
  });

  return BaseView;
});
