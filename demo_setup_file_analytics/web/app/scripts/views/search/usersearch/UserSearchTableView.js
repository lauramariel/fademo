//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// UserSearchTableView views the table with
// the user search results.
//
define([
  // Core
  'views/base/BaseTableView',
  // Managers
  'managers/WizardManager',
  // Utils
  'utils/TimeUtil',
  'utils/AppConstants',
  'utils/CommonTemplates',
  'utils/FilesUtil',
  // Collections
  'collections/usersearch/UserSearchCollection'],
function(
  // Core
  BaseTableView,
  WizardManager,
  // Utils
  TimeUtil,
  AppConstants,
  CommonTemplates,
  FilesUtil,
  // Collections
  UserSearchCollection) {
  'use strict';

  var UserSearchTableView = BaseTableView.extend({
    // Object having the file paths
    filePaths: {},

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.filePaths = {};
      this.defaultMinRows = options.defaultMinRows;
      this.model = new UserSearchCollection();
      this.setUrlParams(options.searchVal, 0);
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

    // @override
    // Sets the parameter to create the URL.
    setUrlParams: function(searchVal) {
      this.model.getURL(searchVal, this.defaultMinRows);
    },

    // @override
    getDefaultColumns: function() {
      let retArray = [
        // Name
        {
          'sTitle'  : 'User Name',
          'mData'   : 'name',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data) {
              let userName = AppConstants.NOT_AVAILABLE;
              if (full.domain) {
                userName = full.domain + '\\' + data;
              } else {
                userName = data;
              }
              retVal = '<a title="' + userName +
              '" class="auditHistory" userId="' + full.id +
              '" user-name="' + userName + '">' + data + '</a>';
            }
            return retVal;
          }
        },
        {
          'sTitle'  : 'Domain',
          'mData'   : 'domain',
          'sWidth'  : '12%',
          'mRender' : function(data, type, full) {
            let domain = data || AppConstants.NOT_AVAILABLE;
            return '<span title="' + domain + '">' + domain + '</span>';
          }
        },
        {
          'sTitle'  : 'Last Operation',
          'mData'   : 'last_event',
          'sWidth'  : '15%',
          'mRender' : function(data, type, full) {
            let operationName = data.operation ?
              (AppConstants.OPERATION[data.operation] || data.operation) :
              AppConstants.NOT_AVAILABLE;
            return '<span title="' + operationName + '">' +
              operationName + '</span>';
          }
        },
        {
          'sTitle'  : 'Last Operation On <span class="headerTooltip"></span>',
          'mData'   : 'last_event',
          'sWidth'  : '21%',
          'tmplHover' : CommonTemplates.POPOVER_TEMPLATE,
          'mRender' : function(data, type, full) {
            let _this = this,
                tooltipHTML = 'Hover over each entity for \
                  the complete file path';

            let retVal = AppConstants.NOT_AVAILABLE, id = 'id';

            // Adding tooltip on hover of the '?' symbol in the column head.
            $('.headerTooltip').nutanixMoreInfo({
              html: true,
              title: tooltipHTML,
              placement: 'right',
              container: 'body',
              renderMethod: 'append',
              template  : '<div class="tooltip">' +
                            '<div class="tooltip-arrow"></div>' +
                            '<div class="tooltip-inner"></div>' +
                          '</div>',
              classes: ['qtip']
            });

            if (data) {
              id = data.id;
              if ((data.parent && data.parent !== AppConstants.ROOT_FOLDER)
                && data.filename) {
                // If parent folder exists
                retVal = '/' + data.parent + '/' + data.filename;
              } else if (((data.parent === AppConstants.ROOT_FOLDER) ||
                !(data.parent)) && data.filename) {
                // If parent folder is a root folder
                retVal = '/' + data.filename;
              } else if (!(data.filename) && data.parent) {
                if (data.parent === AppConstants.ROOT_FOLDER) {
                  retVal = data.parent;
                } else {
                  retVal = '/' + data.parent + '/';
                }
              }
            }

            return '<span class="inline-popover" actionTargetFile = ' + id +
              ' data-toggle="popover">' + retVal + '</span>';
          }
        },
        {
          'sTitle'  : 'Share Name',
          'mData'   : 'last_event',
          'sWidth'  : '12%',
          'mRender' : function(data, type, full) {
            if (data && data.share) {
              return '<span title="' + data.share + '">' +
                data.share + '</span>';
            }
            return AppConstants.NOT_AVAILABLE;
          }
        },
        {
          'sTitle'  : 'Operation Date',
          'mData'   : 'last_event',
          'sWidth'  : '15%',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data && data.event_date) {
              let dateFormat = TimeUtil.formatDate(data.event_date);
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
          'mRender' : function(data, type, full) {
            let targetName = AppConstants.NOT_AVAILABLE,
                targetId = full.id;
            if (data) {
              if (full.domain) {
                targetName = full.domain + '\\' + data;
              } else {
                targetName = data;
              }
            }
            return CommonTemplates.SEARCH_ACTION_ITEM({
              dataToggle: '',
              targetId: targetId,
              targetName: targetName,
              auditAction: 'View Audit',
              // permissionAction: 'View Permissions',
              className: ''
            });
          }
        }];
      return retArray;
    },

    // @private
    // Return the file path of the file corresponding to file id.
    getFilePath: async function(e) {
      const currentTarget = $(e.currentTarget).find('[data-toggle="popover"]');
      let _this = this,
          fileTmpl = '',
          fileId = currentTarget.attr('actionTargetFile'),
          filePathTemplate = _.template('<span><%= path %></span>'),
          popOverId = $('div#' + currentTarget.attr('aria-describedby') +
            ' .n-details-table-tip');

      if (this.filePaths.hasOwnProperty(fileId)) {
        // If ID exists in the local object, no need to hit the API again.
        // The tooltip text template.
        fileTmpl = filePathTemplate({
          path: _this.filePaths[fileId]
        });
        $(popOverId).html(fileTmpl);
      } else {
        // If ID doesn't exist, hit the API to get the file path.
        const path = await FilesUtil.getFilePath(fileId);

        // The tooltip text template.
        fileTmpl = filePathTemplate({
          path: path
        });

        // Store it in the local object.
        _this.filePaths[fileId] = path;

        // Update the path in the tooltip on success.
        $(popOverId).html(fileTmpl);
      }
    },

    // @override
    // Overriding it to get the placement on the right
    // Returns the Hover placement for the column
    // @return hover over placement - top, bottom, left, right
    getHoverPlacement: function(column) {
      return 'right';
    },

    // @override
    // Returns the hover title for the column.
    // @param column - column
    // @return       - '' by default always
    getHoverTitle: function(column) {
      return '';
    },

    // @override
    // Returns the file path when mouse enters the element.
    onPopoverCellMouseEnter: async function(e) {
      BaseTableView.prototype.onPopoverCellMouseEnter.call(this, e);
      await this.getFilePath(e);
      this.resetPopoverArrowPosition();
    },

    // @private
    // Show user details in popup
    handleAuditHistoryClick: function(e) {
      let userName = this.$(e.currentTarget).attr('user-name'),
          userId = this.$(e.currentTarget).attr('userId'),
          action = this.$(e.currentTarget).attr('action'),
          targetName = this.$(e.currentTarget).parent('span')
            .attr('action-target-name'),
          targetId = this.$(e.currentTarget).parent('span')
            .attr('action-target-id'),
          options = {};

      userName = userName || targetName;
      userId = userId || targetId;
      action = action || AppConstants.AUDIT_ACTION;

      if (!userName || !userId) {
        return;
      }

      options.title = 'Audit Details For: ' + userName;
      options.type = action;
      options.userId = userId;
      options.userName = userName;
      options.actionTarget = AppConstants.ENTITY_USER_AUDIT_HISTORY;
      WizardManager.handleAction(options);
    }
  });

  return UserSearchTableView;
});
