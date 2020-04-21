//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// NotificationPolicyTableView is a table component that is used
// in form to update notification policies / blacklist rules.
//
define([
  'views/base/tableinput/TableInputView',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Components
  'components/Components',
  // Models
  'models/notification/NotificationPolicyModel'],
function(
  TableInputView,
  // Utils
  AppConstants,
  AppUtil,
  // Components
  Components,
  // Models
  NotificationPolicyModel) {

  'use strict';

  var tmplDataRow = _.template(
    '<tr data-id="<%= dataId %>" <%=isNew ? "new":""%> class="n-table-row"' +
      'model-attribute="user-row" model-validate="isRowSaved">' +
      '<% _.each(columns, function(column) { %>' +
        '<td class="data-cell">' +
          '<% if(column.columnName === "Entities") ' +
            '{ %> <%= column.renderer(data) %> ' +
              '<% } else { %>' +
              '<input type="<%= column.type ? column.type : "text" %>" ' +
                'class="input-data ' +
                ' <%= column.className ? column.className : "" %>"' +
                ' readonly ' +
                '<% if (modelAttribute) { %>' +
                  'model-attribute="<%= modelAttribute %>" ' +
                '<% } %>' +
                'value="<%= column.renderer(data) %>" >' +
          '<% } %>' +
        '</td>' +
      '<% }); %>' +
      TableInputView.EDIT_ONLY_COLUMN_TEMPLATE +
    '</tr>'
  );

  // View
  //-----
  return TableInputView.extend({

    // Constants
    //----------

    name: 'NotificationPolicyTableView',

    // Properties
    //-----------

    // The id field to be used for unique identifier for the data row.
    idAttribute: 'rule_type',

    // Model attribute for the row to be embedded.
    modelAttribute: null,

    // Entity Name
    entityName: AppConstants.ENTITY_BLACKLIST,

    // Remove new button
    isNewActionEnabled: false,

    // Functions
    //----------

    // @inherited
    initialize: function(options) {
      options.columns = this.getBlacklistTableColumns(this);
      options.filterAttributes = ['rule_type'];
      TableInputView.prototype.initialize.call(this, options);
      this.tmplDataRow = tmplDataRow;
      this.parent = options.parent;

      // Required to remove filter from top
      this.isFilterEnabled = false;
    },

    // @private
    // Generate table data
    getBlacklistTableColumns: function(_this) {
      return [
        {
          columnName: 'Type',
          className : 'rule_type display',
          renderer  : function(data) {
            let category = '';
            if (data && data.rule_type) {
              category = AppConstants.NOTIFICATION_POLICY_DISPLAY
                [data.rule_type];
            }
            return category;
          }
        },
        {
          columnName: 'Entities',
          className : 'entities  ',
          render: '',
          tooltipText: 'Entities should be comma and space separated. \
            File extensions should start with ".". Client IP should be \
            in IPv4 format only.',
          renderer: function(data) {
            return _this.createTabs(data);
          }
        }
      ];
    },

    // Create bubbles from the text entered in input
    createTabs: function(data) {
      let entities = [];
      if (data && data.entities) {
        $.each(data.entities, function(key, entity) {
          // if there is whitespace at the end of the extension then
          // replace whitespace with &nbsp; while rendering it in html
          entities.push({
            label: entity.replace(/ /g, '\u00a0'),
            tooltip: entity,
            hideClose: true
          });
        });
        return Components.bubbles({
          options: entities,
          classes: data.rule_type
        });
      }
    },

    // @private
    // Format data to save
    // Return format(json object: { "black_list" : { "client_ips": ["192.168.1.1"], ... }}
    formatDataToSave: function() {
      let blacklistRules = {};
      $.each(this.dataItems, function(key, value) {
        blacklistRules[value.rule_type] = value.entities;
      });

      return { 'black_list': blacklistRules };
    },

    // Functions (Event Handler)
    //--------------------------

    // @override
    // Event handler for edit link. Overridden in order to get previous values
    onClickEditLink: function(e) {
      TableInputView.prototype.onClickEditLink.apply(this, arguments);
      const selectedRow = this.getRowFromActionLink(e);
      this._previousValue = this.getRowData(selectedRow);
      const dataId = selectedRow.attr('data-id');
      const rowEl = this.$('tr[data-id="' + dataId + '"]');
      // Handle the row selection style
      this.$('tr').removeClass('edit');
      rowEl.addClass('edit');
      rowEl.find('.display').attr('disabled', true);
      rowEl.find('input.display').attr('readonly');

      // Update the input element with bubble values for editing
      let editableText = '<input type="text" class="input-data" ' +
        'value="' + this._previousValue.entitiesText + '">';
      rowEl.find('.filter-bubbles').html(editableText);
    },

    // Convert the text to bubbles on click of cancel
    onClickCancelLink: function(e) {
      this.changeTextToBubbles(e);
      TableInputView.prototype.onClickCancelLink.apply(this, arguments);
    },

    // Change text to Bubbles while cancelling and saving
    changeTextToBubbles: function(e) {
      let updatedRow = this.createTabs(this._previousValue);
      const selectedRow = this.getRowFromActionLink(e);
      const dataId = selectedRow.attr('data-id');
      const rowEl = this.$('tr[data-id="' + dataId + '"]');
      rowEl.find('.filter-bubbles').parent().html(updatedRow);
    },

    // @override
    // Save the row
    saveRow: function(e) {
      // Validate config before save
      const validationMsg = this.validatePolicy(e);
      if (validationMsg.length) {
        this.parent.showHeaderError(validationMsg.join('<br/>'), null, true);
        return;
      }

      // Update config
      this.updateConfig(e);
    },

    // @private
    // Update the notification policies
    updateConfig: function(e) {
      // Show Loading message
      this.parent.showHeaderLoading('Updating Blacklist rules.');
      const rowToBeSaved = this.getRowFromActionLink(e);
      const dataToBeSaved = this.getRowData(rowToBeSaved);

      // Merge the change with payload received during GET to update
      // the rules with PUT request
      this.dataItems.map((items) => {
        if (items.rule_type === dataToBeSaved.rule_type) {
          items.entities = dataToBeSaved.entities;
        }
      });
      let _this = this, notificationPolicyModel = new NotificationPolicyModel();
      let blacklistRules = this.formatDataToSave();

      // Disable all events until save is complete
      this.undelegateEvents();
      notificationPolicyModel.getURL();
      notificationPolicyModel.save(blacklistRules, {
        method: 'PUT',
        success: function(model, response) {
          // Bind all events back on request complete
          _this.delegateEvents(_this.events);

          // Update previous values with new data
          _this._previousValue = dataToBeSaved;

          // Change text to bubbles for readability after save
          _this.changeTextToBubbles(e);

          TableInputView.prototype.saveRow.call(_this, e);
          _this.parent.showHeaderSuccess('Successfully updated blacklist \
          rules.');
        },
        error: function(model, xhr) {
          // Bind all events back on request complete
          _this.delegateEvents(_this.events);
          const errorMsg = AppUtil.getErrorMessage(xhr) ||
            'Error in saving blacklist rules.';
          _this.parent.showHeaderError(errorMsg);
        }
      });
    },

    // @private
    // Gather the rule type information from the data row.
    getRowData: function(rowToBeSaved) {
      // Get category name, remove extra space around, convert it to lower
      // case and replace space with "_"
      const ruleType = rowToBeSaved.attr('data-id').trim()
        .toLowerCase()
        .replace(' ', '_');

      // Get entities, remove extra space around
      let entities = rowToBeSaved.find('div > .filter-name');
      if (!entities.length) {
        entities = rowToBeSaved.find('.filter-bubbles input').val();
        if (entities) {
          entities = entities.split(',').map(function(item) {
            if (ruleType === AppConstants.NOTIFICATION_POLICY_TYPES
              .FILE_EXTENSIONS) {
              return item.trimLeft();
            }
            return item.trim();
          });
        }
      }
      let entitiesData = [], entityForEdit = '';

      // Check if entities exist, split the text to array
      if (entities) {
        $.each(entities, function(key, value) {
          const entity = value.innerHTML ? value.innerHTML.trim() : value;
          if (entity) {
            entityForEdit += entity + ', ';
            entitiesData.push(entity);
          }
        });
      }
      return {
        entitiesText: entityForEdit,
        entities    : entitiesData,
        rule_type   : ruleType
      };
    },

    // @private
    // Validate policy before saving
    // @params: e(selected element) - element clicked
    // is modified
    validatePolicy: function(e) {
      const rowToBeSaved = this.getRowFromActionLink(e);
      const dataToValidate = this.getRowData(rowToBeSaved);

      let validateEntitiesMsg = '', validationMsg = [];

      // Get unique entities
      const uniqueEntities = _.filter(dataToValidate.entities,
        function(entity) {
          return !this._previousValue.entities.includes(entity);
        }, this);

      // If new data exists to save, validate and update
      if (uniqueEntities.length) {
        // Check for entities if they are valid
        if (dataToValidate.rule_type === AppConstants
          .NOTIFICATION_POLICY_TYPES.USER) {
          validateEntitiesMsg = this.validateUser(dataToValidate);
        } else if (dataToValidate.rule_type === AppConstants
          .NOTIFICATION_POLICY_TYPES.FILE_EXTENSIONS) {
          // Validate extensions are valid or not
          validateEntitiesMsg = this.validateExtensions(dataToValidate);
        } else {
          validateEntitiesMsg = this.validateIP(dataToValidate);
        }
        if (validateEntitiesMsg) {
          validationMsg.push(validateEntitiesMsg);
        }
      }
      let isDuplicate = false;
      // For username the entities are case insensitive
      if (dataToValidate.rule_type === AppConstants.NOTIFICATION_POLICY_TYPES
        .USER) {
        isDuplicate = AppUtil.iUniqueArray(dataToValidate.entities).length !==
          dataToValidate.entities.length;
      } else {
        isDuplicate = _.uniq(dataToValidate.entities).length !== dataToValidate
          .entities.length;
      }
      // If the values entered are duplicate, show appropriate error
      if (isDuplicate) {
        const duplicateMsg = 'Duplicate ' + AppConstants
          .NOTIFICATION_POLICY_DISPLAY[dataToValidate.rule_type] +
          ' defined under same policy.';
        validationMsg.push(duplicateMsg);
      }
      return validationMsg;
    },

    // Validate IPV4 and show appropriate message
    validateIP: function(data) {
      let msg = '';
      _.find(data.entities, function(ip) {
        if (!AppUtil.validIPWithoutHost(ip)) {
          // Invalid IP address
          msg = 'Invalid IP address entered. Client IP should be in IPv4 \
            format only.';
        }
      });
      return msg;
    },

    // Validate user input format as format specified
    validateUser: function(data) {
      let validationMsg = '';
      _.find(data.entities, function(user) {
        const initialCharacters = user.substring(0, 2);
        if (user.indexOf('\\') > -1) {
          if (!AppUtil.validUsername(user)) {
            validationMsg = 'Invalid Username format entered.';
          }
        } else if (initialCharacters === 'S-' || initialCharacters === 's-') {
          if (!AppUtil.validSID(user)) {
            validationMsg = 'Invalid SID format entered.';
          }
        } else if (AppUtil.validNumber(user)) {
          if (!AppUtil.validUID(user)) {
            validationMsg = 'Invalid UID format entered.';
          }
        } else {
          validationMsg = 'Invalid format entered.';
        }
      });

      if (validationMsg) {
        // Invalid User format
        return validationMsg;
      }
    },

    // @private
    // Extensions name should not include "." and "/"
    // Extension should not be more than 260 characters
    validateExtensions: function(data) {
      let validationMsg = '';
      const extensionValidation = [];
      _.find(data.entities, function(ext) {
        // Get the error type if extension is invalid else empty
        const msg = AppUtil.extensionValidityCheck(ext);
        if (msg && !extensionValidation[msg]) {
          extensionValidation[msg] = true;
          // If the error message is invalid length, show appropriate message
          if (msg === 'invalid_length') {
            validationMsg += 'File extensions should have less than or equal \
            to 259 characters. ';
            // If the message format is invalid, show appropriate message
          } else if (msg === 'invalid_format') {
            validationMsg += 'File extensions should contain period "." only \
            at the beginning and should not include "/". ';
          }
        }
      });
      return validationMsg;
    }
  });
});
