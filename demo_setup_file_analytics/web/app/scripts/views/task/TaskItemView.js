//
// Copyright (c) 2013 Nutanix Inc. All rights reserved.
//
// TaskItemView is used for rendering individual task items in the task drop
// down menu.
//

define([
  // Core
  'views/base/BaseView',
  // Templates
  'text!templates/task/TaskItemView.html'],
function(
  // References of core
  BaseView,
  // Templates
  taskItemViewTemplate) {

  'use strict';

  var compiledTaskItemTemplate = _.template(taskItemViewTemplate);

  // Extending the BaseView
  var TaskItemView = BaseView.extend({

    // Properties
    // Name for logging and transltion purposes
    name: 'TaskItemView',

    tagName: 'li',

    // Task model
    model: null,

    // Functions
    //----------

    // @inherited
    // Constructor
    initialize: function(options) {
      _.bindAll(this, 'setPercentText', 'setErrorText', 'setMessageText');
      this.options = options;
      this.render();
    },

    // Renders a task item
    render: function() {
      var taskObj = {};
      taskObj.message = this.model.getMessage();
      taskObj.percent = this.model.getPercentage();
      taskObj.id = this.model.id;
      taskObj.cid = this.model.getId();
      taskObj.linkClass = this.model.getLinkClass();

      this.bindEvents();
      this.$el.html(compiledTaskItemTemplate(taskObj));
      this.$el.addClass('n-task-parent');
    },

    // Binds the model events to their handlers
    bindEvents: function() {
      this.model.on('change:percent', this.setPercentText);
      this.model.on('change:error', this.setErrorText);
      this.model.on('change:message', this.setMessageText);
    },

    // Sets the percent text
    setPercentText: function() {
      // Update percent only if we have to show it
      if (this.model.showPercentage()) {
        this.$('.n-task-menuitem .n-task-message .n-percent-text')
          .html(this.model.getPercentage() + '%');
      }
    },

    // Sets the error text when the task is failed
    setErrorText: function() {
      // Update percent only if we have to show it
      if (this.model.showPercentage()) {
        this.$('.n-task-menuitem .n-task-message .n-percent-text')
          .html(this.model.getError());
      }
      $('.n-header-tasks .btn-group .n-task-wrapper > div.radial')
        .addClass('error-bg');
    },

    // Sets the message text for model
    setMessageText: function() {
      this.$('.n-task-menuitem .n-task-message .msg_' + this.model.getId())
        .html(this.model.getMessage());
      this.$('.n-task-menuitem .n-task-message .msg_' + this.model.getId())
        .attr('title', this.model.getMessage());
    }

  });
  return TaskItemView;
});
