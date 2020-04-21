//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// UserMachineSearchTableView views the table with the IP search results.
//
define([
  // Core
  'views/base/BaseTableView',
  // Utils
  'utils/TimeUtil',
  'utils/AppConstants',
  'utils/CommonTemplates',
  // Models
  'models/filesearch/FileSearchModel',
  // Managers
  'managers/WizardManager',
  // Data
  'data/DataProperties',
  // Collections
  'collections/usermachinesearch/UserMachineSearchCollection'],
function(
  // Core
  BaseTableView,
  // Utils
  TimeUtil,
  AppConstants,
  CommonTemplates,
  // Models
  FileSearchModel,
  // Managers
  WizardManager,
  // Data
  DataProp,
  // Collections
  UserMachineSearchCollection) {
  'use strict';

  var UserMachineSearchTableView = BaseTableView.extend({
    // Object having the file paths
    filePaths: {},

    // Page id list, need to maintain in case pagination is handled using
    // next_page_id instead of standard page count
    PAGE_ID_LIST: [],

    // Hover mouse event for popover supports
    hoverMouseEvents: {
      'mouseenter .baseDataTable tbody tr td:has("[data-toggle=popover]")' :
        'onPopoverCellMouseEnter',
      'mouseleave  .baseDataTable tbody tr td:has("[data-toggle=popover]")' :
        'onPopoverCellMouseLeave'
    },

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.filePaths = {};
      this.defaultMinRows = options.defaultMinRows;
      this.model = new UserMachineSearchCollection();
      this.setUrlParams(options.searchVal, 0);
      BaseTableView.prototype.initialize.call(this, options);
      this.PAGE_ID_LIST = [];

      // Enable popover on cell hover for this table
      this.enablePopoverOnHover();

      // File model
      this.fileModel = new FileSearchModel();
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
    // Fetch data
    fetchModel: function(options) {
      const _this = this;
      const params = {
        data: this.model.getRequestPayload(),
        type: 'POST'
      };
      params.data = (options && options.data.length) ?
        _.extend(params.data, options.data[0]) : params.data;
      BaseTableView.prototype.fetchModel.call(this, params);
    },

    // @override
    // Fetch data, used for getting data for next page
    refreshData: function() {
      let _this = this,
          modelData = this.model.models;

      // Get meta data and update the new url with next batch id
      const modelMetaData = this.model.getMetaData();
      if (Object.keys(modelMetaData).length &&
        modelMetaData[DataProp.NEXT_BATCH_ID]) {
        // Check if next batch id is already in the list or not
        // if in the list dont push else push
        let indexOfNextBatchId =
          this.PAGE_ID_LIST.indexOf(modelMetaData[DataProp.NEXT_BATCH_ID]);
        if (indexOfNextBatchId < 0) {
          this.PAGE_ID_LIST.push(modelMetaData[DataProp.NEXT_BATCH_ID]);
        }
        this.model.updateSearchUrl(this.PAGE_ID_LIST[this.currentPage - 1],
          _this.defaultMinRows);
      }

      const options = {
        data: this.model.getRequestPayload(),
        type: 'POST'
      };
      BaseTableView.prototype.refreshData.call(this, options);
    },

    // @override
    // Sets the parameter to create the URL.
    setUrlParams: function(searchVal) {
      this.model.getURL(searchVal, this.defaultMinRows);
    },

    // @override
    getDefaultColumns: function() {
      let retArray = [
        {
          'sTitle'  : 'Client IP',
          'sWidth'  : '15%',
          'mData'   : 'machine_name',
          'mRender' : function(data, type, full) {
            let ipTempl = _.template('<a title="' + data +
                    '"class="auditHistory"' +
                    '" machineName="' + data + '">' + data + '</a>');
            return ipTempl;
          }
        },
        {
          'sTitle'  : 'User Name',
          'mData'   : 'user_name',
          'sWidth'  : '10%',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data) {
              let user = data.split('\\');
              // if in domain/username, domain is empty then page should render
              // in case of only username.
              if (user.length > 1) {
                // If domain name is present, consider just the name.
                retVal = user[1];
              } else {
                // If domain is not present.
                retVal = user[0];
              }
            }
            return '<span title="' + retVal + '">' + retVal + '</span>';
          }
        },
        {
          'sTitle'  : 'Domain',
          'mData'   : 'user_name',
          'sWidth'  : '10%',
          'mRender' : function(data, type, full) {
            let domain = data.split('\\')[0] || AppConstants.NOT_AVAILABLE;
            return '<span title="' + domain + '">' + domain + '</span>';
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
          'sTitle'  : 'Last Operation On <span class="headerTooltip"></span>',
          'mData'   : 'last_event',
          'sWidth'  : '20%',
          'tmplHover' : CommonTemplates.POPOVER_TEMPLATE,
          'mRender' : function(data, type, full) {
            let tooltipHTML = 'Hover over each entity for \
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
          'sWidth'  : '10%',
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
          'mData'   : 'machine_name',
          'sWidth'  : '10%',
          'bSortable': false,
          'mRender' : function(data, type, full) {
            return CommonTemplates.SEARCH_ACTION_ITEM({
              dataToggle: '',
              targetId: data,
              targetName: data,
              auditAction: 'View Audit',
              className: ''
            });
          }
        }];
      return retArray;
    },

    // @private
    // Return the file path of the file corresponding to file id.
    getFilePath: function(e) {
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
        this.fileModel.getFilePathURL(fileId);
        this.fileModel.fetch({
          success: function(data) {
            if (data && data.attributes.path) {
              // The tooltip text template.
              fileTmpl = filePathTemplate({
                path: data.attributes.path
              });
              // Store it in the local object.
              _this.filePaths[fileId] = data.attributes.path;
              // Update the path in the tooltip on success.
              $(popOverId).html(fileTmpl);
            } else {
              $(popOverId).html('Path not available!');
            }
          },
          error: function(xhr) {
            // Throw generic error no matter what the error code is.
            $(popOverId).html('Path not available!');
          }
        });
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
    onPopoverCellMouseEnter: function(e) {
      BaseTableView.prototype.onPopoverCellMouseEnter.call(this, e);
      this.setPopoverArrowPosition();
      this.getFilePath(e);
    },

    // @private
    // Bring the arrow of tooltip at appropriate position
    setPopoverArrowPosition: function() {
      $('[data-toggle=popover]').on('shown.bs.popover', function() {
        if ($('.popover').height() > 40) {
          $('.popover .arrow').css('top', parseInt(20, 10) + 'px');
        }
      });
    },

    // @private
    // Show user details in popup
    handleAuditHistoryClick: function(e) {
      let machineName = this.$(e.currentTarget).attr('machineName'),
          machineId = this.$(e.currentTarget).attr('machineName'),
          action = this.$(e.currentTarget).attr('action'),
          targetName = this.$(e.currentTarget).parent('span')
            .attr('action-target-name'),
          targetId = this.$(e.currentTarget).parent('span')
            .attr('action-target-id'),
          options = {};

      machineName = machineName || targetName;
      machineId = machineId || targetId;
      action = action || AppConstants.AUDIT_ACTION;

      if (!machineName || !machineId) {
        return;
      }

      options.title = 'Audit Details For: ' + machineName;
      options.type = action;
      options.machineId = machineId;
      options.machineName = machineName;
      options.actionTarget = AppConstants.ENTITY_USER_MACHINE_AUDIT_HISTORY;
      WizardManager.handleAction(options);
    }
  });

  return UserMachineSearchTableView;
});
