//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TopContributingFoldersTableView enables the user to view the table with
// the top 5 contributing folders.
//
define([
  // Views
  'views/base/BasePaginateTableView',
  'views/anomalyscreen/TopContributingFoldersChartView',
  'views/base/DataTableTemplates',
  // Managers
  'managers/WizardManager',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  'utils/CommonTemplates',
  // Models/Collections
  'collections/alertdashboard/AlertDashboardCollection',
  'models/alertdashboard/AlertDashboardModel',
  'models/filesearch/FileSearchModel'],
function(
  // Views
  BasePaginateTableView,
  TopContributingFoldersChartView,
  DataTableTemplates,
  // Managers
  WizardManager,
  // Utils
  AppConstants,
  AppUtil,
  CommonTemplates,
  // Models/Collections
  AlertDashboardCollection,
  AlertDashboardModel,
  FileSearchModel) {
  'use strict';

  var TopContributingFoldersTableView = BasePaginateTableView.extend({

    // The model for the view.
    model: null,

    // Total count of anomalies.
    totalVal: 0,

    // Object having the folder paths
    folderPaths: {},

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
      this.folderPaths = {};
      this.model = new AlertDashboardCollection();
      this.model.getURL(AppConstants.ANOMALY_DETAIL_TYPES.TOP_FOLDERS,
        options.startTimeInMs, options.endTimeInMs, options.count);
      BasePaginateTableView.prototype.initialize.call(this, options);

      // Enable popover on cell hover for this table
      this.enablePopoverOnHover();

      // File model
      this.fileModel = new FileSearchModel();
    },

    // @override
    // Remove DOM elements that are not required
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
      let viewType = this.options.viewType;
      const _this = this;
      var retArray = [
        // Name
        {
          'sTitle'  : 'Folder Name',
          'mData'   : AlertDashboardModel.DP.KEY,
          'sWidth'  : '43%',
          'tmplHover' : CommonTemplates.POPOVER_TEMPLATE,
          'mRender' : function(data, type, full) {
            const folderName = data || AppConstants.NOT_AVAILABLE;
            let retVal = '<span title="' + folderName + '">' + folderName
                  + '</span>';
            if (data) {
              const isTld = full[AlertDashboardModel.DP.IS_TLD] || '';

              let className = 'auditHistory';
              if (isTld) {
                className = 'not-active';
              }
              retVal = '<a data-toggle="popover" class="' + className +
                ' inline-popover" \
                folderId="' + full[AlertDashboardModel.DP.ID] +
                '" isTld="' + isTld +
                '" folderName="' + folderName + '">' +
                folderName + '</a>';
            }

            return retVal;
          }
        },
        {
          'sTitle'  : 'Count',
          'mData'   : AlertDashboardModel.DP.DOC_COUNT,
          'sWidth'  : '10%',
          'mRender' : function(data, type, full) {
            return '<span title="' + data + '" >' +
              AppUtil.formatSize(data) + '</span>';
          }
        },
        {
          'mData'   : AlertDashboardModel.DP.DOC_COUNT,
          'bSearchable' : true,
          'bSortable': false,
          'mRender' : function(data, type, full) {
            let foldersArr = _this.model.toJSON(),
                keyToUse = foldersArr.findIndex(x => x.key === full.key) || 0;
            let entityType = AppConstants.SHOW_TOP_CONTRIBUTING_FOLDERS;
            if (!_this.totalVal) {
              _.each(_this.model.models, function(val) {
                _this.totalVal += val.attributes.doc_count;
              });
            }
            let fileClass =
              AppUtil.removeSpaces(AppUtil.removeSpecialCharacters(full.key)) +
                keyToUse + data;
            // Added different class to topFoldersChart in more records
            // popup to avoid  appending duplicate chart in
            // dashboard widget.
            if (viewType === AppConstants.MORE_RECORD_POPUP_VIEW) {
              fileClass = fileClass + 'MoreRecord';
            }
            let templ = '<div class="topContributingFoldersChart' + fileClass +
              ' top-file-chart"></div>';
            let topFoldersChart = new TopContributingFoldersChartView({
              entityType : entityType,
              data       : full,
              totalValue : _this.totalVal
            });
            _this.$('.topContributingFoldersChart' + fileClass).html(
              topFoldersChart.render().el);
            return templ;
          }
        }
      ];

      return retArray;
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

    // Add more link template if data count is more than 5
    onActionSuccess : function() {
      // Add total result count to popup view
      // BaseTableView uses _metadata.total to display total results and
      // calculate pagination internally.
      if (this.options.viewType === AppConstants.MORE_RECORD_POPUP_VIEW) {
        this.model._metadata.total = this.model._metadata.count;
      }
      BasePaginateTableView.prototype.onActionSuccess.apply(this, arguments);
      if (this.model._metadata.count === AppConstants.DEFAULT_CHUNK_COUNT &&
        this.$el.parent().hasClass('dashboard-tables')) {
        this.$el.append(_.template(DataTableTemplates.MORE_ELEMENT_POPUP, {
          morePopupLink: 'topContributingFoldersResultsPopupLink'
        }));
      }
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
      this.getFolderPath(e);
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
    // Return the folder path of the folder corresponding to folder id.
    getFolderPath: function(e) {
      const currentTarget = $(e.currentTarget).find('[data-toggle="popover"]');
      const _this = this,
            folderId = currentTarget.attr('folderId'),
            isTld = currentTarget.attr('isTld'),
            folderName = currentTarget.attr('folderName'),
            popOverId = $('div#' + currentTarget.attr('aria-describedby') +
              ' .n-details-table-tip');

      if (folderId && (this.folderPaths.hasOwnProperty(folderId) || isTld)) {
        // Construct folder path template for the tooltip.
        let folderPath = this.folderPaths[folderId];
        if (isTld) {
          folderPath = folderName + '/';
        }
        this.constructFilePath(folderPath, popOverId);
      } else if (folderId) {
        // If ID doesn't exist, hit the API to get the folder path.
        this.fileModel.getFilePathURL(folderId);
        this.fileModel.fetch({
          success: function(data) {
            if (data && data.attributes.path) {
              // Store it in the local object.
              _this.folderPaths[folderId] = data.attributes.path;
              // Construct folder path template for the tooltip.
              _this.constructFilePath(data.attributes.path,
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
    // Construct folder path template for the tooltip.
    constructFilePath: function(path, popOverId) {
      let folderPathTemplate = _.template('<div><%= path %></div>');

      // The tooltip template.
      const folderTmpl = folderPathTemplate({
        path: path
      });

      // Render the html template in the tooltip element.
      $(popOverId).html(folderTmpl);
    },

    // @private
    // Handle folder click and open it in a popup
    handleAuditHistoryClick: function(e) {
      let folderName = this.$(e.currentTarget).attr('folderName');
      const folderId = this.$(e.currentTarget).attr('folderId'),
            isTld = this.$(e.currentTarget).attr('isTld'),
            options = {};

      // Dont show audit history in case folder id is null or file is at share
      // level
      if (!folderId || isTld) {
        return;
      }

      folderName = folderName || AppConstants.NOT_AVAILABLE;
      options.title = 'Audit Details For: /' + folderName;
      options.type = AppConstants.AUDIT_ACTION;
      options.fileId = folderId;
      options.folderName = folderName;
      options.actionTarget = AppConstants.ENTITY_FILE_AUDIT_HISTORY;
      options.searchType = AppConstants.FILE_SEARCH_TYPE.DIRECTORY;
      WizardManager.handleAction(options);
    }
  });

  return TopContributingFoldersTableView;
});
