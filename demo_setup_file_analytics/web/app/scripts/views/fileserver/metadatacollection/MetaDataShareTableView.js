//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// MetaDataShareTableView enables the user to re trigger
// the meta data collection for shares.
//
define([
  // Views
  'views/base/BaseTableView',
  // Utils
  'utils/AppConstants',
  'utils/FileAnalyticsEnableUtil',
  // Components
  'components/Components',
  // Models
  'models/fileservers/FileServerModel',
  'models/fileservers/FileServerMetaDataModel',
  // Collections
  'collections/fileservers/FileServerMetaDataCollection'],
function(
  // Views
  BaseTableView,
  // Utils
  AppConstants,
  FileAnalyticsEnableUtil,
  // Components
  Components,
  // Models
  FileServerModel,
  FileServerMetaDataModel,
  // Collections
  FileServerMetaDataCollection) {
  'use strict';

  var MetaDataShareTableView = BaseTableView.extend({

    // The model for the view.
    model: null,

    events: {
      'click .parentCheckbox'      : 'selectAllCheckboxes',
      'click .childrenCheckbox'    : 'deselectParentCheckbox',
      'mouseover .showErrorTooltip': 'onMouseOverErrorStatus',
      'mouseout .showErrorTooltip' : 'onMouseOutErrorStatus'
    },

    // @override
    // Initialize the view.
    initialize: function(options) {
      this.model = new FileServerMetaDataCollection();
      this.model.getURL();
      BaseTableView.prototype.initialize.call(this, options);

      let _this = this;
      // Fetch the share information in every 5 mins so that the table
      // is updated with the current scan status.
      this.pollingObj = setInterval(function() {
        _this.fetchModel();
      }, AppConstants.METADATA_SCAN_INTERVAL);
    },

    // @override
    // Action to do after fetching the model
    onActionSuccess: function(data) {
      const metaDataStatus = this.model.getScanStatus();

      // Schedule task polling to update the status in the task activity.
      FileAnalyticsEnableUtil.scheduleTaskPolling({
        fsId: this.options.parent.options.actionRoute.fsId
      });

      if (metaDataStatus === AppConstants.METADATA_STATUS.COMPLETED ||
        metaDataStatus === AppConstants.METADATA_STATUS.FAILED) {
        clearInterval(this.pollingObj);
      }

      this.resetSettings(data);

      const shareInfo = data.toJSON();

      // Check if SMB shares are there in the share list.
      const smbRec = _.find(shareInfo, function(share) {
        return share.share_protocol.includes(AppConstants.FS_PROTOCOLS.SMB);
      });

      if (smbRec) {
        // Fetch the file server info and check if AD configuration is present.
        this.fetchFileServerInfo();
      } else {
        // Render the share list.
        this.renderShareList();
      }
    },

    // @private
    // Manage the state of checkboxes.
    manageCheckboxes: function(data) {
      // Disable the parent checkbox if status of any share is running.
      if (this.$('.childCheckbox:disabled').length) {
        this.$('.parentCheckbox').prop('disabled', true);
      } else {
        this.$('.parentCheckbox').prop('disabled', false);
      }

      // If the number of shares corresponds to the number
      // of the checked checkboxes in the table(except the parent 'scan all'
      // checkbox present in the header), select the parent checkbox as it
      // intends to scan all.
      if (data.length &&
        (data.length === this.$('.childCheckbox:checked').length)) {
        this.$('.parentCheckbox').prop('checked', true);
      } else {
        this.$('.parentCheckbox').prop('checked', false);
      }
    },

    // @private
    // Fetch file server info.
    fetchFileServerInfo: function() {
      let _this = this;

      // Fetch file server info
      const fsModel = new FileServerModel();
      fsModel.getURL();
      fsModel.fetch({
        success: function(data) {
          _this.manageSMBShares(data.attributes);
        },
        error: function(model, xhr) {
          if (xhr.responseJSON) {
            _this.options.parent.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
              xhr.responseJSON.error);
            return;
          }
          _this.options.parent.showAlert(AppConstants.MODAL.ALERT.TYPE_ERROR,
            'Error fetching file server configuration.');
        }
      });
    },

    // @private
    // Renders the share list in the table.
    renderShareList: function() {
      // Send the filtered data to render the table.
      const finalData = this.filterShares(this.model.toJSON());

      // Set the table row count.
      this.defaultMinRows = finalData.length;
      this.dataTable.fnSettings()._iDisplayLength = finalData.length;
      this.updatePaginator(this.dataTable.fnSettings());

      this.dataTable.fnClearTable();
      this.insertDataRows(finalData);
      this.manageCheckboxes(finalData);
    },

    // @private
    // Enables/Disables scanning SMB shares based on AD configuration.
    manageSMBShares: function(data) {
      let _this = this;
      _this.renderShareList();

      // Find the fileserver details for the current file server
      // from the file server details list.
      let fsRec = _.find(data, function(item) {
        return item.fileserver_uuid ===
          _this.options.parent.options.actionRoute.fsId;
      });

      // Disable the checkboxes for those shares that have SMB
      // as its protocol and AD configuration is absent as it will
      // cause problem in scanning the SMB shares.
      _.each(_this.model.toJSON(), function(shareInfo) {
        if (fsRec && fsRec.directory_services &&
          Object.keys(fsRec.directory_services).length &&
          (!fsRec.directory_services.ad ||
          !Object.keys(fsRec.directory_services.ad).length) &&
          shareInfo.share_protocol.includes(AppConstants.FS_PROTOCOLS.SMB)) {
          _this.$('#' + shareInfo.share_UUID).prop('disabled', true);

          // Render warning message.
          _this.showWarning();
        }
      });
    },

    // @private
    // Shows warning to configure AD.
    showWarning: function() {
      // Disable the parent checkbox as wells o that the child
      // checkbox cannot be selected using it.
      this.$('.parentCheckbox').prop('disabled', true);
      this.$('.n-modal-alert-header').empty();
      // Show warning in the popup and give option to update
      // AD as well.
      this.options.parent.showAlert(
        AppConstants.MODAL.ALERT.TYPE_WARNING,
        'Configure AD to scan SMB shares. \
        <a class="updateAdLdap">Update AD/LDAP Configuration</a>',
        AppConstants.METADATA_SCAN_INTERVAL + 5);
    },

    // @private
    // Filter only those shares that are not nested, active,
    // is accessible(online), is not encrypted and are SMB or NFS
    // shares(that dont have KERBEROS authentication)
    filterShares: function(data) {
      let retVal = [],
          authTypes = ['KERBEROS5', 'KERBEROS5P', 'KERBEROS5I'];

      _.each(data, function(shareInfo) {
        // If share is not a nested one/deleted one/is accessible(online) one/
        // is not encrypted one.
        if (!shareInfo[FileServerMetaDataModel.DP.IS_NESTED_SHARE] &&
          shareInfo[FileServerMetaDataModel.DP.IS_ACTIVE] &&
          shareInfo[FileServerMetaDataModel.DP.IS_ACCESSIBLE] &&
          !shareInfo[FileServerMetaDataModel.DP.IS_ENCRYPTED]) {
          // If share is configured with a certain protocol(s) AND
          // If share is configured with protocol other than NFS OR
          // If share is configured with NFS protocol but the
          // authentication type is not KERBEROS or there is no auth type
          // at all.
          // OR
          // If share is not configured with any protocol.
          if ((shareInfo.share_protocol.length &&
            (((shareInfo.share_protocol).indexOf('NFS') < 0) ||
            ((((authTypes.indexOf(shareInfo.authentication_type)) < 0) &&
            ((shareInfo.share_protocol).indexOf('NFS') >= 0)) ||
            !shareInfo.authentication_type))) ||
            !shareInfo.share_protocol.length) {
            // Show the share in the table.
            retVal.push(shareInfo);
          }
        }
      });

      return retVal;
    },

    // @override
    // Remove DOM elements that are not required
    renderSubViews: function() {
      BaseTableView.prototype.renderSubViews.call(this);
      this.$('.n-header').remove();
    },

    // @private
    // Select/Deselect all the children checkboxes based on parent
    // checkbox value.
    selectAllCheckboxes: function(e) {
      let childClass = $(e.currentTarget).attr('actionChildrenClass');

      if ($(e.currentTarget).prop('checked')) {
        // If the parent checkbox is checked,
        // check all it's children checkboxes.
        this.$('.' + childClass).prop('checked', true);
      } else {
        // If the parent checkbox is unchecked,
        // uncheck all it's children checkboxes.
        this.$('.' + childClass).prop('checked', false);
      }
    },

    // @private
    // Select/Deselect parent checkboxes based on the children checkbox value.
    deselectParentCheckbox: function(e) {
      let parentClass = $(e.currentTarget).attr('actionParentClass'),
          childClassName = $(e.currentTarget).attr('actionChildrenClass');

      // If a child checkbox is checked
      if ($(e.currentTarget).prop('checked')) {
        // If the number of checked child checkboxes is equal to the total
        // number of child checkboxes, check the parent checkbox as well.
        if (this.$('.' + childClassName + ':checked').length ===
          this.$('.' + childClassName).length) {
          this.$('.' + parentClass).prop('checked', true);
        }
      } else {
        // Else uncheck the parent checkbox.
        this.$('.' + parentClass).prop('checked', false);
      }
    },

    // @private
    // Get the previous as well as current scan status.
    getScanStatus: function(data) {
      let scanStatus = '', statusToCheck = '',
          tooltipHTML = '', retVal = '';

      // Previous scan error details if available.
      const errorDetails = data[FileServerMetaDataModel.DP.ERROR_DETAILS] ?
        '(' + data[FileServerMetaDataModel.DP.ERROR_DETAILS] + ')' : '';

      // Get the scan status from the data based on the type of scan status.
      // Current scan status if available.
      statusToCheck = data[FileServerMetaDataModel.DP.SCAN_STATUS] ||
        AppConstants.NOT_AVAILABLE;

      // If scan is in state 'not_started' because of some error, set the
      // scan status as failed.
      if ((data[FileServerMetaDataModel.DP.SCAN_STATUS] ===
        AppConstants.METADATA_STATUS.NOT_STARTED) &&
        data[FileServerMetaDataModel.DP.ERROR_DETAILS]) {
        statusToCheck = AppConstants.METADATA_STATUS.FAILED;
      }

      scanStatus = AppConstants.METADATA_STATUS_TITLE[statusToCheck] ||
        statusToCheck;

      // If the metadata scan status is failed, show
      // on hover the reason of failure.
      if (statusToCheck === AppConstants.METADATA_STATUS.FAILED ||
        (statusToCheck === AppConstants.METADATA_STATUS.NOT_STARTED &&
        errorDetails) ||
        (statusToCheck === AppConstants.METADATA_STATUS.COMPLETED &&
        errorDetails)) {
        // Set the message to be displayed in the tooltip.
        tooltipHTML = 'Scan failed ' + errorDetails;

        if (statusToCheck === AppConstants.METADATA_STATUS.COMPLETED) {
          tooltipHTML = 'Scan Completed ' + errorDetails;
        }

        // Construct the template to render.
        retVal = '<a class="showErrorTooltip" actionTargetErrorMessage="' +
          tooltipHTML + '">' + scanStatus + '</a>';
      } else {
        // Else if scan status is anything other than 'failed'.
        retVal = '<span>' + scanStatus + '</span>';
      }

      return retVal;
    },

    // @override
    // Returns a list of data columns based on the entity type.
    // This is used to initialize the table.
    getDefaultColumns: function() {
      const _this = this;
      let checkboxTemplate = _.template(Components.checkbox({
        id : '<%= id %>',
        jsClasses : '<%= classes %>',
        attributes: '<%= attributes %>'
      }));

      let retArray = [
        {
          'sTitle': checkboxTemplate({
            id: 'selectAllCheckboxes',
            classes: 'selectAllCheckboxes parentCheckbox',
            attributes: 'actionChildrenClass="childCheckbox"'
          }),
          'sWidth': '8%',
          'bSortable': false,
          'mData': FileServerMetaDataModel.DP.SHARE_UUID,
          'mRender': function(data, type, full) {
            return checkboxTemplate({
              id: data,
              classes: 'childCheckbox childrenCheckbox',
              attributes: 'actionParentClass="selectAllCheckboxes" \
              actionChildrenClass="childCheckbox"'
            });
          }
        },
        {
          'sTitle'  : 'share name',
          'mData'   : FileServerMetaDataModel.DP.SHARE_NAME,
          'sWidth' : '25%',
          'bSortable' : false,
          'mRender' : function(data, type, full) {
            let shareName = data || AppConstants.NOT_AVAILABLE;
            return '<span class="shareName" actionTarget=' +
              full[FileServerMetaDataModel.DP.SHARE_UUID] + '>' + shareName +
              '</span>';
          }
        },
        {
          'sTitle'  : 'status',
          'mData'   : FileServerMetaDataModel.DP.SCAN_STATUS,
          'sWidth' : '30%',
          'bSortable' : false,
          'mRender' : function(data, type, full) {
            let retVal = AppConstants.NOT_AVAILABLE;

            if (data) {
              retVal = _this.getScanStatus(full);
            }

            return '<span id="' + full[FileServerMetaDataModel.DP.SHARE_UUID] +
              '-current-status">' + retVal + '<span>';
          }
        }
      ];

      return retArray;
    },

    // Render the tooltip.
    renderTooltip(el, title, html = false) {
      el.tooltip({
        title     : title,
        placement : 'right',
        trigger   : 'manual',
        html
      });
      el.tooltip('show');
    },

    // Called when the mouse is over the error status
    onMouseOverErrorStatus: function(e) {
      const el = $(e.currentTarget);
      let errorMsg = $(e.currentTarget).attr('actionTargetErrorMessage');
      this.renderTooltip(el, errorMsg);
    },

    // Called when mouse leaves the error status
    onMouseOutErrorStatus: function(e) {
      this.$('.showErrorTooltip').tooltip('destroy');
    }
  });

  return MetaDataShareTableView;
});
