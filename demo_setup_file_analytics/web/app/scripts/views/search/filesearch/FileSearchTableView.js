//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// FileSearchTableView enables the user to view the table
// having files according to  the search input
//
define([
  // Views
  'views/base/BaseTableView',
  // Managers
  'managers/WizardManager',
  // Utils
  'utils/TimeUtil',
  'utils/AppConstants',
  'utils/CommonTemplates',
  // Collections
  'collections/filesearch/FileSearchCollection'],
function(
  // Views
  BaseTableView,
  // Managers
  WizardManager,
  // Utils
  TimeUtil,
  AppConstants,
  CommonTemplates,
  // Collections
  FileSearchCollection) {

  'use strict';

  var FileSearchTableView = BaseTableView.extend({

    // @overrite
    // Initialize the view.
    initialize: function(options) {
      this.defaultMinRows = options.defaultMinRows;
      this.model = new FileSearchCollection();
      this.setUrlParams(options.searchVal,
        AppConstants.FILE_SEARCH_TYPE.FILE);
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
      let retArray = [
        // Name
        {
          'sTitle'  : 'File Name',
          'mData'   : 'name',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data) {
              let className = '';
              // If file operation is not present or is 'NA' or file name
              // is not present, fade out the text.
              if (!full.last_event.operation ||
                full.last_event.operation === AppConstants.NOT_AVAILABLE) {
                className += ' not-active';
              }

              retVal = '<a class="auditHistory ' + className + '" \
                fileId="' + full.id + '" file-name="' + data + '" title="' +
                data + '">' + data +
                '</a>';
            }
            return retVal;
          }
        },
        {
          'sTitle'  : 'File Owner Name',
          'mData'   : 'owner',
          'mRender' : function(data, type, full) {
            let owner = AppConstants.NOT_AVAILABLE;
            if (data && data.includes('\\')) {
              let ownerName = data.split('\\');
              owner = '<span title="' + data + '">' +
                ownerName[1] + '</span>';
            } else {
              let ownerName = data || AppConstants.NOT_AVAILABLE;
              owner = '<span title="' + ownerName + '">' +
                ownerName + '</span>';
            }
            return owner;
          }
        },
        {
          'sTitle'  : 'Share Name',
          'mData'   : 'share',
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
          'mData'   : 'parent',
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
          'mData'   : 'last_event',
          'sWidth'  : '10%',
          'mRender' : function(data, type, full) {
            let operationName = data.operation ?
              (AppConstants.OPERATION[data.operation] || data.operation) :
              AppConstants.NOT_AVAILABLE;
            return '<span title="' + operationName + '">' +
              operationName + '</span>';
          }
        },
        {
          'sTitle'  : 'Last Operation By',
          'mData'   : 'last_event',
          'sWidth'  : '12%',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data && data.username && data.username.includes('\\')) {
              let username = data.username.split('\\');

              retVal = '<span title="' + data.username + '">' + username[1] +
                '</span>';
            } else {
              let display = data.username || AppConstants.NOT_AVAILABLE;
              retVal = '<span title="' + display + '">' + display + '</span>';
            }
            return retVal;
          }
        },
        {
          'sTitle'  : 'Last Operation date',
          'mData'   : 'last_event',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data && data.modified_date) {
              let dateFormat = TimeUtil.formatDate(data.modified_date);
              retVal = '<span title="' + dateFormat + '">' +
                dateFormat +
                '</span>';
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
            let disabled = '';
            // If file operation is not present or is 'NA' or file name
            // is not present, fade out the text.
            if (!full.last_event.operation ||
              full.last_event.operation === AppConstants.NOT_AVAILABLE) {
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

      // If file operation is not present or is 'NA' i.e. file is coming from
      // full scan so no events will be present for that file, then show tooltip
      if (!rowData.last_event.operation ||
        rowData.last_event.operation === AppConstants.NOT_AVAILABLE) {
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

      fileName = fileName ? fileName : targetName;
      fileId = fileId ? fileId : targetId;
      action = action || AppConstants.AUDIT_ACTION;
      if(!fileName) {
        return;
      }
      options.title = 'Audit Details For: /' + fileName;
      options.type = action;
      options.fileName = fileName;
      options.fileId = fileId;
      options.actionTarget = AppConstants.ENTITY_FILE_AUDIT_HISTORY;
      WizardManager.handleAction(options);
    }
  });

  return FileSearchTableView;
});
