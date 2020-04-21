//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AlertNotificationView shows the notification widget content
// on the dashboard.
//
define([
  // Core
  'views/base/BaseView',
  'views/base/DataTableTemplates',
  // Utils
  'utils/CommonTemplates',
  'utils/AppConstants',
  'utils/AntiscrollUtil',
  'utils/AppUtil',
  'utils/AjaxUtil',
  'utils/TimeUtil',
  'collections/dashboard/AlertNotificationCollection'],
function(
  // Core
  BaseView,
  DataTableTemplates,
  // Utils
  CommonTemplates,
  AppConstants,
  AntiscrollUtil,
  AppUtil,
  AjaxUtil,
  TimeUtil,
  AlertNotificationCollection) {

  'use strict';

  var AlertNotificationView = BaseView.extend({
    model: null,

    LIST_CONTAINER: _.template(
      '<ul class="n-list"><%= content %></ul>'),

    LIST_ROW: _.template(
      '<li class="n-item-row"  \
           <%= attrs %> >  \
        <div class="n-item-title<%= isBlink ? " n-blink" : "" %>">  \
          <%= title %>  \
        </div>  \
        <div class="n-elapsed-time">  \
          <%= elapsed %> \
        </div>  \
      </li>'),

    // @override
    initialize: function(options) {
      this.model = new AlertNotificationCollection();
      this.fetchAnomalyNotification();
    },

    // @private
    // Fetch the anomaly notification widget data.
    fetchAnomalyNotification: function() {
      let _this = this;
      this.model.getURL();
      this.showLoading();
      this.model.fetch({
        success: function(data) {
          if (data && Object.keys(data.toJSON()).length) {
            // If data is present.
            _this.renderAlerts(data.toJSON());
          } else {
            // Else show no data.
            _this.showNoDataAvailable();
          }
          _this.hideLoading();
        },
        error: function(model, xhr) {
          _this.showError(xhr);
        }
      });
    },

    // @private
    // Construct the message to be displayed on the widget.
    // @param data - data to be used to construct the message.
    constructMessage: function(data) {
      let title = '';

      // Interval configured for anomaly detection.
      let timeInterval = '<span class="n-elapsed-time">(From ' +
        TimeUtil.formatDate(data[this.model.DP.FSLOG_PERIOD_START]) + ' to ' +
        TimeUtil.formatDate(data[this.model.DP.FSLOG_PERIOD_END]) + ')</span>';

      if (data[this.model.DP.PER_USER]) {
        // If configuration is according to per user
        title = 'User ' + this.getUserName(data) + ' has' +
          this.constructOperationName(data[this.model.DP.OPERATION_NAME]) +
          data[this.model.DP.OPERATION_COUNT] + ' document(s) ' + timeInterval
          + '.';
      } else {
        // If configuration is for all users
        title = 'Multiple users ' + this.constructOperationName(
          data[this.model.DP.OPERATION_NAME]) +
          data[this.model.DP.OPERATION_COUNT] + ' document(s) ' + timeInterval +
          '.';
      }

      return title;
    },

    // @private
    // Get the user name from the input.
    // @param data - data used to get user name.
    getUserName: function(data) {
      let userName = '';
      if (data.user && data.user.length) {
        userName = data.user[0].username;
      }

      return userName;
    },

    // @private
    // Format the name of the operation required to be shown in the message.
    // @param name - name of the operation.
    constructOperationName: function(name) {
      let operationName = '';

      switch(name) {
        case AppConstants.ANOMALY_OPERATIONS_VALUE.Create:
          operationName = ' created ';
          break;
        case AppConstants.ANOMALY_OPERATIONS_VALUE.Delete:
          operationName = ' deleted ';
          break;
        case AppConstants.ANOMALY_OPERATIONS_VALUE.SecurityChange:
          operationName = ' changed the permission for ';
          break;
        case AppConstants.ANOMALY_OPERATIONS_VALUE.PermissionDenied:
          operationName = ' have permission denials for ';
          break;
        default:
          operationName = ' performed ' + name + ' operation on ';
      }

      return operationName;
    },

    // @private
    // Render the alert messages in the widget.
    renderAlerts: function() {
      let data = this.model.toJSON();
      let rowContent = '', title = '';
      let timeMessage = '';
      for (let i = 0; i < Object.keys(data).length; i++) {
        timeMessage = 'Alert created time : ' +
          new Date(data[i].execution_time);

        // Content of the message.
        title = this.constructMessage(data[i]);
        rowContent += this.LIST_ROW({
          attrs: '',
          isBlink: '',
          title: title,
          elapsed: timeMessage
        });
      }

      let html = this.LIST_CONTAINER({
        content: rowContent
      });
      this.updateColumnContent(this.options.widget, html , true);
    },

    // @private
    // Show the error on the widget.
    // @param xhr - the error object.
    showError: function(xhr) {
      // Hide the loading
      this.hideLoading();
      // Show the error message and details (remove the HTML tags)
      var errorDetails = '';
      // If there is a status code of 0 (meaning unable to connect to
      // server), there is no message so we have to provide our own.
      if (AppUtil.isConnectionError(xhr)) {
        errorDetails = 'Unable to connect to the server.';
      } else if (AppUtil.isHttp404Error(xhr)) {
        errorDetails = 'Requested resource not available';
      } else {
        errorDetails = (
            AjaxUtil.processAjaxError(xhr.responseText) || '')
              .replace(/(<([^>]+)>)/ig, '');
      }
      $('.anomaly-notification .n-content').html(DataTableTemplates.ERROR({
        errorDetails :  errorDetails
      }));
    },

    // Updates the column content
    // @param $el - jQuery DOM element containing the table columns.
    // @param content - the HTML content in string format
    // @param applyAntiScroll - boolean to apply antiscroll
    updateColumnContent: function($el, content ,applyAntiScroll) {
      let $col = $el.find('.n-column-content');
      // Check for antiScroll
      if (applyAntiScroll) {
        // Check if antiscroll template has been added
        if (!$col.find('.n-content-inner').length) {
          $col.html(CommonTemplates.ANTISCROLL);
        }

        $('.' + this.options.className + ' .n-column-content .box-inner')
          .height($('.anomaly-notification .n-content').height());

        // Add the centerbox
        let contentNew = CommonTemplates.CONTENT_COLUMN_CELL_CENTERBOX({
          content : content
        });

        $col.find('.n-content-inner').html(contentNew);
        AntiscrollUtil.applyAntiScroll($el.find('.antiscroll-wrap'));
      } else {
        $col.html(content);
      }
    },
  });

  return AlertNotificationView;
});
