//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileAuditHistoryTableView enables the user to view the table with
// the file audit history.
//
define([
  // Views
  'views/base/BaseTableView',
  // Models/Collections
  'models/filesaudithistory/FileAuditHistoryModel',
  'collections/filesaudithistory/FileAuditHistoryCollection',
  'collections/filesaudithistory/FileAuditHistoryExportCollection',
  // Utils
  'utils/AppConstants',
  'utils/DataExportUtil',
  'utils/TimeUtil',
  'utils/AppUtil',
  'utils/StyleDescriptor',
  'utils/CommonTemplates',
  'progressBar',
  // Models
  'models/task/TaskModel',
  'models/filesearch/FileSearchModel',
  // Managers
  'managers/TaskManager'],
function(
  // Views
  BaseTableView,
  // Models/Collections
  FileAuditHistoryModel,
  FileAuditHistoryCollection,
  FileAuditHistoryExportCollection,
  // Utils
  AppConstants,
  DataExportUtil,
  TimeUtil,
  AppUtil,
  StyleDescriptor,
  CommonTemplates,
  ProgressBar,
  // Models
  TaskModel,
  FileSearchModel,
  // Managers
  TaskManager) {

  'use strict';

  var FileAuditHistoryTableView = BaseTableView.extend({
    exportDataSet: [],

    // Object having the file paths
    filePaths: {},

    // @override
    initialize: function(options) {
      this.filePaths = {};
      this.defaultMinRows = options.defaultMinRows;
      this.parent = options.parent;
      this.model = new FileAuditHistoryCollection();
      this.setUrlParams(options.fileId);
      // Add extra events
      this.addExtraEvents({
        'click  .n-settings-container'  : 'handleDropdownToggle',
        'click  .btnExport'             : 'onExport'
      });

      BaseTableView.prototype.initialize.call(this, options);

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

    // @override
    // Called when fetching the table data is a success.
    // Overridden to change the title of the popup
    // to the file audit path.
    onActionSuccess: function(data) {
      if (data._metadata.audit_path) {
        // Removing file server name from audit_path
        data._metadata.audit_path = data._metadata.audit_path
          .substring(data._metadata.audit_path.indexOf('/') + 1);
        $('.audit-history-wizard .n-title').html(
          '<span title="' + data._metadata.audit_path +
          '">Audit Details For: ' + data._metadata.audit_path + '</span>');
      }
      BaseTableView.prototype.onActionSuccess.call(this, data);
    },

    // @private
    // Sets the parameter to create the URL.
    setUrlParams: function(fileName) {
      this.model.getURL(fileName, this.defaultMinRows,
        this.options.startTimeInMs, this.options.endTimeInMs);
      let filter = this.getOperationFilter();
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
    // Handles the Cancel button click on the dropdown.
    // Closes the table dropdown if already opened.
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
          'sTitle'  : 'username',
          'sWidth'  : '25%',
          'mData'   : FileAuditHistoryModel.DP.AUDIT_USERNAME,
          'mRender' : function(data, type, full) {
            let auditUsername = data || AppConstants.NOT_AVAILABLE;
            return '<span title="' + auditUsername + '">' +
              auditUsername + '</span>';
          }
        },
        {
          'sTitle'  : 'Client IP',
          'sWidth'  : '25%',
          'mData'   : FileAuditHistoryModel.DP.AUDIT_MACHINE_NAME,
          'mRender' : function(data, type, full) {
            let auditClientInternetName = data || AppConstants.NOT_AVAILABLE;
            return '<span title="' + auditClientInternetName + '">' +
              auditClientInternetName + '</span>';
          }
        },
        {
          'sTitle'  : 'Operation',
          'sWidth'  : '25%',
          'mData'   : FileAuditHistoryModel.DP.AUDIT_OPERATION,
          'tmplHover': CommonTemplates.POPOVER_TEMPLATE,
          'mRender' : function(data, type, full) {
            let auditOperation = '', operationData = '', retVal = '',
                oldFileTempl = _.template('(Old name: <%= oldName %>)');

            // For download/export purpose.
            if (type === AppConstants.TABLE_COL_TYPE_EXPORT) {
              let operationPerformed =
                full[FileAuditHistoryModel.DP.AUDIT_OPERATION];
              auditOperation = AppConstants.OPERATION[operationPerformed] ||
                operationPerformed;

              // If audit_status is 'PermissionDenied' show that as operation
              // instead of actual operation
              if (_.indexOf(AppConstants.PERMISSION_DENIED_OP_STATUS,
                full[FileAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = auditOperation;
                auditOperation = AppConstants.OPERATION.PermissionDenied +
                  ' (' + operationVal + ')';
              } else if (_.indexOf(AppConstants.FILE_BLOCKING_PD_OP_STATUS,
                full[FileAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = auditOperation;
                auditOperation =
                  AppConstants.OPERATION.PermissionDeniedFileBlocking +
                  ' (' + operationVal + ')';
              } else if (auditOperation === AppConstants.OPERATION.Rename) {
                let oldFileName = oldFileTempl({
                  oldName:
                    full[FileAuditHistoryModel.DP.AUDIT_OLD_OBJECT_NAME]
                });

                auditOperation += oldFileName;
              }

              retVal = auditOperation;
            } else {
              let backgroundColor =
                StyleDescriptor.OPERATIONS_COLORS[data];

              let hoverTitle = '';
              operationData = AppConstants.OPERATION[data] || data;

              // If audit_status is 'PermissionDenied' show that as operation
              // instead of actual operation
              if (_.indexOf(AppConstants.PERMISSION_DENIED_OP_STATUS,
                full[FileAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = operationData;
                operationData = AppConstants.OPERATION.PermissionDenied +
                  ' (' + operationVal + ')';
                backgroundColor = StyleDescriptor.OPERATIONS_COLORS[
                  AppConstants.OPERATION_VALUES.PermissionDenied];

                hoverTitle = '<span title="' + operationData + '">'
                  + operationData + '</span>';
              } else if (_.indexOf(AppConstants.FILE_BLOCKING_PD_OP_STATUS,
                full[FileAuditHistoryModel.DP.AUDIT_STATUS]) > -1) {
                const operationVal = operationData;
                operationData =
                  AppConstants.OPERATION.PermissionDeniedFileBlocking +
                  ' (' + operationVal + ')';
                backgroundColor = StyleDescriptor.OPERATIONS_COLORS[
                  AppConstants.OPERATION_VALUES.PermissionDeniedFileBlocking];

                hoverTitle = '<span title="' + operationData + '">'
                  + operationData + '</span>';
              } else if (AppConstants.OPERATION[data] ===
                AppConstants.OPERATION.Rename) {
                // Show just the Old name to maintain consistency for
                // SMB and NFS as one of them returns the entire old path and
                // another one just returns the Old name.
                const objectId =
                  full[FileAuditHistoryModel.DP.AUDIT_OBJECT_ID];
                const oldParentId =
                  full[FileAuditHistoryModel.DP.AUDIT_OLD_PARENT_ID];
                const oldFileName =
                  full[FileAuditHistoryModel.DP.AUDIT_OLD_OBJECT_NAME];

                let oldFile = oldFileName || AppConstants.NOT_AVAILABLE,
                    oldFileArr = [], len = 0;

                if (oldFileName.includes('/')) {
                  oldFileArr = oldFileName.split('/');
                  len = oldFileArr.length;
                  oldFile = oldFileArr[len - 1];
                }

                let oldFileNameTempl = oldFileTempl({
                  oldName: oldFile
                });

                // Title to show the Old name on hover of operation.
                hoverTitle = '<span>' + operationData +
                  '</span><br><span class="inline-popover"' +
                  ' actionTargetOldParentId = ' + oldParentId +
                  ' actionTargetOldName = "' + oldFileName +
                  '" actionTargetId = "' + objectId +
                  '" data-toggle="popover">' + oldFileNameTempl + '</span>';
              } else {
                hoverTitle = '<span title="' + operationData + '">'
                  + operationData + '</span>';
              }

              const operationIcon = CommonTemplates.OPERATION_CIRCLE({
                backgroundColor: backgroundColor,
                border: backgroundColor
              });

              retVal = operationIcon + hoverTitle;
            }
            return retVal;
          }
        },
        {
          'sTitle'  : 'Operation date',
          'mData'   : FileAuditHistoryModel.DP.AUDIT_EVENT_DATE,
          'mRender' : function(data, type, full) {
            let auditTimestamp = TimeUtil.formatDate(data);
            return '<span title="' + auditTimestamp + '">' +
              auditTimestamp + '</span>';
          }
        }];

      return retArray;
    },

    // @override
    // Returns the file path when mouse enters the element.
    onPopoverCellMouseEnter: function(e) {
      BaseTableView.prototype.onPopoverCellMouseEnter.call(this, e);
      this.getFilePath(e);
    },

    // @private
    // Return the file path of the file corresponding to file id.
    getFilePath: function(e) {
      const currentTarget = $(e.currentTarget).find('[data-toggle="popover"]');
      let _this = this,
          fileTmpl = '',
          fileId = currentTarget.attr('actionTargetId'),
          fileOldParent = currentTarget.attr('actionTargetOldParentId'),
          fileOldName = currentTarget.attr('actionTargetOldName'),
          filePathTempl = _.template('<span><b>Old name:</b> ' +
            '<%= path %></span>'),
          popoverId = $('div#' + currentTarget.attr('aria-describedby') +
            ' .n-details-table-tip');

      if (fileOldName.includes('/')) {
        // If file old path exists, just use the file name from the path.
        fileOldName = fileOldName.split('/').splice(-1, 1).join();
      }

      if (this.filePaths.hasOwnProperty(fileOldParent)) {
        // If ID exists in the local object, no need to hit the API again.
        // The tooltip text template.
        fileTmpl = filePathTempl({
          path: _this.filePaths[fileOldParent] + '/' + fileOldName
        });

        // Update the path in the tooltip on success.
        $(popoverId).html(fileTmpl);
      } else {
        // If ID doesn't exist, hit the API to get the file path.
        this.fileModel.getFilePathURL(fileOldParent);
        this.fileModel.fetch({
          success: function(data) {
            if (data && data.attributes.path) {
              let pathVal = '';
              // If file path is same as the parent path,
              // replace the file name in the path with the Old name.
              if (fileId === fileOldParent) {
                let pathArr = data.attributes.path.split('/');
                pathArr[pathArr.length - 1] = fileOldName;
                pathVal = pathArr.join('/');
              } else {
                pathVal = data.attributes.path + '/' + fileOldName;
              }

              // Store it in the local object.
              let parentPath = pathVal.split('/');
              parentPath.pop();
              _this.filePaths[fileOldParent] = parentPath.join('/');

              // The tooltip text template.
              fileTmpl = filePathTempl({
                path: pathVal
              });
              // Update the path in the tooltip on success.
              $(popoverId).html(fileTmpl);
            } else {
              $(popoverId).html(AppConstants.PATH_NOT_AVAILABLE);
            }
          },
          error: function(xhr) {
            // Throw generic error no matter what the error code is.
            $(popoverId).html(AppConstants.PATH_NOT_AVAILABLE);
          }
        });
      }
    },

    // Returns the Hover placement for the column
    // @return hover over placement - top, bottom, left, right
    getHoverPlacement: function(column) {
      return 'right';
    },

    // Returns the hover title for the column.
    // @param column - column
    // @return       -  column's title by default or 'Details' if no title
    getHoverTitle: function(column) {
      return '';
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
      var exportCollection = new FileAuditHistoryExportCollection();

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
        exportChunkCount = exportChunk - 1;
      }

      exportCollection.getURL(this.options.fileId, exportChunkCount,
        this.options.startTimeInMs, this.options.endTimeInMs);

      // Show info message that the download has begun
      this.parent.showInfo('Your download has been initiated. Please check the\
       Task Manager to track progress.');

      var filter = this.getOperationFilter();
      if (Object.keys(filter).length > 0) {
        exportCollection.setFilterUrl(filter);
      }

      let taskModel = new TaskModel({
        id: 'n-task-file-' + new Date().getTime() + '-download-' + type,
        message: 'Downloading (' + type + ') audit history for: ' +
          this.options.fileName,
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
              'history for: ' + _this.options.fileName);
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
    // Removes the filter on operations.
    removeEventFilter: function(filterVal) {
      $('#' + filterVal).click();
      this.handleBtnDropdownOkClick();
    },

    // @private
    // Removes the date filter.
    removeDateFilter: function(filterType) {
      $('.start-date-filter').find('input[type="text"]').val('');
      $('.end-date-filter').find('input[type="text"]').val('');
      $('.start-date').remove();
      $('.end-date').remove();
      this.handleBtnDateRangeFilter();
    }
  });


  return FileAuditHistoryTableView;
});
