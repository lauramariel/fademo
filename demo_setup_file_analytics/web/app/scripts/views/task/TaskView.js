//
// Copyright (c) 2013 Nutanix Inc. All rights reserved.
//
// TaskView is used for rendering the task buttons and drop downs in the
// header component.
//

define([
  // Core
  'views/base/BaseView',
  // Managers
  'managers/TaskManager',
  // Views
  'views/task/TaskItemView',
  // Utils
  'utils/AntiscrollUtil'],
function(
  // References of core
  BaseView,
  // References of Managers
  TaskManager,
  // References of Views
  TaskItemView,
  // Utils
  AntiscrollUtil) {

  'use strict';

  var tmplNoTaskActivity = _.template(
    '<li class="no-activity"><%= msg %><li>');

  // Extending the BaseView
  var TaskView = BaseView.extend({

    // Properties
    // Name for logging and transltion purposes
    name: 'TaskView',

    // Max height for the dropdown.
    MAX_TASK_DROPDOWN_HEIGHT: 300,

    // Functions
    //----------

    // @inherited
    // Constructor
    initialize: function(options) {
      _.bindAll(this, 'addTaskToView', 'removeTaskToView');
      this.render();
    },

    // Render method for view
    render: function() {
      this.taskCollection = TaskManager.getTaskCollection();
      var menuEl = this.$('.n-task-menu');

      this.taskCollection.on('add', this.addTaskToView);
      this.taskCollection.on('remove', this.removeTaskToView);

      // Create the drop down menu with the task messages
      _.each(this.taskCollection.models, (taskModel) => {
        this._renderTask(taskModel, menuEl);
      });

      if (this.taskCollection.models.length === 0) {
        menuEl.html(tmplNoTaskActivity({
          msg: 'No task activity'
        }));
      }
    },

    // Adds task to view when any task is added to task collection
    addTaskToView: function(taskModel) {
      this.$('.no-activity').remove();
      var menuEl = this.$('.n-task-menu');
      this._renderTask(taskModel, menuEl);
      this._applyAntiScroll();
    },

    // Remove task from view when all task are removed from task collection
    removeTaskToView: function(taskModel) {
      if (!this.taskCollection.length) {
        const emptyTemplate = '<li class="no-activity">No task activity</li>';
        let menuEl = this.$('.n-task-menu');
        menuEl.html(emptyTemplate);
      } else {
        $('#' + taskModel.id).remove();
      }
      this._applyAntiScroll();
    },

    // Render an individual task.
    // @param task - the task model to render
    // @param menuEl - the drop down menu element to attach the task to.
    _renderTask: function(task, menuEl) {
      var taskMenuItem = this.renderMenuItem(task);
      $(menuEl).append(taskMenuItem.$el);
    },

    // Render an individual task menu item.
    renderMenuItem: function(taskModel) {
      var taskItemView = new TaskItemView({
        model: taskModel
      });
      return taskItemView;
    },

    // Show task dropdown
    showDropdown: function() {
      var menuEl = this.$('.n-tasks-dropdown');
      menuEl.removeClass('hide');
      this._applyAntiScroll();
    },

    // Hide task dropdown.
    closeDropdown: function() {
      var menuEl = this.$('.n-tasks-dropdown');
      menuEl.addClass('hide');
    },

    _applyAntiScroll: function() {
      var antiscrollEl = this.$('.n-task-antiscroll');

      var widgetHeight = Math.min(
        this.MAX_TASK_DROPDOWN_HEIGHT,
        this.$('.n-task-menu')[0].scrollHeight);

      // There are issues with hover events in antiscroll when autoHide is
      // set to true and the user expands/collapses subtasks, hence we
      // are setting autoHide to false.
      AntiscrollUtil.applyAntiScroll(antiscrollEl, '404px', widgetHeight + 'px',
        { 'autoHide': false });
    }

  });
  return TaskView;
});
