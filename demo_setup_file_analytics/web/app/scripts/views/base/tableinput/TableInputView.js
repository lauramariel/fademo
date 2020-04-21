//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// TableInputView is a generic table component that is used in form to add,
// delete and edit a row.
//
define([
  'views/base/BaseView',
  // Utils
  'utils/AppUtil',
  'utils/SVG',
  'utils/AppConstants',
  // Components
  'components/Components'],
function(
  BaseView,
  // Utils
  AppUtil,
  SVG,
  AppConstants,
  // Components
  Components) {

  'use strict';

  // Constants
  //----------

  var tmplTable = _.template(
    '<div class="header">' +
      '<% if (isFilterEnabled) { %>' +
        '<div class="n-table-filter">' +
           SVG.SVGIcon("B", "search-icon") +
          '<input class="n-table-filter tableFilter"' +
          '  type="text" placeholder="search in table">' +
        '</div>' +
      '<% } %>' +
      '<% if (isNewActionEnabled) { %>' +
        '<div class="header-table-input">' +
          '<a class="link-table-input"><%= Components.icon("plus-small") %>' +
          '<%= addCaption %></a>' +
        '</div>' +
      '<% } %>' +
    '</div>' +
    '<table class="table table-data-items table-input <%= ebClass %>">' +
      '<thead>' +
        '<tr>' +
          '<% _.each(columns, function(column) { %>'+
            '<th><%= column.columnName %>' +
              '<span class="ntnxMoreInfo hide"></span>' +
            '</th>' +
          '<% }); %>' +
          '<% if (isActionEnabled) { %>' +
            '<th>Actions</th>' +
          '<% } %>' +
        '</tr>' +
      '</thead>' +
      '<tbody></tbody>' +
    '</table>'
  );

  var editColumnTemplate =
    '<% if (isActionEnabled) { %>' +
      '<td class="data-cell">' +
        '<div class="action-links">' +
          SVG.SVGIcon("pencil", "edit not-active") +
          '<a class="save active" tabindex="0">Save</a>' +
          '<span class="middot"> &middot; </span>' +
          SVG.SVGIcon("x-round", "delete not-active") +
          '<a class="cancel active" tabindex="0">Cancel</a>' +
        '</div>' +
      '</td>' +
    '<% } %>';

  var editOnlyColumnTemplate =
    '<% if (isActionEnabled) { %>' +
      '<td class="data-cell">' +
        '<div class="action-links">' +
          SVG.SVGIcon("pencil", "edit not-active") +
          '<a class="save active" tabindex="0">Save</a>' +
          '<span class="middot"> &middot; </span>' +
          '<a class="cancel active" tabindex="0">Cancel</a>' +
        '</div>' +
      '</td>' +
    '<% } %>';

  var tmplDataRow = _.template(
    '<tr data-id="<%= dataId %>" <%=isNew ? "new":""%> class="n-table-row"' +
      'model-attribute="user-row" model-validate="isRowSaved">' +
      '<% _.each(columns, function(column) { %>'+
        '<td class="data-cell">' +
          '<input type="<%= column.type ? column.type : "text" %>" ' +
            'class="input-data' +
            '<%= column.className ? column.className : "" %>"' +
            ' readonly ' +
            '<% if (column.modelAttribute) { %>' +
              'model-attribute="<%= column.modelAttribute %>" ' +
            '<% } else if (modelAttribute) { %>' +
              'model-attribute="<%= modelAttribute %>" ' +
            '<% } %>' +
            'value="<%= isNew ? "" : column.renderer(data) %>" ' +
            'placeholder=' +
            '"<%= (placeholderText) ? placeholderText : column.columnName%>"' +
           '>' +
        '</td>' +
      '<% }); %>' +
      editColumnTemplate +
    '</tr>'
  );

  var tmplNoData = _.template(
    '<tr class="no-data">' +
      '<td colspan="<%= columnLength %>"><%= noData %></td>' +
    '</tr>'
  );

  // View
  //-----
  return BaseView.extend({

    // Constants
    //----------

    // The temporary id for the new row to be added.
    ID_TO_BE_ADDED: AppConstants.ID_TO_BE_ADDED,

    // For i18n
    name: 'TableInputView',

    // Properties
    //-----------

    // @override
    className: 'component-table-input',

    // Entity type of the form control
    entityType: null,

    // Columns
    columns: null,

    // The id field to be used for unique identifier for the data row.
    idAttribute: 'id',

    // Array of displayed data items.
    dataItems: null,

    // Boolean that determines if action column is enabled
    isActionEnabled: true,

    // Boolean that determines if new action is enabled.
    isNewActionEnabled: true,

    // Model attribute for the row to be embedded.
    modelAttribute: null,

    tmplTable: null,

    // Caption for add new row link. By default we use entity type.
    addCaption: null,

    // Entity Name
    entityName: null,

    // Stores the previous input value during row edit.
    // @private
    _previousValue: '',

    // @override
    events: {
      'click  a.link-table-input'   : 'onClickAddRow',
      'click  .action-links .edit'  : 'onClickEditLink',
      'keyup  .tableFilter'         : 'onFilterChange',
      'click  .action-links .delete': 'onClickDeleteLink',
      'click  a.save'               : 'onClickSaveLink',
      'click  a.cancel'             : 'onClickCancelLink'
    },

    // Event names for actions.
    ACTION_EVENTS: {
      'ADD'         : 'add',
      'SAVE'        : 'save',
      'EDIT'        : 'edit',
      'DELETE'      : 'delete',
      'CHANGE_LIST' : 'change_list',
      'CANCEL'      : 'cancel'
    },

    // Functions
    //----------

    // Constructor for the table. The following params should be present in
    // the options object:
    // @ entityType - See AppConstants.ENTITY_*
    // @ el - The DOM element it is worked on.
    // @ columns - an array of object containing the following with example:
    //    [{
    //      columnName: 'Name',
    //      type      : 'html' or 'data' (data is default - raw value)
    //      renderer  : function(data) {
    //                    return data.name;
    //                  }
    //     }]
    // @ idAttribute - The id attribute used among the given properties.
    // @ data - (optional) array of data items to be rendered on the table.
    // @ isActionEnabled   - Show/hide action column? True by default.
    // @ disableInlineEdit - Disable inline edit.
    // @ ebTableStyle - look and feel like EB table.
    // @ filterAttributes  - An array of attributes used for filter search.
    initialize: function(options) {
      options = options || {};
      // Check if default properties are set.
      if (!options.entityType || !options.columns) {
        throw new Error('Incomplete options object. See initialize comment ' +
          'for more information in creating this component.');
      }

      // Set the option parameters
      this.entityType = options.entityType || this.entityName;
      this.columns = options.columns;
      this.dataItems = options.dataItems || [];
      this.idAttribute = options.idAttribute || this.idAttribute;
      this.filterAttributes = options.filterAttributes || [];
      this.disableInlineEdit = options.disableInlineEdit || false;
      this.modelAttribute = options.modelAttribute || null;
      this.ebTableStyle = options.ebTableStyle || false;
      this.tmplDataRow    = options.tmplDataRow || tmplDataRow;
      this.placeholderText = options.placeholderText;
      this.addCaption = options.addCaption || this.addCaption;

      // We are hard coding the name in i18n, so that subclasses
      // don't need to specify this in i18n files.
      this.noDataText = options.noDataText || 'No data';

      if (this.filterAttributes && this.filterAttributes.length) {
        this.isFilterEnabled = true;
      }
      if (_.isBoolean(options.isActionEnabled)) {
        this.isActionEnabled = options.isActionEnabled;
      }
      if (_.isBoolean(options.isNewActionEnabled)) {
        this.isNewActionEnabled = options.isNewActionEnabled;
      }
      this.tmplTable = options.tmplTable || tmplTable;
    },

    // Renders the table
    render: function() {
      let entityName = this.entityName;
      let addCaption = this.addCaption || entityName;

      // Create the table body and header
      this.$el.html(this.tmplTable({
        addCaption         : addCaption,
        Components         : Components,
        entityName         : entityName,
        columns            : this.columns,
        isActionEnabled    : this.isActionEnabled,
        isFilterEnabled    : this.isFilterEnabled,
        ebClass            : this.ebTableStyle ? "entity-browser-table" : "",
        isNewActionEnabled : this.isNewActionEnabled
      }));

      this.renderTable();

      this.updateTitleTooltip(this.columns);

      return this;
    },

    // @private
    // Update the title tooltip
    updateTitleTooltip: function(columns) {
      this.$('table tr:first-child th').each(function(i, el) {
        if (columns[i] && columns[i].tooltipText) {
          $(this).children('.ntnxMoreInfo').removeClass('hide')
            .nutanixMoreInfo({
              title: columns[i].tooltipText,
              placement: 'top'
            });
        }
      });
    },

    // Render the table.
    // @param filterByValue - Display only rows matching this value to
    //                        filterAttribute.
    renderTable: function(filterByValue) {
      var dataItems = this.dataItems;
      this.clearTable();

      // Filter the dataItems
      if (filterByValue && this.isFilterEnabled) {
        dataItems = this.filterDataItems(filterByValue);
      }
      // Check if data is there...
      if (dataItems && Object.keys(dataItems).length) {
        // Add the data rows
        _.each(dataItems, function(data) {
          this.insertTableRow(data);
        }, this);
      }
      else {
        // Show no data
        this.insertNoDataRow();
      }
    },

    // Filter the data items.
    // @param filterByValue - return only rows matching this value to
    //                        filterAttributes.
    filterDataItems: function(filterByValue) {
      var dataItems = _.filter(this.dataItems, function(data) {
        var found = false;
        // If model is passed then retreive the attribute.
        if (data instanceof Backbone.Model) {
          data = data.attributes;
        }
        // Check if any of the filterAttribute match
        _.some(this.filterAttributes, function(attribute){
          var value = data[attribute];
          if (AppUtil.containsCompare(value, filterByValue)) {
            found = true;
            return true;
          }
        });
        return found;
      }, this);

      return dataItems;
    },

    // Remove all rows.
    clearTable: function() {
      this.$('.table-data-items tbody').html('');
    },

    // Inserts a row for table with no data.
    insertNoDataRow: function() {
      this.$('.table-data-items tbody').append(
        tmplNoData({
          columnLength   : this.columns.length +
                            (this.isActionEnabled ? 1 : 0),
          isActionEnabled: this.isActionEnabled,
          noData         : this.noDataText
        })
      );
    },

    // Removes the row for table with no data.
    removeNoDataRow: function() {
      this.$('tr.no-data').remove();
    },

    // Inserts a row to the table.
    insertTableRow: function(data, isNew) {
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
          placeholderText: this.placeholderText
        }));

      this.removeNoDataRow();
    },

    // Resets the table styles and the data table row items.
    // Note: Prevents spamming add row
    resetTable: function() {
      this.$('tr').removeClass('edit');
      var rowAddEl = this.getRowToBeAddedElement();
      rowAddEl.remove();
      this.$('input.input-data').attr('readonly', true);
      this.$('.input-data').attr('disabled', true);
      // Show no data
      if (this.$('tr[data-id]').length === 0) {
        this.insertNoDataRow();
      }
    },

    // Returns the element instance that has the row to be added.
    getRowToBeAddedElement: function() {
      return this.$('tr[data-id="' + this.ID_TO_BE_ADDED + '"][new]');
    },

    // Get the row being acted on.
    // @param {Object} ev - Action link click event object
    // @returns {Ojbect} jQuery element for the row getting acted on
    getRowFromActionLink(e) {
      return $(e.currentTarget).closest('tr');
    },

    // Get all the saved table rows.
    //
    // @returns {array} jQuery element containing all table rows.
    getRows() {
      return this.$('[model-attribute="user-row"]').not('[new]');
    },


    // Functions (CRUD)
    //-----------------


    // Saves the newly added row. You can override this function on how
    // you want to save the row.
    saveRow: function(e) {
      var linkEl = $(e.currentTarget);
      var rowToBeSaved = linkEl.closest('tr');
      var data = rowToBeSaved.find('input').val().trim();
      // Don't save the row if it's empty.
      if (data) {
        rowToBeSaved.attr('data-id', data);
        rowToBeSaved.removeAttr('new');
      } else {
        rowToBeSaved.remove();
      }
      this.resetTable();

      // Reset previous value
      this._previousValue = '';

      // Trigger save row
      this.trigger(this.ACTION_EVENTS.SAVE, rowToBeSaved);
    },

    // Deletes the selected row. You can override this function on how
    // you want to save the row.
    deleteRow: function(e) {
      var linkEl = $(e.currentTarget);
      var deleteRow = linkEl.closest('tr');
      var dataId = deleteRow.attr('data-id');
      deleteRow.remove();
      this.resetTable();
      this.trigger(this.ACTION_EVENTS.DELETE, dataId);
      // Trigger change event
      this.trigger(this.ACTION_EVENTS.CHANGE_LIST);
    },

    // Adds the new row to be added at the bottom of the table.
    addRow: function() {
      this.resetTable();
      this.insertTableRow(null, true);
      var rowAddEl = this.getRowToBeAddedElement();
      rowAddEl.find('.action-links .edit').click();

      // Focus on newly added row input field
      rowAddEl.find('input').first().focus();
      this.trigger(this.ACTION_EVENTS.ADD);
    },

    // Cancels any editing for the row.
    cancelRow(e) {
      // Revert to old data incase cancel is clicked
      var $selectedRow = this.getRowFromActionLink(e);
      let existingVal = $selectedRow.html();
      if ($selectedRow.length && existingVal) {
        $selectedRow.html(existingVal);
      }

      // Reset previous value
      this._previousValue = '';

      this.resetTable();
      this.trigger(this.ACTION_EVENTS.CANCEL);
    },

    // Functions (Event Handler)
    //--------------------------

    // Event handler for adding a row that will be potentially can be saved
    // as part of the dataItems.
    onClickAddRow: function() {
      this.addRow();
    },

    // Event handler for edit link.
    onClickEditLink: function(e) {
      // Before making any new row editable revert previous row
      // with old data
      const previousSelectedRow = this.$('tr.edit');
      const existingVal = previousSelectedRow.html();
      if (previousSelectedRow.length && existingVal) {
        previousSelectedRow.html(existingVal);
        this.resetTable();
      }

      var selectedRow = this.getRowFromActionLink(e);
      var dataId = selectedRow.attr('data-id');
      var rowEl = this.$('tr[data-id="' + dataId + '"]');
      this.trigger(this.ACTION_EVENTS.EDIT, dataId);

      if(this.disableInlineEdit) {
        return;
      }

      // Handle the row selection style
      this.$('tr').removeClass('edit');
      rowEl.addClass('edit');
      rowEl.find('.input-data').attr('disabled', false);
      rowEl.find('input.input-data').removeAttr('readonly');
    },

    // Event handler for cancel link.
    onClickCancelLink: function(e) {
      this.cancelRow(e);
    },

    // Event handler for save link.
    onClickSaveLink: function(e) {
      this.saveRow(e);
    },

    // Event handler for delete link.
    onClickDeleteLink: function(e) {
      this.deleteRow(e);
    },

    // Event handler for filter input keyup.
    onFilterChange: function(e) {
      if(e.target.value) {
        this.renderTable(e.target.value);
      } else {
        this.clearTable();
        this.renderTable();
      }
    }
  },
  {
    EDIT_COLUMN_TEMPLATE      : editColumnTemplate,
    EDIT_ONLY_COLUMN_TEMPLATE : editOnlyColumnTemplate
  });
});
