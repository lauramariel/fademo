//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TopViolatingUsersTableView enables the user to view the table with
// the top 5 violating users.
//
define([
  // Views
  'views/base/BasePaginateTableView',
  'views/anomalyscreen/TopViolatingUsersChartView',
  'views/base/DataTableTemplates',
  // Managers
  'managers/WizardManager',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Collections
  'collections/alertdashboard/AlertDashboardCollection'],
function(
  // Views
  BasePaginateTableView,
  TopViolatingUsersChartView,
  DataTableTemplates,
  // Managers
  WizardManager,
  // Utils
  AppConstants,
  AppUtil,
  // Collections
  AlertDashboardCollection) {
  'use strict';

  var TopViolatingUsersTableView = BasePaginateTableView.extend({

    // The model for the view.
    model: null,

    // Total count of anomalies.
    totalVal: 0,

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new AlertDashboardCollection();
      this.model.getURL(AppConstants.ANOMALY_DETAIL_TYPES.TOP_USERS,
        options.startTimeInMs, options.endTimeInMs, options.count);
      BasePaginateTableView.prototype.initialize.call(this, options);
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
      let _this = this;
      var retArray = [
        // Name
        {
          'sTitle'  : 'User Name',
          'mData'   : 'key',
          'sWidth'  : '43%',
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;
            if (data) {
              let user = data.split('\\');
              // if in domain/username, domain is empty then page should render
              // in case of only username.
              let userVal = '',
                  userTempl = _.template('<a title="' + data +
                    '"class="auditHistory" userId="' + full.id +
                    '" user-name="' + data + '"><%= userVal %></a>');

              if (user.length > 1) {
                // If domain name is present, consider just the name.
                userVal = user[1];
              } else {
                // If domain is not present.
                userVal = user[0];
              }
              // User template
              retVal = userTempl({
                userVal: userVal
              });
            }

            return retVal;
          }
        },
        {
          'sTitle'  : 'Count',
          'mData'   : 'doc_count',
          'bSearchable' : true,
          'sWidth' : '10%',
          'sType'   : 'numeric',
          'mRender' : function(data, type, full) {
            return '<span title="' + data + '" >' +
              AppUtil.formatSize(data) + '</span>';
          }
        },
        {
          'mData'   : 'doc_count',
          'bSortable': false,
          'mRender' : function(data, type, full) {
            let entityType = AppConstants.SHOW_TOP_VIOLATING_USERS;
            if (!_this.totalVal) {
              _.each(_this.model.models, function(val) {
                _this.totalVal += val.attributes.doc_count;
              });
            }
            let userClass = full.id ||
              AppUtil.removeSpaces(AppUtil.removeSpecialCharacters(full.id));
            // Added different class to topUserChart in more records
            // popup to avoid  appending duplicate chart in
            // dashboard widget.
            if (viewType === AppConstants.MORE_RECORD_POPUP_VIEW) {
              userClass = userClass + 'MoreRecord';
            }
            let templ = '<div class="topViolatingUserChart' + userClass +
              ' top-user-chart"></div>';
            let topUsersChart = new TopViolatingUsersChartView({
              entityType : entityType,
              data       : full,
              totalValue : _this.totalVal
            });
            _this.$('.topViolatingUserChart' + userClass).html(
              topUsersChart.render().el);
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

    // @private
    // Show user details in popup
    handleAuditHistoryClick: function(e) {
      let userName = this.$(e.currentTarget).attr('user-name'),
          userId = this.$(e.currentTarget).attr('userId'),
          action = this.$(e.currentTarget).attr('action'),
          options = {};

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
          morePopupLink: 'topViolatingUserResultsPopupLink'
        }));
      }
    }
  });

  return TopViolatingUsersTableView;
});
