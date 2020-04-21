//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// ModalMixin contains util functions for Modals.
//
define([

], function(

) {
  'use strict';

  const registeredPopups = {};

  /**
   * Check if the Instance is a Popup & with actionReferences
   * @private
   * @param {object} instance - Popup or Popup Subview Instance
   * @returns {boolean}
   */
  function _isValidPopup(instance) {
    return instance.$el.hasClass('modal') && !!instance.actionReferences;
  }

  /**
   * Get the Popup ID based on the Instance
   * (can be the Popup itself or any of its subviews)
   * @private
   * @param {object} instance - Popup or Popup Subview Instance
   * @returns {string|undefined} - If Popup or Popup Subview returns the
   * Popup Id otherwise returns undefined
   */
  function _getId(instance) {
    const el = instance.$el.closest('.modal')[0];
    return el && el.id;
  }

  /**
   * Get the Popup Instance based on its ID
   * @private
   * @param {string} id - Popup ID
   * @returns {string|undefined} - If Popup Instance registered returns the
   * Instance otherwise returns undefined
   */
  function _getModalInstance(id) {
    return registeredPopups[id];
  }

  return {

    // Functions
    //----------

    /**
     * Register the Popup to trigger its Actions
     * @public
     */
    registerPopup() {
      if(!_isValidPopup(this)) {
        return;
      }

      registeredPopups[_getId(this)] = this;
    },

    /**
     * Unregister the Popup
     * @public
     */
    unregisterPopup() {
      if(!_isValidPopup(this)) {
        return;
      }

      delete registeredPopups[_getId(this)];
    },

    /**
     * Trigger a Popup Action
     * @public
     * @param {string} action - Action Type (from AppConstants.MODAL.ACT)
     * @param {object} [data] - Options Object
     */
    triggerAction(action, data) {
      const id = _getId(this);
      const instance = _getModalInstance(id);

      if (!instance) {
        return;
      }

      instance[instance.actionReferences[action]](data);
    },

    /**
     * Triggers all the Popup Actions from an Array
     * @public
     * @param {array} actions - List of Actions
     *   Each action can be String, Array or Object
     */
    triggerActions(actions) {
      if (!(_.isArray(actions) && actions.length)) {
        return;
      }

      actions.forEach((action) => {
        if (_.isString(action)) {
          this.triggerAction(action);
        } else if (_.isArray(action)) {
          this.triggerAction(action[0], action[1]);
        } else if (_.isObject(action)) {
          this.triggerAction(action.action, action.data);
        }
      });
    }
  };
});
