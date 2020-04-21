//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TopFileTableView views the table with
// the top 5 accessed files.
//
define([
  // Views
  'views/base/BasePaginateTableView',
  'views/dashboard/TopFileChartView',
  'views/base/DataTableTemplates',
  // Managers
  'managers/WizardManager',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/CommonTemplates',
  // Models
  'models/filesearch/FileSearchModel',
  // Collections
  'collections/filesearch/FileSearchCollection'],
function(
  // Views
  BasePaginateTableView,
  TopFileChartView,
  DataTableTemplates,
  // Managers
  WizardManager,
  // Utils
  AppConstants,
  AppUtil,
  CommonTemplates,
  // Models
  FileSearchModel,
  // Collections
  FileSearchCollection) {
  'use strict';

  var TopFileTableView = BasePaginateTableView.extend({

    // The model for the view.
    model: null,

    totalVal: 0,

    // Object having the file paths
    filePaths: {},

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
      this.remove();
      this.filePaths = {};
      this.model = new FileSearchCollection();
      this.model.getTopResultUrl(options.startTimeInMs,
        options.endTimeInMs, options.count, AppConstants.ACCESS_OPERATIONS);
      BasePaginateTableView.prototype.initialize.call(this, options);

      // Enable popover on cell hover for this table
      this.enablePopoverOnHover();

      // File model
      this.fileModel = new FileSearchModel();
    },

    // @override
    // Render sub-views and remove unwanted view from DOM
    renderSubViews: function() {
      BasePaginateTableView.prototype.renderSubViews.call(this);
      if (this.options.viewType !== AppConstants.MORE_RECORD_POPUP_VIEW) {
        this.$('.n-header').remove();
      } else {
        this.customiseTableHeader();
      }
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      let startTimeInMs = this.options.startTimeInMs,
          endTimeInMs = this.options.endTimeInMs,
          viewType = this.options.viewType,
          _this = this;

      let retArray = [
        // Name
        {
          'sTitle'  : 'File Name',
          'mData'   : 'name',
          'sWidth' : '43%',
          'tmplHover' : CommonTemplates.POPOVER_TEMPLATE,
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data) {
              retVal = '<a data-toggle="popover" class="auditHistory \
                inline-popover" \
                fileId="' + full.id + '" file-name="' + data +
                '" isDeleted="' + !full.is_active + '">' + data + '</a>';
            }

            return retVal;
          }
        },
        {
          'sTitle'  : 'Count',
          'mData'   : 'log_count',
          'sWidth' : '10%',
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            return '<span title="' + data + '" >' +
              AppUtil.formatSize(data) + '</span>';
          }
        },
        {
          'mData'   : 'log_count',
          'bSortable': false,
          'sWidth': '45%',
          'mRender' : function(data, type, full) {
            let entityType = AppConstants.SHOW_TOP_ACCESSED_FILES;
            if (!_this.totalVal) {
              _.each(_this.model.models, function(val) {
                _this.totalVal += val.attributes.log_count;
              });
            }

            let fileClass = full.id ||
              AppUtil.removeSpaces(AppUtil.removeSpecialCharacters(full.id));
            // Added different class to topFileChart in more records
            // popup to avoid  appending duplicate chart in
            // dashboard widget.
            if (viewType === AppConstants.MORE_RECORD_POPUP_VIEW) {
              fileClass = fileClass + 'MoreRecord';
            }
            let templ = '<div class="topFileChart' + fileClass
              + ' top-file-chart"></div>';
            let topFileChart = new TopFileChartView({
              entityType   : entityType,
              startTimeInMs: startTimeInMs,
              endTimeInMs  : endTimeInMs,
              data         : full,
              totalValue   : _this.totalVal
            });
            _this.$('.topFileChart' + fileClass).html(
              topFileChart.render().el);
            return templ;
          }
        }
        ];

      return retArray;
    },

    // @override
    // Returns the hover title for the column.
    // @param column - column
    // @return       - '' by default always
    getHoverTitle: function(column) {
      return '';
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
      BasePaginateTableView.prototype.onPopoverCellMouseEnter.call(this, e);
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
    // Construct file path template for the tooltip.
    constructFilePath: function(isDeleted, path, popOverId) {
      let filePathTemplate = _.template('<div><%= deleted %><%= path %></div>'),
          deleteText = '';
      // If ID exists in the local object, no need to hit the API again.
      if (isDeleted === 'true') {
        deleteText = '<b>Deleted File: </b>';
      }

      // The tooltip template.
      let fileTmpl = filePathTemplate({
        deleted: deleteText,
        path: path
      });

      // Render the html template in the tooltip element.
      $(popOverId).html(fileTmpl);
    },

    // @private
    // Return the file path of the file corresponding to file id.
    getFilePath: function(e) {
      const currentTarget = $(e.currentTarget).find('[data-toggle="popover"]');
      let _this = this,
          fileId = currentTarget.attr('fileId'),
          isDeleted = currentTarget.attr('isDeleted'),
          popOverId = $('div#' + currentTarget.attr('aria-describedby') +
            ' .n-details-table-tip');

      if (this.filePaths.hasOwnProperty(fileId)) {
        // Construct file path template for the tooltip.
        this.constructFilePath(isDeleted, this.filePaths[fileId], popOverId);
      } else {
        // If ID doesn't exist, hit the API to get the file path.
        this.fileModel.getFilePathURL(fileId);
        this.fileModel.fetch({
          success: function(data) {
            if (data && data.attributes.path) {
              // Store it in the local object.
              _this.filePaths[fileId] = data.attributes.path;
              // Construct file path template for the tooltip.
              _this.constructFilePath(isDeleted, data.attributes.path,
                popOverId);
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

    // @private
    // Handle files click and open it in a popup
    handleAuditHistoryClick: function(e) {
      let fileId = this.$(e.currentTarget).attr('fileId'),
          fileName = this.$(e.currentTarget).attr('file-name'),
          action = this.$(e.currentTarget).attr('action'),
          targetName = this.$(e.currentTarget).parent('span')
            .attr('action-target'),
          options = {};

      fileName = fileName ? fileName : targetName;
      action = action || AppConstants.AUDIT_ACTION;
      if (!fileId) {
        return;
      }
      options.title = 'Audit Details For: /' + fileName;
      options.type = action;
      options.fileId = fileId;
      options.fileName = fileName;
      options.actionTarget = AppConstants.ENTITY_FILE_AUDIT_HISTORY;
      WizardManager.handleAction(options);
    },

    // @override
    // Drawing of the table is complete.
    onDrawCallback: function(oSettings) {
      BasePaginateTableView.prototype.onDrawCallback.apply(this, arguments);
      // Show header in popup view only and remove form the dashboard
      // widget.
      if (this.options.viewType !== AppConstants.MORE_RECORD_POPUP_VIEW) {
        this.$('thead').remove();
      }
    },

    // Add more link template if sum of all log count values is
    // more than total metadata count
    onActionSuccess : function() {
      // Add total result count to popup view
      // BaseTableView uses _metadata.total to display total results and
      // calculate pagination internally.
      if (this.options.viewType === AppConstants.MORE_RECORD_POPUP_VIEW) {
        this.model._metadata.total = this.model._metadata.count;
      }
      BasePaginateTableView.prototype.onActionSuccess.apply(this, arguments);
      const totalCount = _.reduce(this.model.toJSON(), function(key, model) {
        return model.log_count + key;
      }, 0);
      if (this.model._metadata.total > totalCount &&
        this.$el.parent().hasClass('dashboard-tables')) {
        this.$el.append(_.template(DataTableTemplates.MORE_ELEMENT_POPUP, {
          morePopupLink: 'topFileResultsPopupLink'
        }));
      }
    }
  });

  return TopFileTableView;
});
