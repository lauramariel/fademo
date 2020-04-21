//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FileAnalyticsEnableUtil contains common utility functions for file analytics
// enable
//
define([
  // Managers
  'managers/NamespaceManager',
  // Utils
  'utils/AppUtil',
  'utils/AppConstants',
  // Components
  'components/Components',
  // Models/Collections
  'collections/fileservers/FileServerMetaDataCollection',
  'models/task/TaskModel',
  'models/analytics/FileAnalyticsVMUpdateModel',
  'models/health/HealthModel',
  // Managers
  'managers/TaskManager',
  'managers/NotificationManager'],
function(
  // Managers
  NamespaceManager,
  // References of utils
  AppUtil,
  AppConstants,
  Components,
  // Models/Collections
  FileServerMetaDataCollection,
  TaskModel,
  FileAnalyticsVMUpdateModel,
  HealthModel,
  // Managers
  TaskManager,
  NotificationManager) {

  'use strict';

  var FileAnalyticsEnableUtil = {

    // For logging
    name: 'FileAnalyticsEnableUtil',

    // Repeated meta data scan list
    repeatMetaDataFetch: {},

    // Return data retention options list
    getDataRetentionOptionList: function() {
      const fsId = AppUtil.getParameterByName('fs_id');
      let optionList = [],
          defaultValue = AppUtil.getDataRetentionPeriod(fsId) ||
        AppConstants.YEAR_TO_MONTH,
          value = '';
      _.each(AppConstants.RETENTION_DURATION_LIST, function(title, key) {
        value = AppConstants.RETENTION_DURATION_VALUES[key];
        optionList.push({
          name: title,
          value: value,
          selected: (defaultValue === value)
        });
      });

      return optionList;
    },

    // Return username template for AD
    getUserNameTemplate: function(model, selectedValue) {
      const userNameOptions = this.getUserList(model, selectedValue);
      let userTempl = Components.select({
        jsClasses: 'userNameOptions',
        options: userNameOptions,
        useBrowserSelect: true,
        attributes: "data-error-label='Username'"
      });

      return userTempl;
    },

    // Return list of admin users
    getUserList: function(model, selectedValue) {
      const userList = model.getAdminUsers();
      let optionList = [];
      if (userList.length) {
        _.each(userList, function(title) {
          optionList.push({
            name: title,
            value: title,
            selected: (selectedValue ? (selectedValue === title) : '')
          });
        });
      } else {
        optionList.push({
          name: AppConstants.NO_USER,
          value: ''
        });
      }
      return optionList;
    },

    // Validate if not one of bindDn/bindPassword is entered
    validateLdapForm: function(el) {
      const bindDn = el.find('#bindDN').val();
      const bindDnPassword = el.find('#bindPassword').val();
      let isValid = true;

      // Both bindDn and bindPassword should be entered
      if ((!bindDn && bindDnPassword) || (bindDn && !bindDnPassword)) {
        isValid = false;
      }

      return isValid;
    },

    // Get file server meta data collection status
    // and add task for polling after certain interval
    getMetaDataStatus: function(options) {
      const scanStatus = NamespaceManager.get('full_status_' + options.fsId);
      if (scanStatus !== AppConstants.METADATA_STATUS.COMPLETED &&
        (!this.repeatMetaDataFetch || (this.repeatMetaDataFetch &&
          !this.repeatMetaDataFetch[options.fsId]))) {
        // Schedule polling only if status is not completed and
        // its already not been scheduled
        this.scheduleTaskPolling(options);
      } else if (scanStatus === AppConstants.METADATA_STATUS.COMPLETED) {
        // Clear the scheduled polling if the status is completed
        this.removeTaskPolling(options);
      }
    },

    // Check if the local storage has the metadata key present.
    // If no, then dont trigger the share wise task.
    triggerShareScanTask: function(options, data) {
      if (!localStorage.getItem('metadata_scan_' + options.fsId) ||
        (localStorage.getItem('metadata_scan_' + options.fsId) &&
        !JSON.parse(localStorage.getItem('metadata_scan_' +
        options.fsId).length))) {
        return;
      }

      // Get the net scan status to update the task activity.
      this.getNetScanStatus(options, data);
    },

    // Get the net scan status.
    getNetScanStatus: function(options, data) {
      let shareList = JSON.parse(localStorage.getItem('metadata_scan_' +
        options.fsId)),
          shareCount = shareList.length;

      let inProgressCount = 0, completedCount = 0, failedCount = 0,
          metaDataStatus = AppConstants.METADATA_STATUS.COMPLETED;

      // Get the count of completed/failed/not_started/in progress shares.
      _.each(shareList, function(shareID) {
        _.each(data, function(rec) {
          if (rec.share_UUID === shareID) {
            if (rec.scan_status === AppConstants.METADATA_STATUS.RUNNING ||
              (rec.scan_status === AppConstants.METADATA_STATUS.NOT_STARTED &&
              !rec.error_details)) {
              inProgressCount++;
            } else if (rec.scan_status ===
              AppConstants.METADATA_STATUS.COMPLETED) {
              completedCount++;
            } else if ((rec.scan_status ===
              AppConstants.METADATA_STATUS.FAILED) ||
              (rec.scan_status === AppConstants.METADATA_STATUS.NOT_STARTED &&
              rec.error_details)) {
              failedCount++;
            }
          }
        });
      });

      // Set the status to running if any of the share scans is in progress.
      if (inProgressCount) {
        metaDataStatus = AppConstants.METADATA_STATUS.RUNNING;
      }

      const metaDataOptions = {
        completed: completedCount,
        total: shareCount,
        failed: failedCount,
        fsId: options.fsId
      };

      // Show in task activity.
      this.showTask(metaDataStatus, metaDataOptions);
    },

    // Fetch meta data status for the file server
    fetchMetaData: function(options) {
      let fsOptions = options, _this = this;
      let fsMetaDataCollection = new FileServerMetaDataCollection();
      fsMetaDataCollection.getURL();
      fsMetaDataCollection.fetch({
        success: function(data) {
          // Add meta data collection status in the task manager
          const metaDataStatus = fsMetaDataCollection.getScanStatus();
          let scanStatus = metaDataStatus;

          // Set scan status as 'complete' if 'failed' so that polling stops
          if (scanStatus === AppConstants.METADATA_STATUS.FAILED) {
            scanStatus = AppConstants.METADATA_STATUS.COMPLETED;
          }

          // Set the scan status in Namespacemanager to use it all across app
          NamespaceManager.set('full_status_' + fsOptions.fsId,
            scanStatus);

          let shareListLength = 0;
          if (localStorage.getItem('metadata_scan_' + fsOptions.fsId)) {
            shareListLength = JSON.parse(localStorage.getItem('metadata_scan_' +
              fsOptions.fsId).length);
          }

          // If local storage has meta data key and the corresponding list
          // length is not equal to the actual total number of shares.
          if (shareListLength &&
            shareListLength < fsMetaDataCollection.getTotalScanShares()) {
            _this.triggerShareScanTask(fsOptions, data.toJSON());
          } else {
            const options = {
              completed: fsMetaDataCollection.getCompleteScanShares(),
              total: fsMetaDataCollection.getTotalScanShares(),
              failed: fsMetaDataCollection.getFailedScanShares(),
              fsId: fsOptions.fsId
            };
            _this.showTask(metaDataStatus, options);
          }

          // Remove Schedule polling only if status is completed and
          // its already not been scheduled
          if ((metaDataStatus === AppConstants.METADATA_STATUS.COMPLETED ||
            metaDataStatus === AppConstants.METADATA_STATUS.FAILED) &&
            _this.repeatMetaDataFetch &&
            _this.repeatMetaDataFetch[options.fsId]) {
            _this.removeTaskPolling(options);
          }
        },
        error: function(model, xhr) {
          // Need to add error condition
        }
      });
    },

    // Show/Update the task in the task manager
    showTask: function(scanStatus, options) {
      // Dont show status if total is 0
      if (!options.total) {
        return;
      }

      // Set scan status as 'in progress' if 'not started' and 'complete' if
      // 'failed'
      if (scanStatus === AppConstants.METADATA_STATUS.NOT_STARTED) {
        scanStatus = AppConstants.METADATA_STATUS.IN_PROGRESS;
      } else if (scanStatus === AppConstants.METADATA_STATUS.FAILED) {
        scanStatus = AppConstants.METADATA_STATUS.COMPLETED;
      }

      let completeStatus = 0;
      const status =
        AppConstants.METADATA_STATUS_TITLE[scanStatus] || scanStatus;

      if (options.failed === 0 && options.completed === 0 &&
        options.total === 0) {
        completeStatus = 1;
      } else if (options.total > 0) {
        const totalScanned = options.completed + options.failed;
        completeStatus = (totalScanned / options.total).toFixed(2);
      }

      let taskCollection = TaskManager.getTaskCollection();
      let taskList = taskCollection.where({
        fileserverId: options.fsId,
        entityType: AppConstants.ENTITY_FILE_SERVER_META_DATA
      });


      let taskModel = '', failedMessage = '', message = 'File system scan ';
      // Set failed message
      if (options.failed &&
        scanStatus === AppConstants.METADATA_STATUS.COMPLETED) {
        failedMessage = ' (' + options.failed + ' failed)';
      }
      if (taskList.length) {
        taskModel = taskCollection.get(taskList[0].id);
        // Append '# out of <total shares> share(s) completed' message for file
        // system scan task in case task is still running.
        let shortDesc = '';
        if (scanStatus !== AppConstants.METADATA_STATUS.COMPLETED) {
          shortDesc = ' (' + (options.completed + options.failed) + ' out of ' +
            options.total + ' share(s) completed)';
        }
        taskModel.setMessage(message + status + failedMessage + shortDesc);
        AppUtil.resetTaskLoader(taskModel.cid);
      } else {
        // Set task model
        const displayMsg = message + status + failedMessage;
        taskModel = this.setTaskModel(displayMsg, completeStatus,
          AppConstants.ENTITY_FILE_SERVER_META_DATA, options);

        this.progressBar = AppUtil.loadTaskProgress(taskModel, scanStatus);
      }

      // Check if there are any errors in full scan, update progress bar
      // and the header ring dynamically
      if (failedMessage) {
        AppUtil.failedTaskLoader(taskModel.cid);
        // Set error and percentage to trigger change in parent
        // ring holder (header)
        taskModel.setError(failedMessage);
        taskModel.setPercentage(100);
        if (this.progressBar) {
          this.progressBar.set(completeStatus);
        }
      } else {
        const completePercent = completeStatus * 100;
        // Clear current errors set while completing task
        taskModel.setPercentage(completePercent, true);
        // Update the circle progress
        if (this.progressBar) {
          if (completePercent === 100) {
            AppUtil.successTaskLoader(taskModel.cid);
          }
          this.progressBar.set(completeStatus);
        }
      }
    },

    // Add task for repeated polling, in case its not already scheduled
    scheduleTaskPolling: function(options) {
      if (!this.repeatMetaDataFetch ||
        (this.repeatMetaDataFetch && !this.repeatMetaDataFetch[options.fsId])) {
        let _this = this;
        this.repeatMetaDataFetch[options.fsId] =
          setInterval(function() { _this.fetchMetaData(options); },
            AppConstants.TASK_PROGRESS_ACTIVE_INTERVAL);
      }
    },

    // Remove task from scheduled polling, in case it is already scheduled
    // and not required anymore
    removeTaskPolling: function(options) {
      // Remove the metadata scan entry from the local storage on scan
      // complete so that on refresh appropriate task activity is shown.
      localStorage.removeItem('metadata_scan_' + options.fsId);

      if (this.repeatMetaDataFetch && this.repeatMetaDataFetch[options.fsId]) {
        clearInterval(this.repeatMetaDataFetch[options.fsId]);
        delete this.repeatMetaDataFetch[options.fsId];
      }
    },

    // Remove all scheduled pooling for the fileserver other than th
    // passed/selected file server, and clear all if no file server is passed
    clearScheduledPolling: function(options) {
      if (this.repeatMetaDataFetch) {
        const fsId = (options && options.fsId) ? options.fsId : '';
        _.each(this.repeatMetaDataFetch, function(task, id) {
          if (id !== fsId) {
            clearInterval(this.repeatMetaDataFetch[id]);
            delete this.repeatMetaDataFetch[id];
          }
        }, this);
      }
    },

    // Clear the task manager i.e. remove previous file server tasks
    clearTaskManager: function(options) {
      // Set filter object to filter task collection
      const filterObj = {
        fileserverId: options.fsId || AppUtil.getSelectedFileServer()
      };
      if (options && options.entityType) {
        filterObj.entityType = options.entityType;
      }

      const taskCollection = TaskManager.getTaskCollection(),
            taskList = taskCollection.where(filterObj);

      // If tasks exists remove all of them
      if (taskList.length) {
        TaskManager.removeTaskCollecton(taskList);
      }
    },

    // Set the task model and returns task model
    // @params:
    // message: type string, display message in task manager
    // percent: type integer, max value 1
    // entityType: represents the entity
    // options: type object
    setTaskModel: function(message, percent, entityType, options) {
      const fsId = (options && options.fsId) || AppUtil.getSelectedFileServer(),
            taskId = (options && options.taskId) || fsId + '-' + entityType;

      // Append '# out of <total shares> share(s) completed' message for file
      // system scan task in case task is still running.
      if (entityType === AppConstants.ENTITY_FILE_SERVER_META_DATA &&
        parseInt(percent, 10) < 1) {
        message += ' (' + (options.completed + options.failed) + ' out of ' +
          options.total + ' share(s) completed)';
      }

      const taskModel = new TaskModel({
        message: message,
        percent: percent,
        id: 'n-task-' + taskId,
        fileserverId: fsId,
        entityType: entityType,
        linkClass: 'reTriggerMData',
        showPercent: false
      });
      TaskManager.addTaskToCollecton(taskModel);

      return taskModel;
    },

    // Get file analytics vm update status and update
    // task manager
    getfileAnalyticsVMUpdateStatus: function() {
      const faVmModel = new FileAnalyticsVMUpdateModel();
      const _this = this;
      faVmModel.getURL();
      faVmModel.fetch({
        success: function(data) {
          const completeStatus = 1;
          let status = 'failed', taskStatus = 'failed';
          if (data &&
            data.get(FileAnalyticsVMUpdateModel.DP.STATUS) === 'success') {
            status = 'successful';
            taskStatus = 'completed';
          }

          // Clear task manager with corresponding task
          const filterObj = {
            entityType: AppConstants.ENTITY_FILE_ANALYTICS_VM_UPDATE
          };
          _this.clearTaskManager(filterObj);

          // Set task model
          const displayMsg = 'File Analytics VM resource update ' + status;
          const taskModel = _this.setTaskModel(displayMsg, completeStatus,
            AppConstants.ENTITY_FILE_ANALYTICS_VM_UPDATE);

          let progressBar = AppUtil.loadTaskProgress(taskModel, taskStatus);

          const completePercent = completeStatus * 100;
          taskModel.setPercentage(completePercent);
          // Update the circle progress
          if (progressBar) {
            if (taskStatus === 'completed') {
              AppUtil.successTaskLoader(taskModel.cid);
            } else {
              AppUtil.failedTaskLoader(taskModel.cid);
              // Set error and percentage to trigger change in parent
              // ring holder (header)
              taskModel.setError('100%');
            }
            progressBar.set(completeStatus);
          }
        }
      });
    },

    // Get file analytics health data and update health status(color)
    // in the header
    // @param options object default is empty
    getHealthData: function(options = null) {

      const healthModel = new HealthModel(), _this = this;
      healthModel.getURL(options);
      return new Promise(resolve => {
        healthModel.fetch({
          success: function(data) {
            resolve(data);
            _this.updateHeaderHeart(data);
          },
          error: function(model, xhr) {
            _this.markHeartHealth();
            model.set({ 'error': xhr });
            resolve(model);
          }
        });
      });
    },

    // @private
    // Update the heart health on success of health API
    updateHeaderHeart: function(healthModel) {
      // Update health status in the header
      let healthStatus = this.getHealthStatus(
        this.getFileAnalyticsOverallHealth(healthModel));
      if (healthStatus === AppConstants.HEALTH_STATUS_VALUES[
        AppConstants.HEALTH_STATUS_CODES.GREEN]) {
        healthStatus = 'good';
      } else {
        healthStatus = healthStatus.toLowerCase();
      }
      const notificationBar = $('.notificationBar .alert');
      // Get the current message if exists on notification bar
      let currentMessage = notificationBar.length
        ? notificationBar[0].innerHTML : '';
      const msg = 'The health data shown is stale. One or more ' +
        'services in File Analytics might not be running ' +
        'currently. Please contact the administrator.';

      let messageType = 'error', updateNotificationMessage = false;
      // Check if the current page is Health page
      if (AppUtil.getCurrentPageId() ===
        AppConstants.HEALTH_PAGE_ID) {
        // Check the time of data in response and get validity of data
        if (!healthModel.isValidHealthData()) {
          // Append Health error message to the current message
          if (currentMessage) {
            if (!currentMessage.includes(msg)) {
              updateNotificationMessage = true;
              currentMessage = currentMessage + ' ' + msg;
              messageType = 'warning';
            }
          } else {
            updateNotificationMessage = true;
            currentMessage = msg;
          }
          // Set overall health to critical
          healthStatus = AppConstants.HEALTH_STATUS_VALUES[
            AppConstants.HEALTH_STATUS_CODES.RED].toLowerCase();
          this.setFileAnalyticsOverallHealth(healthModel, healthStatus);
          // Clear the alert if it exists and is related to stale data
        } else if (currentMessage && notificationBar[0].innerText
          .includes(msg)) {
          currentMessage = currentMessage.replace(msg, '');
          updateNotificationMessage = true;
          // Reset the message type to warning in case a notification exists.
          messageType = 'warning';
          // Clear the notification bar if the message was about stale data.
          if (notificationBar[0].innerText === msg) {
            updateNotificationMessage = false;
            $('.notificationBar').empty();
          }
        }
        if (updateNotificationMessage) {
          // Update the message only on health page
          const bannerOptions = {
            parentEl: '#n-ctr-page'
          };
          NotificationManager.showNotificationBar(currentMessage,
            messageType, bannerOptions);
          $('.notificationBar .alert').css('margin-bottom', 0);
        }

      }
      this.markHeartHealth(healthStatus);
    },

    // Set header icon as per status
    // @params healthstatus - string
    markHeartHealth: function(healthStatus = null) {
      // Search for class with words starting with n-health-status
      const matchHealthClassRegex = /(^|\s)(n-health-status-[a-z]?)\S+/g;
      if (healthStatus) {
        // Update the class based on health status
        $('.n-header-cluster-health.healthMonitoring > svg')
          .attr('class', function(i, c) {
            // search class with n-health-status and if found replace it
            // else add n-health-status class
            if (c.match(matchHealthClassRegex)) {
              return c.replace(matchHealthClassRegex,
                ' n-health-status-' + healthStatus);
            }
            return c + ' n-health-status-' + healthStatus;
          });
      } else {
        // Find class with n-health-status as prefix and remove it
        $('.n-header-cluster-health.healthMonitoring > svg')
          .attr('class', function(i, c) {
            return c.replace(matchHealthClassRegex, '');
          });
      }
    },

    // Return the File Analytics overall health status
    getFileAnalyticsOverallHealth: function(healthModel) {
      return healthModel.get(HealthModel.DP.FILE_ANALYTICS_HEALTH);
    },

    // Sets the File Analytics overall health status
    setFileAnalyticsOverallHealth: function(healthModel, value) {
      return healthModel.set(HealthModel.DP.FILE_ANALYTICS_HEALTH, value);
    },

    // Return the status text based on the color/api status
    getHealthStatus: function(colorStatus) {
      let currentStatus = AppConstants.HEALTH_STATUS_VALUES[
        AppConstants.HEALTH_STATUS_CODES.RED];
      if (colorStatus === AppConstants.HEALTH_STATUS_CODES.GREEN) {
        currentStatus = AppConstants.HEALTH_STATUS_VALUES[
          AppConstants.HEALTH_STATUS_CODES.GREEN];
      } else if (colorStatus === AppConstants.HEALTH_STATUS_CODES.YELLOW) {
        currentStatus = AppConstants.HEALTH_STATUS_VALUES[
          AppConstants.HEALTH_STATUS_CODES.YELLOW];
      }

      return currentStatus;
    }
  };

  return FileAnalyticsEnableUtil;
});
