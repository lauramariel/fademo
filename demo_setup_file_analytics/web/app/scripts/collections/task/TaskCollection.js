//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// TaskCollection is the collection class of the entity Task model
//
define([
  // Core
  'collections/base/BaseCollection',
  // Models
  'models/task/TaskModel'],
function(
  // Core
  BaseCollection,
  // Models
  TaskModel) {

  'use strict';

  var TaskCollection = BaseCollection.extend({

    // Name for logging purposes.
    name: 'TaskCollection',

    model: TaskModel
  });

  // Returns the TaskCollection class
  return TaskCollection;
});
