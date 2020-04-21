//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// AnomalyPolicyTableInputView is a generic table component that is used in form
// to add, delete and edit a row for anomaly configuration setup.
//
define([
  'views/base/tableinput/TableInputView',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Models
  'models/anamoly/AnomalyModel'],
function(
  TableInputView,
  // Utils
  AppConstants,
  AppUtil,
  // Models
  AnomalyModel) {

  'use strict';

  // Constants
  //----------

  var tmplDataRow = _.template(
    '<tr data-id="<%= dataId %>" <%=isNew ? "new":""%> class="n-table-row"' +
      'model-attribute="user-row" model-validate="isRowSaved">' +
      '<% _.each(columns, function(column) { %>'+
        '<td class="data-cell">' +
          '<% if(column.className === "operationPercent" ||' +
            'column.className === "operationCount" ||' +
            'column.className === "time") { %>' +
             '<input type="<%= column.type ? column.type : "text" %>" ' +
                'class="input-data' +
                ' <%= column.className ? column.className : "" %>"' +
                ' readonly ' +
                '<% if (modelAttribute) { %>' +
                  'model-attribute="<%= modelAttribute %>" ' +
                '<% } %>' +
                'value="<%= column.renderer(data) %>" >' +
          '<% } else if(column.className === "fileEvents") { %>' +
              '<select class="select-operation input-data">' +
                '<% _.each(operations, function(value, key) {' +
                  'if (key == column.renderer(data)) {' +
                    'isSelected = "selected";' +
                  '} else {' +
                    'isSelected = "";' +
                  '}' +
                '%>' +
                '<option <%= isSelected %> value=<%= key %>><%= value %>' +
                '</option>' +
                '<% }); %>' +
              '</select>' +
          '<% } else if(column.className === "byUser"){ %>' +
            '<select class="select-user input-data">' +
              '<% _.each(user_type, function(value, key) {' +
              'if (value == column.renderer(data)) {' +
                  'isSelected = "selected";' +
                '} else {' +
                  'isSelected = "";' +
                '}' +
              '%>' +
              '<option <%= isSelected %> value=<%= value %>>' +
              '<%= user[key] %></option>' +
              '<% }); %>' +
            '</select>' +
          '<% } else if(column.className === "byType"){ %>' +
            '<select class="select-type input-data">' +
              '<% _.each(interval_type, function(value, key) {' +
              'if (value == column.renderer(data)) {' +
                  'isSelected = "selected";' +
                '} else {' +
                  'isSelected = "";' +
                '}' +
              '%>' +
              '<option <%= isSelected %> value=<%= value %>>' +
              '<%= interval[key] %></option>' +
              '<% }); %>' +
            '</select>' +
          '<% } else { %>' +
              '<input type="<%= column.type ? column.type : "text" %>" ' +
                'class="input-data' +
                ' <%= column.className ? column.className : "" %>"' +
                ' readonly ' +
                '<% if (modelAttribute) { %>' +
                  'model-attribute="<%= modelAttribute %>" ' +
                '<% } %>' +
                'value="<%= column.renderer(data) %>" >' +
          '<% } %>' +
        '</td>' +
      '<% }); %>' +
      TableInputView.EDIT_COLUMN_TEMPLATE +
    '</tr>'
  );

  var DEFAULT_FILE_OPERATION_PERCENT = 100,
      DEFAULT_FILE_OPERATION_COUNT = 500;

  // View
  //-----
  return TableInputView.extend({

    // Constants
    //----------

    name: 'AnomalyPolicyTableInputView',

    // Properties
    //-----------

    // @override
    className: 'component-table-input',

    // The id field to be used for unique identifier for the data row.
    idAttribute: 'id',

    // Model attribute for the row to be embedded.
    modelAttribute: null,

    // Entity Name
    entityName: AppConstants.ENTITY_ANOMALY_POLICY,

    // Event names for actions.
    ACTION_EVENTS: {
      'EDIT'   : 'edit',
      'DELETE' : 'delete'
    },

    // Functions
    //----------

    // @inherited
    initialize: function(options) {
      options.columns = this.getResourceTableColumns();
      TableInputView.prototype.initialize.call(this, options);
      this.tmplDataRow = tmplDataRow;
      this.parent = options.parent;
      this.model = new AnomalyModel();
    },

    // @private
    //Generate table data
    getResourceTableColumns: function() {
      let _this = this;
      return [
        {
          columnName: AppConstants.ANOMALY_COLUMN_NAMES.EVENTS,
          className : 'fileEvents',
          renderer  : function(data) {
            if (data) {
              return data[_this.model.DP.FILE_OPERATION];
            }
            return '';
          }
        },
        {
          columnName: AppConstants.ANOMALY_COLUMN_NAMES.MINIMUM_OPERATION_PER,
          className : 'operationPercent',
          type      : 'number',
          renderer  : function(data) {
            if (data) {
              return data[_this.model.DP.MINIMUM_FILE_OPERATION_PERCENT];
            }
            return DEFAULT_FILE_OPERATION_PERCENT;
          },
          tooltipText: 'Enter a percentage value for the minimum threshold. \
            Analytics triggers an anomaly alert after the value is surpassed.'
        },
        {
          columnName: AppConstants.ANOMALY_COLUMN_NAMES.MINIMUM_OPERATION_COUNT,
          className : 'operationCount',
          type      : 'number',
          renderer  : function(data) {
            if (data) {
              return data[_this.model.DP.MINIMUM_FILE_OPERATION_COUNT];
            }
            return DEFAULT_FILE_OPERATION_COUNT;
          },
          tooltipText: 'Enter a value for a minimum operation threshold. \
            Analytics triggers an anomaly alert after the value is surpassed.'
        },
        {
          columnName: AppConstants.ANOMALY_COLUMN_NAMES.USER,
          className : 'byUser',
          renderer  : function(data) {
            if (data) {
              return data[_this.model.DP.PER_USER];
            }
            return '';
          },
          tooltipText: 'Choose if the anomaly rule is applicable for \
            All Users or an Individual user.'
        },
        {
          columnName: AppConstants.ANOMALY_COLUMN_NAMES.TYPE,
          className : 'byType',
          renderer  : function(data) {
            let retVal = AppConstants.ANOMALY_INTERVAL_TYPE_VAL.HOURS;
            if (data) {
              // If the detection interval is more than or equal to 24 and
              // exactly divisible by 24,
              // it is considered to be entered daywise.
              if ((data[_this.model.DP.DETECTION_INTERVAL] >= 24) &&
                (data[_this.model.DP.DETECTION_INTERVAL] % 24 === 0)) {
                retVal = AppConstants.ANOMALY_INTERVAL_TYPE_VAL.DAYS;
              }
            }
            return retVal;
          },
          tooltipText: 'The type defines the interval to determine \
            how far back Analytics monitors the anomaly.'
        },
        {
          columnName: AppConstants.ANOMALY_COLUMN_NAMES.TIME,
          className : 'time',
          type      : 'number',
          renderer  : function(data) {
            let retVal = 1;
            if (data) {
              // If the detection interval is more than or equal to 24 and
              // exactly divisible by 24,
              // it is considered to be entered daywise.
              if ((data[_this.model.DP.DETECTION_INTERVAL] >= 24) &&
                (data[_this.model.DP.DETECTION_INTERVAL] % 24 === 0)) {
                retVal = data[_this.model.DP.DETECTION_INTERVAL] / 24;
              } else {
                retVal = data[_this.model.DP.DETECTION_INTERVAL];
              }
            }
            return retVal;
          },
          tooltipText: 'Enter a value for the detection interval.'
        }
      ];
    },

    // Inserts a row to the table.
    insertTableRow: function(data, isNew) {
      let operations = AppConstants.ANOMALY_OPERATIONS,
          user = AppConstants.ANOMALY_USER,
          user_type = AppConstants.ANOMALY_USER_VAL,
          interval = AppConstants.ANOMALY_INTERVAL_TYPE,
          interval_type = AppConstants.ANOMALY_INTERVAL_TYPE_VAL;

      // If model is passed then retrieve the attribute.
      if (data instanceof Backbone.Model) {
        data = data.attributes;
      }

      isNew = (typeof isNew === 'undefined') ? false : isNew;
      var dataId = isNew ? this.ID_TO_BE_ADDED : data[this.idAttribute];
      var rowAddEl = this.getRowToBeAddedElement();
      // Check if there's already an existing row to add data
      if (isNew && rowAddEl.length) {
        return;
      }

      this.$('.table-data-items tbody').append(
        this.tmplDataRow({
          isNew          : isNew,
          dataId         : dataId,
          data           : data,
          columns        : this.columns,
          isActionEnabled: this.isActionEnabled,
          modelAttribute : this.modelAttribute,
          placeholderText: this.placeholderText,
          operations     : operations,
          user           : user,
          user_type      : user_type,
          interval       : interval,
          interval_type  : interval_type
        }));

      this.removeNoDataRow();
      this.parent._rebuildAntiscroll();
    },

    // @inherited
    // Event handler for cancel link.
    onClickCancelLink: function(e) {
      this.parent.clearHeader();
      // Revert to old data incase cancel is clicked
      var $selectedRow = $(e.currentTarget).closest('tr');
      let existingVal = $selectedRow.html();
      if ($selectedRow.length && existingVal) {
        $selectedRow.html(existingVal);
      }
      this.resetTable();
    },

    // @override
    // Saves the newly added row.
    saveRow: function(e) {
      let linkEl = $(e.currentTarget);
      let rowToBeSaved = linkEl.closest('tr');
      let dataToValidate = this.getRowData(rowToBeSaved);
      let flag;

      // Don't save the row if it's empty.
      if (dataToValidate) {
        flag = this.validateFormInput(dataToValidate, rowToBeSaved);
        if (!flag) {
          // Refresh the antiscroll to accomodate the error message.
          this.parent._refreshAntiscroll();
        } else {
          this.saveAnomalyData(rowToBeSaved, dataToValidate);
        }
      } else {
        // If there is no data in any column, remove it.
        rowToBeSaved.remove();
      }
    },

    // @private
    // Validate the input fields.
    // @param dataToValidate - data to validate.
    validateFormInput: function(dataToValidate, rowToBeSaved) {
      let flag = 1, model = this.model.DP;

      const fileOperationPercent =
        dataToValidate[model.MINIMUM_FILE_OPERATION_PERCENT];

      const fileOperationCount =
        dataToValidate[model.MINIMUM_FILE_OPERATION_COUNT];

      const anomalyInterval = dataToValidate[model.DETECTION_INTERVAL];

      if (!this.checkThreshold(fileOperationPercent,
        AppConstants.ANOMALY_COLUMN_NAMES.MINIMUM_OPERATION_PER,
        rowToBeSaved) ||
        !this.checkThreshold(fileOperationCount,
          AppConstants.ANOMALY_COLUMN_NAMES.MINIMUM_OPERATION_COUNT,
          rowToBeSaved) ||
        !this.checkThreshold(anomalyInterval,
          AppConstants.ANOMALY_COLUMN_NAMES.TIME,
          rowToBeSaved)) {
        // If valid file operation percent is not present.
        // If valid file operation count is not present.
        // If anomaly interval is not present.
        flag = 0;
      }

      return flag;
    },

    // @private
    // Validates the entered threshold value.
    // @param value - the parameter to validate.
    // @param paramater - the parameter to show the alert for.
    checkThreshold: function(value, parameter, rowToBeSaved) {
      let validate = false;
      // If value is a number(integer) greater than zero and not a decimal.
      if (value > 0 && value % 1 === 0) {
        validate = true;

        if (parameter ===
          AppConstants.ANOMALY_COLUMN_NAMES.MINIMUM_OPERATION_PER &&
          value > 1000) {
          // File operation percent should be less than or equal to 1000.
          validate = false;
          this.parent.showHeaderError(parameter + ' cannot \
            be greater than 1000.');
        } else if (parameter ===
          AppConstants.ANOMALY_COLUMN_NAMES.MINIMUM_OPERATION_COUNT &&
          !AppUtil.isMaxSafeInteger(value)) {
          // File operation count should be less than or equal
          // to Max Safe integer value i.e. 9007199254740991.
          this.parent.showHeaderError(parameter + ' cannot \
            be greater than ' + AppUtil.filterRangeMax + '.');
          validate = false;
        } else if (parameter ===
          AppConstants.ANOMALY_COLUMN_NAMES.TIME) {
          if ((this.getIntervalType(rowToBeSaved) ===
            AppConstants.ANOMALY_INTERVAL_TYPE_VAL.DAYS) &&
            (this.getValForInterval(rowToBeSaved) > 30)) {
            // Daily interval should be less than or equal to 30.
            this.parent.showHeaderError(parameter + ' cannot \
              be greater than 30 days.');
            validate = false;
          } else if (this.getValForInterval(rowToBeSaved) > 720) {
            // Hourly interval should be less than or equal to 720.
            this.parent.showHeaderError(parameter + ' cannot \
              be greater than 720 hours.');
            validate = false;
          }
        }
      } else {
        // If value is not entered OR value is less than zero or decimal i.e.
        // not an integer.
        this.parent.showHeaderError(parameter + ' should \
          be a number(integer) greater than zero.');
      }

      return validate;
    },

    // @inherited
    // Event handler for delete link.
    onClickDeleteLink: function(e) {
      let linkEl = $(e.currentTarget);
      let rowToBeSaved = linkEl.closest('tr');
      const id = rowToBeSaved.attr('data-id');

      // Ask for confirmation.
      this.openConfirmationPopup(AppConstants.CONFIRM_DELETE_MSG,
        this.confirmedDeleteRow.bind(this), [e, id]);
    },

    // @private
    // Ask for confirmation.
    openConfirmationPopup: function(message, actionMethod, paramsArr) {
      $.nutanixConfirm({
        msg: message,
        yes: function() {
          actionMethod(paramsArr);
        },
        context: this
      });
    },

    // @inherited
    // Delete the anomaly configuration after confirmation.
    confirmedDeleteRow: function(paramsArr) {
      let _this = this, e = paramsArr[0], id = paramsArr[1];
      this.model.isNew(false);
      this.model.getDeleteURL(id);
      this.model.destroy({
        success: function(model, response) {
          _this.deleteRow(e);
          _this.parent._rebuildAntiscroll();
          // Decrease new configuration length
          _this.decrementConfigurationCount();
        },
        error: function(model, xhr) {
          if (xhr.responseJSON) {
            _this.parent.showHeaderError(xhr.responseJSON.error);
          } else {
            _this.parent.showHeaderError('Error in deleting configuration.');
          }
        }
      });
    },

    // @private
    // Return the interval type i.e. daily or hourly.
    getIntervalType: function(rowToBeSaved) {
      let retVal = '';
      if (rowToBeSaved.find('.select-type').val() ===
        AppConstants.ANOMALY_INTERVAL_TYPE_VAL.DAYS) {
        retVal = AppConstants.ANOMALY_INTERVAL_TYPE_VAL.DAYS;
      } else if (rowToBeSaved.find('.select-type').val() ===
        AppConstants.ANOMALY_INTERVAL_TYPE_VAL.HOURS) {
        retVal = AppConstants.ANOMALY_INTERVAL_TYPE_VAL.HOURS;
      }

      return retVal;
    },

    // @private
    // Return the number of intervals i.e. no of days or no of hours.
    getValForInterval: function(rowToBeSaved) {
      return rowToBeSaved.find('.time').val();
    },

    // @private
    // Gather the policy information from the data row.
    getRowData: function(rowToBeSaved) {
      let intervalVal = 1, retVal = {},
          frequency = rowToBeSaved.find('.time').val();

      if (rowToBeSaved.find('.select-type').val() ===
        AppConstants.ANOMALY_INTERVAL_TYPE_VAL.DAYS) {
        // If the interval type is daily, multiply the entered value of
        // frequency by 24 to convert into hours before sending it to backend.
        intervalVal = Number(frequency) * 24;
      } else {
        if ((Number(frequency) >= 24) && (Number(frequency) % 24 === 0)) {
          // If the interval is hourly, but the value of frequency is more than
          // 24, set interval to daily and value in days.
          let val = Number(frequency) / 24;
          rowToBeSaved.find('.time').val(val);
          rowToBeSaved.find('.select-type').val(
            AppConstants.ANOMALY_INTERVAL_TYPE_VAL.DAYS);
        }

        intervalVal = Number(frequency);
      }

      retVal = {
        operation_name : rowToBeSaved.find('.select-operation').val(),
        minimum_file_operation_percentage :
          Number(rowToBeSaved.find('.operationPercent').val()),
        minimum_file_operation_count :
          Number(rowToBeSaved.find('.operationCount').val()),
        detection_interval : intervalVal,
        per_user: (rowToBeSaved.find('.select-user').val() !== 'false')
      };

      return retVal;
    },

    // @private
    // Save the anomaly configuration.
    // @param rowToBeSaved - table row to be saved.
    // @param anomalyData - the configuration data to be saved.
    saveAnomalyConfiguration: function(rowToBeSaved, anomalyData) {
      let _this = this;
      this.model.getURL();
      this.model.save(anomalyData, {
        success: function(model, response) {
          _this.$('tr').removeClass('edit');
          let id = response.indexed_record_id || 'id';
          rowToBeSaved.attr('data-id', id);
          rowToBeSaved.removeAttr('new');
          _this.resetTable();
          // Increase configuration length since
          // new configuration is added
          _this.incrementConfigurationCount();
        },
        error: function(model, xhr) {
          if (xhr.responseJSON) {
            _this.parent.showHeaderError(xhr.responseJSON.error);
          } else {
            _this.parent.showHeaderError('Error in saving configuration.');
          }
        }
      });
    },

    // @private
    // Update the anomaly configuration.
    // @param rowToBeSaved - table row to be saved.
    // @param anomalyData - the configuration data to be saved.
    updateAnomalyConfiguration: function(rowToBeSaved, anomalyData) {
      this.model.patch(this.model.getURL(), anomalyData,
        this.onSuccess.bind(this), this.onError.bind(this));
    },

    // Called when API successfully saves the configuration.
    onSuccess: function() {
      this.$('tr').removeClass('edit');
      this.resetTable();
    },

    // Called when API gives error while saving the configuration.
    onError: function(xhr, textStatus, errorThrown) {
      if (xhr.responseJSON) {
        this.parent.showHeaderError(xhr.responseJSON.error);
      } else {
        this.parent.showHeaderError('Error in updating configuration.');
      }
    },

    // @private
    // Create Anomaly model and save the model.
    saveAnomalyData: function(rowToBeSaved, anomalyData) {
      let _this = this;

      if(rowToBeSaved.attr('data-id') !== 'ID_TO_BE_ADDED') {
        this.model.isNew(false);
        anomalyData['config_id'] = rowToBeSaved.attr('data-id');
        this.updateAnomalyConfiguration(rowToBeSaved, anomalyData);
      } else {
        this.model.isNew(true);
        this.saveAnomalyConfiguration(rowToBeSaved, anomalyData);
      }
    },

    // @private
    // Increase count of configurations for comparison
    // and load page accordingly
    incrementConfigurationCount: function() {
      this.parent.newConfigurationCount++;
    },

    // @private
    // Decrement count of configurations
    decrementConfigurationCount: function() {
      this.parent.newConfigurationCount--;
    }
  });
});
