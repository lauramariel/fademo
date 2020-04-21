//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// UserAuditHistoryTableView enables the user to view the table with
// the user audit history.
//
define([
  // Core
  'views/base/BaseTableView',
  // Utils
  'utils/TimeUtil',
  'utils/AppConstants',
  'utils/DataExportUtil',
  'utils/AppUtil',
  'utils/StyleDescriptor',
  'utils/CommonTemplates',
  'progressBar',
  // Models/Collections
  'models/usersaudithistory/UserAuditHistoryModel',
  'collections/usersaudithistory/UserAuditHistoryCollection',
  'collections/usersaudithistory/UserAuditHistoryExportCollection',
  // Models
  'models/filesearch/FileSearchModel',
  'models/task/TaskModel',
  // Managers
  'managers/TaskManager'],
function(
  // Core
  BaseTableView,
  // Utils
  TimeUtil,
  AppConstants,
  DataExportUtil,
  AppUtil,
  StyleDescriptor,
  CommonTemplates,
  ProgressBar,
  // Models/Collections
  UserAuditHistoryModel,
  UserAuditHistoryCollection,
  UserAuditHistoryExportCollection,
  // Models
  FileSearchModel,
  TaskModel,
  // Managers
  TaskManager) {

  'use strict';

  const FILE_PARAM = 'file', PARENT_PARAM = 'parent';

  // Extend BaseTableView
  var UserAuditHistoryTableView = BaseTableView.extend({

    exportDataSet: [],

    // Object having the file paths
    filePaths: {},

    // Object having the parent folder paths
    parentPaths: {},

    // @override
    initialize: function(options) {
      this.filePaths = {};
      this.parentPaths = {};
      this.defaultMinRows = options.defaultMinRows;
      this.parent = options.parent;
      this.model = new UserAuditHistoryCollection();
      this.setUrlParams(options.userId);
      BaseTableView.prototype.initialize.call(this, options);

      // Add extra events
      this.addExtraEvents({
        'click  .n-settings-container'  : 'handleDropdownToggle',
        'click  .btnExport'             : 'onExport'
      });

      // Enable popover on cell hover for this table
      this.enablePopoverOnHover();

      // File model
      this.fileModel = new FileSearchModel();
    },

    // @override
    // Render the DOM
    render: function() {
      BaseTableView.prototype.render.call(this);
      this.$el[0].style.minHeight = '';
      // Show the download reports button for this table
      this.$el.find('.n-settings-container').show();
      // If current download is in progress, disable the download
      if (localStorage.getItem('download') === 'enabled') {
        this.parent.disableDownloadGear();
      }
      return this;
    },

    // @private
    // Fetch data
    fetchModel: function() {
      const options = {
        data: this.model.getRequestPayload(),
        type: 'POST'
      };
      BaseTableView.prototype.fetchModel.call(this, options);
    },

    // Fetch data, used for getting data for next page
    refreshData: function() {
      const options = {
        data: this.model.getRequestPayload(),
        type: 'POST'
      };
      BaseTableView.prototype.refreshData.call(this, options);
    },

    // @private
    // Sets the parameter to create the URL.
    setUrlParams: function(searchVal) {
      this.model.getURL(searchVal, this.defaultMinRows,
        this.options.startTimeInMs, this.options.endTimeInMs);
      const filter = this.getOperationFilter();
      if (Object.keys(filter).length > 0) {
        this.model.setFilterUrl(filter);
      }

    },

    // @private
    // Get selected operations
    getOperationFilter: function() {
      let checkboxIds = [], filter = {};
      checkboxIds = this.options.parent.getSelectedOperations();

      if (checkboxIds.length > 0) {
        filter = { 'operations' : checkboxIds };
      }

      return filter;
    },

    // @private
    // Handle dropdown toggle
    handleDropdownToggle: function(e) {
      // Check if download is in progress
      if (localStorage.getItem('download') !== 'enabled') {
        if (this.$('.settings-dropdown').hasClass('open')) {
          this.$('.settings-dropdown').removeClass('open');
        } else {
          this.$('.settings-dropdown').addClass('open');
        }
      }
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      let retArray = [
        {
          'sTitle'  : 'User IP Address',
          'sWidth'  : '25%',
          'mData'   : UserAuditHistoryModel.DP.AUDIT_MACHINE_NAME,
          'mRender' : function(data, type, full) {
            let clientInternetName = data || AppConstants.NOT_AVAILABLE;
            return '<span title="' + clientInternetName + '">' +
              clientInternetName + '</span>';
          }
        },
        {
          'sTitle'  : 'Operation',
          'sWidth'  : '25%',
          'mData'   : UserAuditHistoryModel.DP.AUDIT_OPERATION,
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            let auditOperation = '', auditOperationColor = '';

            // For export request
            if (type === AppConstants.TABLE_COL_TYPE_EXPORT) {
              const operation =
                full[UserAuditHistoryModel.DP.AUDIT_OPERATION];
              auditOperation =
                ((AppConstants.OPERATION[operation]) ?
                  AppConstants.OPERATION[operation] : operation) ||
                AppConstants.NOT_AVAILABLE;
              auditOperationColor =
                StyleDescriptor.OPERATIONS_COLORS[operation];

              // If audit_status is 'PermissionDenied' show that as operation
              // instead of actual operation
              if (_.indexOf(AppConstants.PERMISSION_DENIED_OP_STATUS,
                full[UserAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = auditOperation;
                auditOperation = AppConstants.OPERATION.PermissionDenied +
                  ' (' + operationVal + ')';
                auditOperationColor = StyleDescriptor.OPERATIONS_COLORS[
                  AppConstants.OPERATION_VALUES.PermissionDenied];
              } else if (_.indexOf(AppConstants.FILE_BLOCKING_PD_OP_STATUS,
                full[UserAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = auditOperation;
                auditOperation =
                  AppConstants.OPERATION.PermissionDeniedFileBlocking +
                  ' (' + operationVal + ')';
                auditOperationColor = StyleDescriptor.OPERATIONS_COLORS[
                  AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking];
              }
            } else {
              auditOperation = (AppConstants.OPERATION[data]) ?
                AppConstants.OPERATION[data] : data;
              auditOperationColor = StyleDescriptor.OPERATIONS_COLORS[data];

              // If audit_status is 'PermissionDenied' show that as operation
              // instead of actual operation
              if (_.indexOf(AppConstants.PERMISSION_DENIED_OP_STATUS,
                full[UserAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = auditOperation;
                auditOperation = AppConstants.OPERATION.PermissionDenied +
                  ' (' + operationVal + ')';
                auditOperationColor = StyleDescriptor.OPERATIONS_COLORS[
                  AppConstants.OPERATION_VALUES.PermissionDenied];
              } else if (_.indexOf(AppConstants.FILE_BLOCKING_PD_OP_STATUS,
                full[UserAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = auditOperation;
                auditOperation =
                  AppConstants.OPERATION.PermissionDeniedFileBlocking +
                  ' (' + operationVal + ')';
                auditOperationColor = StyleDescriptor.OPERATIONS_COLORS[
                  AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking];
              }
            }

            if (auditOperation) {
              retVal = CommonTemplates.OPERATION_CIRCLE({
                backgroundColor: auditOperationColor,
                border: auditOperationColor
              }) + '<span title="' + auditOperation + '">' +
                auditOperation + '</span>';
            }

            return retVal;
          }
        },
        {
          'sTitle'  : 'Target File',
          'sWidth'  : '25%',
          'mData'   : UserAuditHistoryModel.DP.AUDIT_OBJECT_NAME,
          'tmplHover' : CommonTemplates.POPOVER_TEMPLATE,
          'mRender' : function(data, type, full) {
            let retVal = '',
                oldFileTempl = _.template('(Old name: <%= oldName %> )');

            // In case of export/download.
            if (type === AppConstants.TABLE_COL_TYPE_EXPORT) {
              // If operation is Rename and op status is not file blocking PD
              if ((full[UserAuditHistoryModel.DP.AUDIT_OPERATION] ===
                AppConstants.OPERATION.Rename) &&
                (_.indexOf(AppConstants.FILE_BLOCKING_PD_OP_STATUS,
                  full[UserAuditHistoryModel.DP.AUDIT_STATUS]) < 0)) {
                let oldFileName = oldFileTempl({
                  oldName: full[UserAuditHistoryModel.DP.AUDIT_OLD_OBJECT_NAME]
                });

                retVal = full[UserAuditHistoryModel.DP.AUDIT_OBJECT_NAME] +
                  oldFileName;
              } else {
                retVal = full[UserAuditHistoryModel.DP.AUDIT_OBJECT_NAME] ||
                  AppConstants.NOT_AVAILABLE;
              }
            } else {
              let auditPath = '';
              // If operation is Rename and op status is not file blocking PD
              if ((full[UserAuditHistoryModel.DP.AUDIT_OPERATION] ===
                AppConstants.OPERATION.Rename) &&
                (_.indexOf(AppConstants.FILE_BLOCKING_PD_OP_STATUS,
                  full[UserAuditHistoryModel.DP.AUDIT_STATUS]) < 0)) {
                // Show just the old file name to mainatin consistency for
                // SMB and NFS as one of them returns the entire old path and
                // another one just returns the old file name.
                let oldFile =
                  full[UserAuditHistoryModel.DP.AUDIT_OLD_OBJECT_NAME] ||
                  AppConstants.NOT_AVAILABLE,
                    oldFileArr = [], len = 0;

                if (full[UserAuditHistoryModel.DP.AUDIT_OLD_OBJECT_NAME]
                  .includes('/')) {
                  oldFileArr =
                    full[UserAuditHistoryModel.DP.AUDIT_OLD_OBJECT_NAME]
                      .split('/');
                  len = oldFileArr.length;
                  oldFile = oldFileArr[len - 1];
                }

                let oldFileName = '<br>' + oldFileTempl({
                  oldName: oldFile
                });

                auditPath = (data || AppConstants.NOT_AVAILABLE) + oldFileName;

                retVal = '<span class="inline-popover" actionTargetFile = ' +
                  full[UserAuditHistoryModel.DP.AUDIT_OBJECT_ID] +
                  ' actionTargetOldParentId = ' +
                  full[UserAuditHistoryModel.DP.AUDIT_OLD_PARENT_ID] +
                  ' actionTargetOldName = "' +
                  full[UserAuditHistoryModel.DP.AUDIT_OLD_OBJECT_NAME] +
                  '" data-toggle="popover">' +
                  auditPath + '</span>';
              } else {
                retVal = '<span class="inline-popover" actionTargetFile = ' +
                  full[UserAuditHistoryModel.DP.AUDIT_OBJECT_ID] +
                  ' data-toggle="popover">' +
                  (data || AppConstants.NOT_AVAILABLE) + '</span>';
              }
            }
            return retVal;
          }
        },
        {
          'sTitle'  : 'Operation date',
          'mData'   : UserAuditHistoryModel.DP.AUDIT_EVENT_DATE,
          'mRender' : function(data, type, full) {
            let auditTimestamp = TimeUtil.formatDate(data);
            return '<span title="' + auditTimestamp + '">' +
              auditTimestamp + '</span>';
          }
        }];

      return retArray;
    },

    // Returns the hover title for the column.
    // @param column - column
    // @return       -  column's title by default or 'Details' if no title
    getHoverTitle: function(column) {
      return '';
    },

    // @private
    // Return the file path of the file corresponding to file id.
    getFilePath: function(e) {
      const currentTarget = $(e.currentTarget).find('[data-toggle="popover"]');
      let _this = this, retObj = {};

      retObj.fileId = currentTarget.attr('actionTargetFile');
      retObj.fileOldParent = currentTarget.attr('actionTargetOldParentId');
      retObj.fileOldName = currentTarget.attr('actionTargetOldName');
      retObj.filePathTemplate = _.template('<span><%= path %></span>');
      retObj.oldFileTempl = _.template(
        '<span>(<b>Old path:</b> <%= oldPath %>)</span>');
      retObj.popoverId = $('div#' + currentTarget.attr('aria-describedby') +
        ' .n-details-table-tip');

      if (this.filePaths.hasOwnProperty(retObj.fileId)) {
        // If ID exists in the local object, no need to hit the API again.
        // The tooltip text template.
        let fileTmpl = retObj.filePathTemplate({
          path: _this.filePaths[retObj.fileId]
        });

        retObj.popoverHtml = fileTmpl;

        // In case of rename event, get the Old path.
        if (retObj.fileOldParent && retObj.fileOldName) {
          if (retObj.fileOldName.includes('/')) {
            let oldFileName = retObj.fileOldName.split('/').splice(-1, 1)
              .join();

            retObj.fileOldName = oldFileName;
          }

          // In case file ID and parent ID are same.
          if (retObj.fileOldParent === retObj.fileId) {
            let oldArr = _this.filePaths[retObj.fileId].split('/');
            oldArr.pop();
            let oldConstructedPath = oldArr.join('/') + '/' +
              retObj.fileOldName;
            retObj.popoverHtml = retObj.popoverHtml + retObj.oldFileTempl({
              oldPath: oldConstructedPath
            });
            // Update the path in the tooltip on success.
            $(retObj.popoverId).html(retObj.popoverHtml);
          } else if (_this.parentPaths.hasOwnProperty(retObj.fileOldParent)) {
            // If parent ID exists in the local object, no need to hit the API.
            retObj.popoverHtml = retObj.popoverHtml + retObj.oldFileTempl({
              oldPath: _this.parentPaths[retObj.fileOldParent] + '/' +
                retObj.fileOldName
            });
            // Update the path in the tooltip on success.
            $(retObj.popoverId).html(retObj.popoverHtml);
          } else {
            _this.fetchFullPath(retObj, PARENT_PARAM);
          }
        } else {
          // Update the path in the tooltip on success.
          $(retObj.popoverId).html(fileTmpl);
        }
      } else {
        // If ID doesn't exist, hit the API to get the file path.
        this.fetchFullPath(retObj, FILE_PARAM);
      }
    },

    // @private
    // Fetch full path based on the id.
    fetchFullPath: function(fileObj, diffParam) {
      let id = '', _this = this;
      if (diffParam === FILE_PARAM) {
        id = fileObj.fileId;
      } else {
        id = fileObj.fileOldParent;
      }

      this.fileModel.getFilePathURL(id);
      this.fileModel.fetch({
        success: function(data) {
          if (data && data.attributes.path) {
            if (diffParam === FILE_PARAM) {
              // The tooltip text template.
              let fileTmpl = fileObj.filePathTemplate({
                path: data.attributes.path
              });

              fileObj.popoverHtml = fileTmpl;
              // Store it in the local object.
              _this.filePaths[id] = data.attributes.path;

              // In case of rename event, get the Old path.
              if (fileObj.fileOldParent && fileObj.fileOldName) {
                // If file old path exists, just use the file name from the path.
                if (fileObj.fileOldName.includes('/')) {
                  let oldFileName = fileObj.fileOldName.split('/').splice(-1, 1)
                    .join();

                  fileObj.fileOldName = oldFileName;
                }
                if (fileObj.fileOldParent === fileObj.fileId) {
                  let oldArr = _this.filePaths[fileObj.fileId].split('/');
                  oldArr.pop();
                  let oldConstructedPath = oldArr.join('/') + '/' +
                    fileObj.fileOldName;

                  fileObj.popoverHtml = fileObj.popoverHtml +
                    fileObj.oldFileTempl({
                      oldPath: oldConstructedPath
                    });
                  // Update the path in the tooltip on success.
                  $(fileObj.popoverId).html(fileObj.popoverHtml);
                } else {
                  _this.fetchFullPath(fileObj, PARENT_PARAM);
                }
              } else {
                // Update the path in the tooltip on success.
                $(fileObj.popoverId).html(fileTmpl);
              }
            } else {
              // Store it in the local object.
              _this.parentPaths[id] = data.attributes.path;
              // Old path returned is the path of the old parent folder.
              // So appending the file name along with a / to get the complete
              // name.
              fileObj.popoverHtml = fileObj.popoverHtml + fileObj.oldFileTempl({
                oldPath: data.attributes.path + '/' + fileObj.fileOldName
              });
              // Update the path in the tooltip on success.
              $(fileObj.popoverId).html(fileObj.popoverHtml);
            }
          } else {
            $(fileObj.popoverId).html(AppConstants.PATH_NOT_AVAILABLE);
          }
        },
        error: function(xhr) {
          // Throw generic error no matter what the error code is.
          if (diffParam === FILE_PARAM) {
            $(fileObj.popoverId).html(AppConstants.PATH_NOT_AVAILABLE);
          } else {
            $(fileObj.popoverId).html(fileObj.popoverHtml);
          }
        }
      });
    },

    // @override
    // Overriding it to get the placement on the right
    // Returns the Hover placement for the column
    // @return hover over placement - top, bottom, left, right
    getHoverPlacement: function(column) {
      return 'right';
    },

    // @override
    // Returns the file path when mouse enters the element.
    onPopoverCellMouseEnter: function(e) {
      BaseTableView.prototype.onPopoverCellMouseEnter.call(this, e);
      this.getFilePath(e);
    },


    // @override
    // Event handler -- remove button on a filter
    onRemoveFilter: function(e) {
      var filterType = $(e.currentTarget).attr('data-id'),
          filterVal = $(e.currentTarget).attr('data-val');

      switch( filterType ) {
        case 'start-date':
        case 'end-date':
          this.removeDateFilter(filterType);
          break;
        case 'event':
          this.removeEventFilter(filterVal);
          break;
        default:
          break;
      }
      BaseTableView.prototype.onRemoveFilter.call(this, e);
    },

    // @private
    // Export as CSV or JSON
    onExport: function(e) {
      // Check if download is in progress
      if (localStorage.getItem('download') === 'enabled') {
        return;
      }

      // Reset export data set to clear previously downloaded data
      this.exportDataSet = [];

      const totalCount = this.model.getMetaData().total;

      // If the total count is more than the download limit, show confirmation
      // message before beginning download.
      if (totalCount > AppConstants.EXPORT_LIMIT) {
        this.parent.openConfirmationPopup('Exporting the audit data is limited\
         to first 10k records. You can filter the results but applying the \
        additional filters like date range and operations.',
        this.initiateExport.bind(this), e);
      } else {
        this.initiateExport(e);
      }
    },

    // @private
    // Initiate export process after the validation is passed
    initiateExport: function(e) {
      const target = $(e.target);
      var exportCollection = new UserAuditHistoryExportCollection();

      var type = 'json';
      if (target.hasClass('csv')) {
        type = 'csv';
      }

      // Download only allowed chunk if the total data is more than permissible
      // number of rows.
      const chunkCount = this.model.getMetaData().total >
      AppConstants.EXPORT_LIMIT ? AppConstants.EXPORT_LIMIT
        : this.model.getMetaData().total;

      // Disabled export option
      this.parent.disableDownloadGear();

      // Get count of number of call to be made to export complete data set
      let recursiveCallCount = 1, exportChunkCount = chunkCount;
      if (chunkCount > AppConstants.DEFAULT_EXPORT_COUNT) {
        let exportChunk = AppConstants.DEFAULT_EXPORT_COUNT + 1;
        recursiveCallCount = Math.floor(chunkCount / exportChunk);
        if ((chunkCount % exportChunk)) {
          recursiveCallCount += 1;
        }
        exportChunkCount = AppConstants.DEFAULT_EXPORT_COUNT;
      }

      exportCollection.getURL(this.options.userId, exportChunkCount,
        this.options.startTimeInMs, this.options.endTimeInMs);

      // Show info message that the download has begun
      this.parent.showInfo('Your download has been initiated. Please check the\
       Task Manager to track progress.');

      var filter = this.getOperationFilter();
      if (Object.keys(filter).length > 0) {
        exportCollection.setFilterUrl(filter);
      }

      let taskModel = new TaskModel({
        id: 'n-task-user-' + new Date().getTime() + '-download-' + type,
        message: 'Downloading (' + type + ') audit history for: ' +
          this.options.userName.replace('%5C', '\\'),
        percent: 0 });
      TaskManager.addTaskToCollecton(taskModel);

      // Make the progress on each fetch success, reserve time for
      // file compilation
      let progressStep = (0.9 / recursiveCallCount),
          progressBar = this.prepareProgressLoader(taskModel);

      // Export the data
      this.exportData(type, exportCollection, recursiveCallCount, progressBar,
        progressStep, taskModel);
    },

    // Append progress bar
    prepareProgressLoader: function(taskModel) {
      let circleProgress = new ProgressBar.Circle('.task-progress-loader_' +
        taskModel.cid, {
        color: '#26bbf0',
        easing: 'easeInOut',
        strokeWidth: 20,
        step: function(state, circle) {
          taskModel.setPercentage(Math.round(circle.value() * 100));
        }
      });

      return circleProgress;
    },

    // @override
    // As the format of data being returned in export api is different compared
    // to normal fetch api used to display results for fast performance
    exportData: function(exportType, model, recursiveCallCount, progressBar,
      progressStep, taskModel) {
      var _this = this;
      let exportChunk = AppConstants.DEFAULT_EXPORT_COUNT;

      // Increment progress
      let progressIncrement = progressBar.value() + progressStep;
      progressBar.set(progressIncrement);

      model.fetch({
        data: model.getRequestPayload(),
        type: 'POST',
        success: function(data) {
          const metaData = model.getMetaData();
          if (recursiveCallCount > 1 && metaData &&
            metaData.next_batch_id && data.models.length) {
            model.updateExportUrl(metaData.next_batch_id, exportChunk);
            _this.exportData(exportType, model, recursiveCallCount - 1,
              progressBar, progressStep, taskModel);
          } else if (recursiveCallCount > 1 && ((metaData &&
            !metaData.next_batch_id) || !data.models.length)) {
            taskModel.setError('Failed');
            AppUtil.failedTaskLoader(taskModel.cid);
            progressBar.set(1);

            // Enable export option
            setTimeout(_this.parent.clearDownloadCache(), 6000);
          }

          _this.exportDataSet.push(data.models);

          if (recursiveCallCount <= 1) {
            model.models = _.flatten(_this.exportDataSet);
            if (exportType === 'csv') {
              DataExportUtil.exportTableCSV(
                model.toJSON({ includeAttribute : true,
                  includeCustomAttributes: true }),
                _this.getCurrentColumns()
              );
            } else if (exportType === 'json') {
              DataExportUtil.exportTableJSON(
                model.toJSON({ includeAttribute : true,
                  includeCustomAttributes: true }),
                _this.getCurrentColumns()
              );
            }

            // Complete progress bar
            progressBar.set(1);

            AppUtil.successTaskLoader(taskModel.cid);
            taskModel.setMessage('Downloaded (' + exportType + ') audit ' +
              'history for: ' + _this.options.userName.replace('%5C', '\\'));
            // Reset export data set after download complete
            _this.exportDataSet = [];
            // Enable export option
            _this.parent.clearDownloadCache();
          }
        },
        error: function(e) {
          // Increment progress
          AppUtil.failedTaskLoader(taskModel.cid);
          taskModel.setError('Failed');
          progressBar.set(1);
          // Reset export data set if error occurred
          _this.exportDataSet = [];
          // Enable export option
          _this.parent.clearDownloadCache();
        }
      });
    },

    // @private
    // Closed dropdown and fire filter click event
    removeEventFilter: function(filterVal) {
      $('#' + filterVal).click();
      this.handleBtnDropdownOkClick();
    },

    // @private
    // Clear applied filters
    removeDateFilter: function(filterType) {
      $('.start-date-filter').find('input[type="text"]').val('');
      $('.end-date-filter').find('input[type="text"]').val('');
      $('.start-date').remove();
      $('.end-date').remove();
      this.handleBtnDateRangeFilter();
    }
  });

  return UserAuditHistoryTableView;
});
