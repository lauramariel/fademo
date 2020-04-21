//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TopUserTableView enables the user to view the table with
// the top 5 active users.
//
define([
  // Views
  'views/base/BasePaginateTableView',
  'views/dashboard/TopUserChartView',
  'views/base/DataTableTemplates',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Managers
  'managers/WizardManager',
  // Collections
  'collections/usersearch/UserSearchCollection'],
function(
  // Views
  BasePaginateTableView,
  TopUserChartView,
  DataTableTemplates,
  // Utils
  AppConstants,
  AppUtil,
  // Managers
  WizardManager,
  // Collections
  UserSearchCollection) {
  'use strict';

  var TopUserTableView = BasePaginateTableView.extend({

    // The model for the view.
    model: null,

    totalVal: 0,

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new UserSearchCollection();
      this.model.getTopResultUrl(options.startTimeInMs,
        options.endTimeInMs, options.count);
      BasePaginateTableView.prototype.initialize.call(this, options);
    },

    // @private
    // Fetch data
    fetchModel: function() {
      const options = {
        data: this.model.getRequestPayload(),
        type: 'POST'
      };
      BasePaginateTableView.prototype.fetchModel.call(this, options);
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
      let startTimeInMs = this.options.startTimeInMs;
      let endTimeInMs = this.options.endTimeInMs;
      let viewType = this.options.viewType;
      let _this = this;
      var retArray = [
        // Name
        {
          'sTitle'  : 'User Name',
          'sWidth'  : '43%',
          'mData'   : 'name',
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
          'sWidth'  : '10%',
          'mData'   : 'log_count',
          'mRender' : function(data, type, full) {
           return '<span title="' + data + '" >' +
              AppUtil.formatSize(data) + '</span>';
          }
        },
        {
          'mData'   : 'log_count',
          'bSortable': false,
          'mRender' : function(data, type, full) {
            let entityType = AppConstants.SHOW_TOP_ACTIVE_USERS;
            if (!_this.totalVal) {
              _.each(_this.model.models, function(val) {
                _this.totalVal += val.attributes.log_count;
              });
            }
            let userClass = full.id ||
              AppUtil.removeSpaces(AppUtil.removeSpecialCharacters(full.id));
            // Added different class to topUsersChart in more records
            // popup to avoid  appending duplicate chart in
            // dashboard widget.
            if (viewType === AppConstants.MORE_RECORD_POPUP_VIEW) {
              userClass = userClass + 'MoreRecord';
            }
            let templ = '<div class="topUserChart' + userClass +
              ' top-user-chart"></div>';
            let topUsersChart = new TopUserChartView({
              entityType   : entityType,
              startTimeInMs: startTimeInMs,
              endTimeInMs  : endTimeInMs,
              data         : full,
              totalValue   : _this.totalVal
            });
            _this.$('.topUserChart' + userClass).html(
              topUsersChart.render().el);
            return templ;
          }
        }
      ];

      return retArray;
    },

    // @private
    // Handle rows(users) clicked and show user details in popup
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
          morePopupLink: 'topUserResultsPopupLink'
        }));
      }
    }
  });

  return TopUserTableView;
});
