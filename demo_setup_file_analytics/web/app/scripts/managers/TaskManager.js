//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TaskManager handles all the task related actions
//
define([
  // Collections
  'collections/task/TaskCollection'],
function(
  // Collections
  TaskCollection) {

  'use strict';

  // TaskManager
  //-------------
  return {

    taskCollection: new TaskCollection(),

    addTaskToCollecton: function(taskModel) {
      this.taskCollection.add(taskModel);
    },

    getTaskCollection: function() {
      return this.taskCollection;
    },

    removeTaskCollecton: function(taskModel) {
      this.taskCollection.remove(taskModel);
      // Reset the header task progress circle to 0
      // if there are no task in the collection
      let taskCollection = this.taskCollection;
      if (taskCollection.length === 0) {
        var ring = $('.n-task-wrapper').find('.radial');
        ring.attr('class', 'radial percent0');
      }
    }
  };
});
