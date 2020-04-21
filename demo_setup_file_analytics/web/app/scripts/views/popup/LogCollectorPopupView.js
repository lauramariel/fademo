//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// LogCollectorPopupView gives an option to collect and
// download the logs
//
define([
  // Core classes
  'views/base/BasePopupView',
  // Models
  'models/logcollector/LogCollectorModel',
  'models/task/TaskModel',
  //  Utils
  'utils/AppUtil',
  'utils/AppConstants',
  'utils/DataURLConstants',
  // Managers
  'managers/NotificationManager',
  'managers/TaskManager',
  // Components
  'components/Components',
  // Templates
  'text!templates/popup/logcollector/LogCollectorPopupView.html'],
function(
  // Core classes
  BasePopupView,
  // Models
  LogCollectorModel,
  TaskModel,
  // Utils
  AppUtil,
  AppConstants,
  DataURLConstants,
  // Managers
  NotificationManager,
  TaskManager,
  // Components
  Components,
  // Templates
  collectLogsTemplate) {

  'use strict';

  var collectLogsViewTemplate = _.template(collectLogsTemplate);

  return BasePopupView.extend({
    name: 'logCollectorPopupView',

    model: null,

    el: '#logCollectorPopupView',

    LOADING: '<div class="donut-loader-gray"></div>',

    // @override
    initialize: function(options) {
      // Add extra events
      this.addExtraEvents({
        'click  .collectLogs'  : 'triggerLogCollection'
      });

      BasePopupView.prototype.initialize.call(this, options);
    },

    // @override
    // Set up the template and title
    render: function() {
      // Pass additional attributes to the popup template
      const popupTemplate = collectLogsViewTemplate({
        Components: Components,
        btnText   : AppConstants.BUTTON_TEXT.BTN_DOWNLOAD
      });

      // Append default template to the el
      this.$el.html(this.defaultTemplate({
        title       : this.options.actionRoute.title,
        bodyContent : popupTemplate,
        footer      : false
      }));
    },

    // Functions (Event Handlers)
    //---------------------------

    // Trigger log collection and download the collected
    // logs
    triggerLogCollection: function() {
      const _this = this;
      let logCollectorModel = new LogCollectorModel();

      let taskModel = new TaskModel({
        id: 'n-task-log-collection-' + new Date().getTime(),
        message: 'Log collection started',
        percent: 0 });
      TaskManager.addTaskToCollecton(taskModel);

      // Show msg and disable button, so that user does not click again while
      // collection is going on
      this.showHeaderSuccess('Log collection started.');
      this.$('.collectLogs').attr('disabled', true);

      const options = {
        // to override the ajaxsetup
        beforeSend: function(jqXHR, settings) {
          return true;
        },
        type: 'GET',
        success : function(data, response) {
          _this.onSuccess(response, taskModel);
        },
        error: function(model, xhr) {
          _this.$('.collectLogs').removeAttr('disabled');
          _this.onError(xhr, taskModel);
        }
      };

      // We are overriding the default setup to pass only username
      // and ignore fileServerUuid that gets preset while sending a request.
      logCollectorModel.getURL({ username: AppUtil.getUserName() });
      logCollectorModel.fetch(options);
    },

    // Called when API successfully collects and download logs.
    onSuccess: function(response, taskModel) {
      this.hide();
      // Check if file name is returned
      if (response && response.file_name) {
        // Create download url
        const downloadUrl = DataURLConstants.DOWNLOAD_LOGS +
          '?user_name=admin&file_name=' + response.file_name;
        window.open(downloadUrl, '_blank');

        // Update task model
        taskModel.setMessage('Log collection complete.');
        taskModel.updateTaskStatus();
        AppUtil.successTaskLoader(taskModel.cid);
        NotificationManager.showClientNotification(AppConstants.NOTIFY_SUCCESS,
          'Log collection complete.');
      } else {
        // Enable download button and show error on failure
        this.$('.collectLogs').removeAttr('disabled');
        this.showHeaderError('Error in log collection.');

        // Update task model
        taskModel.setMessage('Log collection failed.');
        taskModel.setError('Failed');
        AppUtil.failedTaskLoader(taskModel.cid);
      }
    },

    onError: function(xhr, taskModel) {
      const errorMsg = AppUtil.getErrorMessage(xhr) ||
        'Error in log collection.';
      this.showHeaderError(errorMsg);

      // Update task model
      taskModel.setMessage('Log collection failed.');
      taskModel.setError('Failed');
      AppUtil.failedTaskLoader(taskModel.cid);
    }
  });
});
