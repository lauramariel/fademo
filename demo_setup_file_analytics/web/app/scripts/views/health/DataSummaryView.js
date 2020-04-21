//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// DataSummaryView gives the overall data summary of File analytics.
//
define([
  // Views
  'views/base/BaseView',
  // Utils
  'utils/CommonTemplates',
  'utils/AppUtil',
  'utils/AppConstants',
  // Models/Collections
  'models/health/HealthModel'],
function(
  // Views
  BaseView,
  // Utils
  CommonTemplates,
  AppUtil,
  AppConstants,
  // Models/Collections
  HealthModel) {
  'use strict';

  var DataSummaryView = BaseView.extend({

    // The model for the view.
    model: null,

    // Set view as widget
    isWidget: true,

    // @override
    modelEvents: {
      'change   model': 'render'
    },

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.parent = this.options.parent;
      this.model = this.parent.healthModel;
      // Update the widget when data in model changes
      this.delegateModelEvents();
      BaseView.prototype.initialize.call(this, options);
    },

    render: function() {

      // Clear previous widget display content
      if (!this.parent.clearWidget(this.options.classs, this.model, this)) {
        return;
      }

      const totalFiles = _.isNumber(this.model.get(HealthModel.DP.TOTAL_FILES))
        ? AppUtil.formatSize(this.model.get(HealthModel.DP.TOTAL_FILES)) :
        AppConstants.NOT_AVAILABLE;
      const totalFolders =
        _.isNumber(this.model.get(HealthModel.DP.TOTAL_FOLDERS))
          ? AppUtil.formatSize(this.model.get(HealthModel.DP.TOTAL_FOLDERS)) :
          AppConstants.NOT_AVAILABLE;
      const totalEvents =
        _.isNumber(this.model.get(HealthModel.DP.TOTAL_EVENTS)) ?
          AppUtil.formatSize(this.model.get(HealthModel.DP.TOTAL_EVENTS)) :
          AppConstants.NOT_AVAILABLE;
      const totalUsers =
        _.isNumber(this.model.get(HealthModel.DP.TOTAL_USERS)) ?
          AppUtil.formatSize(this.model.get(HealthModel.DP.TOTAL_USERS)) :
          AppConstants.NOT_AVAILABLE;

      // Update the documents label
      const docsTempl = CommonTemplates.LABEL_COLUMN({
        title      : totalFiles,
        subtitle   : 'File(s)',
        smallTitle : ''
      });
      this.parent.updateWidgetColumnContent(1, false, docsTempl,
        this.parent.getDOM('.' + this.options.classs));

      // Update the documents label
      const dirTempl = CommonTemplates.LABEL_COLUMN({
        title      : totalFolders,
        subtitle   : totalFolders > 1 ? 'Directories' : 'Directory',
        smallTitle : ''
      });
      this.parent.updateWidgetColumnContent(2, false, dirTempl,
        this.parent.getDOM('.' + this.options.classs));

      // Update the events label
      const eventsTempl = CommonTemplates.LABEL_COLUMN({
        title      : totalEvents,
        subtitle   : 'Event(s)',
        smallTitle : ''
      });
      this.parent.updateWidgetColumnContent(3, false, eventsTempl,
        this.parent.getDOM('.' + this.options.classs));

      // Update the users label
      const usersTempl = CommonTemplates.LABEL_COLUMN({
        title      : totalUsers,
        subtitle   : 'User(s)',
        smallTitle : ''
      });
      this.parent.updateWidgetColumnContent(4, false, usersTempl,
        this.parent.getDOM('.' + this.options.classs));
    }
  });

  return DataSummaryView;
});
