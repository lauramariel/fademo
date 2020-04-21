//
// Copyright (c) 2013 Nutanix Inc. All rights reserved.
//
// TaskModel is the model class of a task.
//
//
define([
  // Core
  'models/base/BaseModel',
  'data/DataProperties',
  // Utils
  'utils/AppConstants'],
function(
  // References of core
  BaseModel,
  DataProp,
  // References of Utils
  AppConstants) {

  'use strict';

  var TaskModel = BaseModel.extend({

    // Name for logging purposes.
    name: 'TaskModel',

    // Functions
    //----------

    // Return percentage
    getPercentage: function() {
      return this.get(DataProp.TASK_PERCENT);
    },

    // Sets the percentage of the task and clears existing error
    // in model to show appropriate progress in header
    setPercentage: function(percentValue, clearError = false) {
      this.set({ percent: percentValue });
      this.updateTaskStatus(false, clearError);
    },

    // Return if we need to show the percent value in the Task Manager
    // By default it is true
    showPercentage: function() {
      return (typeof this.get(DataProp.TASK_PERCENT_SHOW) === 'undefined') ?
        true : this.get(DataProp.TASK_PERCENT_SHOW);
    },

    // Returns the task message
    getMessage: function() {
      return this.get(DataProp.TASK_MESSAGE);
    },

    // Sets the task message
    setMessage: function(messageText) {
      this.set({ message: messageText });
    },

    // Returns the id of the task model
    getId: function() {
      return this.cid;
    },

    // Sets the error message for the task
    setError: function(errorText) {
      this.set({ error: errorText });
      this.updateTaskStatus(true);
    },

    // Gets the error message for the task
    getError: function(errorText) {
      return this.get(DataProp.TASK_ERROR);
    },

    // get link class for opening other pages
    getLinkClass: function() {
      return this.get('linkClass') || null;
    },

    // Update header progress bar as per the current and accomplished tasks
    // Show error at completion if any of the tasks in collection has failed
    updateTaskStatus: function(hasError = false, clearError = false) {
      let classProgress = 'percent0';
      var ring = $('.n-task-wrapper').find('.radial');
      if (hasError) {
        classProgress = 'percent100 ' + AppConstants.TASK_ERROR;
      } else if (this.attributes.percent < 100) {
        classProgress = 'percent' + this.attributes.percent;
      } else {
        if (clearError) {
          // Delete error attribute of the model since task has completed
          // successfully
          delete this.attributes.error;
        }
        let taskCollection = this.collection;
        let taskWithError = taskCollection.find(function(model) {
          return model.has('error');
        });
        // Show success ring
        classProgress = 'percent' + this.attributes.percent +
          ' ' + AppConstants.TASK_SUCCESS;
        // Show error ring if any model in collection has error
        if (taskWithError) {
          classProgress = 'percent' + this.attributes.percent +
            ' ' + AppConstants.TASK_ERROR;
        }
      }
      ring.attr('class', 'radial ' + classProgress);
    }
  });

  // Returns the TaskModel class
  return TaskModel;
}
);
