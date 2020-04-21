//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FolderSearchTableView enables the user to view the table
// having files according to  the search input
//
define([
  // Views
  'views/base/BaseTableView',
  // Utils
  'utils/TimeUtil',
  'utils/AppConstants',
  // Managers
  'managers/WizardManager',
  // Models
  'models/filesearch/FileSearchModel',
  // Collections
  'collections/filesearch/FileSearchCollection',
  // Data
  'data/DataProperties',
  'utils/CommonTemplates'],
function(
  // Views
  BaseTableView,
  // Utils
  TimeUtil,
  AppConstants,
  // Managers
  WizardManager,
  // Models
  FileSearchModel,
  // Collections
  FileSearchCollection,
  // Data
  DataProp,
  CommonTemplates) {

  'use strict';

  var FolderSearchTableView = BaseTableView.extend({

    // @overrite
    // Initialize the view.
    initialize: function(options) {
      this.defaultMinRows = options.defaultMinRows;
      this.fileSearchModel = new FileSearchModel();
      this.model = new FileSearchCollection();
      this.setUrlParams(options.searchVal,
        AppConstants.FILE_SEARCH_TYPE.DIRECTORY);
      BaseTableView.prototype.initialize.call(this, options);

      // Enable popover on cell hover for this table
      this.enablePopoverOnHover();
    },

    // @override
    // Render the view.
    render: function() {
      BaseTableView.prototype.render.call(this);
      if (this.defaultMinRows === 10) {
        this.$el[0].style.minHeight = this.$el[0].offsetHeight + 'px';
      }

      return this;
    },

    // @private
    // Sets the parameter to create the URL.
    setUrlParams: function(searchVal, searchBy) {
      this.model.getURL(searchVal, this.defaultMinRows, searchBy);
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    // The file path expected to be in 'FS/SHARE/PARENT_FOLDER/FILE' or
    // 'FS/SHARE/FILE' or 'FS/SHARE/FOLDER' format.
    getDefaultColumns: function() {
      let model = this.fileSearchModel;
      let retArray = [
        // Name
        {
          'sTitle'  : 'Folder Name',
          'mData'   : DataProp.FOLDER_SEARCH_NAME,
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            const operation = data ? full[model.DP.LAST_EVENT][
              model.DP[model.DP.LAST_EVENT].OPERATION] : '';
            const id = full[model.DP.ID] || '';

            if (data) {
              let className = '';
              // If file operation is not present or is 'NA' or file name
              // is not present, fade out the text.
              if (!operation || operation === AppConstants.NOT_AVAILABLE) {
                className += ' not-active';
              }

              retVal = '<a class="auditHistory ' + className + '" \
                fileId="' + id + '" file-name="' + data + '" title="' +
                data + '">' + data +
                '</a>';
            }
            return retVal;
          }
        },
        {
          'sTitle'  : 'Folder Owner Name',
          'mData'   : DataProp.FOLDER_OWNER_NAME,
          'mRender' : function(data, type, full) {
            let owner = '', ownerName = '';
            if (data && data.includes('\\')) {
              ownerName = data.split('\\');
              owner = '<span title="' + data + '">' +
                ownerName[1] + '</span>';
            } else {
              ownerName = data || AppConstants.NOT_AVAILABLE;
              owner = '<span title="' + ownerName + '">' +
                ownerName + '</span>';
            }
            return owner;
          }
        },
        {
          'sTitle'  : 'Share Name',
          'mData'   : DataProp.FOLDER_SEARCH_SHARE_NAME,
          'sWidth'  : '10%',
          'mRender' : function(data, type, full) {
            if (data) {
              return '<span title="' + data + '">' + data + '</span>';
            }
            return AppConstants.NOT_AVAILABLE;
          }
        },
        {
          'sTitle'  : 'Parent Folder',
          'mData'   : DataProp.FOLDER_SEARCH_PARENT_FOLDER,
          'sWidth'  : '10%',
          'mRender' : function(data, type, full) {
            if (data) {
              return '<span title="' + data + '">' + data + '</span>';
            }
            return AppConstants.NOT_AVAILABLE;
          }
        },
        {
          'sTitle'  : 'Last Operation',
          'mData'   : DataProp.FOLDER_SEARCH_LAST_EVENT,
          'sWidth'  : '10%',
          'mRender' : function(data, type, full) {
            const operation = data ?
              data[model.DP[model.DP.LAST_EVENT].OPERATION] : '';
            let operationName = operation ?
              (AppConstants.OPERATION[operation] || operation) :
              AppConstants.NOT_AVAILABLE;
            return '<span title="' + operationName + '">' +
              operationName + '</span>';
          }
        },
        {
          'sTitle'  : 'Last Operation By',
          'mData'   : DataProp.FOLDER_SEARCH_LAST_EVENT,
          'sWidth'  : '12%',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            const user = data ?
              data[model.DP[model.DP.LAST_EVENT].USERNAME] :
              AppConstants.NOT_AVAILABLE;
            if (user && user.includes('\\')) {
              const username = user.split('\\');
              retVal = '<span title="' + user + '">' + username[1] +
                '</span>';
            } else {
              retVal = '<span title="' + user + '">' + user + '</span>';
            }

            return retVal;
          }
        },
        {
          'sTitle'  : 'Last Operation date',
          'mData'   : DataProp.FOLDER_SEARCH_LAST_EVENT,
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            const eventDate = data ?
              data[model.DP[model.DP.LAST_EVENT].DATE] : '';

            if (eventDate) {
              const dateFormat = TimeUtil.formatDate(eventDate);
              retVal = '<span title="' + dateFormat + '">' +
                dateFormat + '</span>';
            }
            return retVal;
          }
        },
        {
          'sTitle'  : 'Action',
          'mData'   : 'name',
          'sWidth'  : '10%',
          'bSortable': false,
          'tmplHover' :
            _.template('<div>No event(s) available for this file</div>'),
          'mRender' : function(data, type, full) {
            let disabled = '',
                lastOperation = full[model.DP.LAST_EVENT] ?
                  full[model.DP.LAST_EVENT][model.DP[model.DP.LAST_EVENT]
                    .OPERATION] : '';

            // If file operation is not present or is 'NA' or file name
            // is not present, fade out the text.
            if (!lastOperation ||
              lastOperation === AppConstants.NOT_AVAILABLE) {
              disabled = 'not-active';
            }

            return CommonTemplates.SEARCH_ACTION_ITEM({
              dataToggle: 'popover',
              targetName: data || AppConstants.NOT_AVAILABLE,
              targetId: full.id,
              auditAction: 'View Audit',
              // permissionAction: 'View Permissions',
              className: disabled
            });
          }
        }
      ];

      return retArray;
    },

    // @override
    // It decides if the tooltip has to be shown for a particular row
    // or not.
    // @return - true if tooltip has to be shown
    //         - false if no tooltip needed.
    canShowTooltip: function(rowData) {
      let retVal = false;
      let lastOperation = rowData[this.fileSearchModel.DP.LAST_EVENT][
        this.fileSearchModel.DP[this.fileSearchModel.DP.LAST_EVENT].OPERATION];

      // If file operation is not present or is 'NA' i.e. file is coming from
      // full scan so no events will be present for that file, then show tooltip
      if (!lastOperation || lastOperation === AppConstants.NOT_AVAILABLE) {
        retVal = true;
      }

      return retVal;
    },

    // @override
    // Returns the hover title for the column.
    // @param column - column
    // @return       - '' by default always
    getHoverTitle: function(column) {
      return '';
    },

    // @override
    // Opens a popup on clicking on a particular file in the table.
    handleAuditHistoryClick: function(e) {
      let fileId = this.$(e.currentTarget).attr('fileId'),
          fileName = this.$(e.currentTarget).attr('file-name'),
          action = this.$(e.currentTarget).attr('action'),
          targetName = this.$(e.currentTarget).parent('span')
            .attr('action-target-name'),
          targetId = this.$(e.currentTarget).parent('span')
            .attr('action-target-id'),
          options = {};

      fileName = fileName || targetName;
      fileId = fileId || targetId;
      action = action || AppConstants.AUDIT_ACTION;
      if (!fileName) {
        return;
      }
      options.title = 'Audit Details For: /' + fileName;
      options.type = action;
      options.fileName = fileName;
      options.fileId = fileId;
      options.actionTarget = AppConstants.ENTITY_FILE_AUDIT_HISTORY;
      options.searchType = AppConstants.FILE_SEARCH_TYPE.DIRECTORY;
      WizardManager.handleAction(options);
    }
  });

  return FolderSearchTableView;
});
