//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// FSUpdateFileCategoryInputTableView is a generic table component that is used
// in form to add, delete and edit a row for file category configuration setup.
//
define([
  'views/base/tableinput/TableInputView',
  // Utils
  'utils/AppConstants',
  'utils/AppUtil',
  // Data
  'data/DataProperties',
  // Models
  'models/dashboard/FileTypeCategoryModel'],
function(
  TableInputView,
  // Utils
  AppConstants,
  AppUtil,
  // Data
  DataProp,
  // Models
  FileTypeCategoryModel) {

  'use strict';

  // View
  //-----
  return TableInputView.extend({

    // Constants
    //----------

    name: 'FSUpdateFileCategoryTableInputView',

    // Properties
    //-----------

    // The id field to be used for unique identifier for the data row.
    idAttribute: DataProp.ID,

    // Model attribute for the row to be embedded.
    modelAttribute: null,

    // Entity Name
    entityName: AppConstants.ENTITY_FILE_SERVER,

    // Caption
    addCaption: ' New file category',

    // Functions
    //----------

    // @inherited
    initialize: function(options) {
      options.columns = this.getResourceTableColumns();
      options.filterAttributes = [DataProp.METRIC];
      TableInputView.prototype.initialize.call(this, options);
      this.parent = options.parent;

      // Required to remove filter from top
      this.isFilterEnabled = false;

      // File category model
      this.fileTypeCategoryModel = new FileTypeCategoryModel();
    },

    // @private
    // Generate table data
    getResourceTableColumns: function() {
      return [
        {
          columnName: 'Category',
          className : ' category',
          renderer  : function(data) {
            let category = '';
            if (data && data.metric) {
              category = AppUtil.getCategoryDisplayName(data.metric);
            }
            return category;
          }
        },
        {
          columnName: 'Extensions',
          className : ' extension',
          tooltipText: 'Extensions are case insensitive and should be comma \
            separated, "." and "/" is not allowed.',
          renderer  : function(data) {
            let extensions = '';
            if (data && data.values) {
              extensions = data.values;
            }

            return extensions;
          }
        }
      ];
    },

    // @override
    // @param filterByValue - return only rows matching this value to
    //                        filterAttributes.
    filterDataItems: function(filterByValue) {
      let dataItems = _.filter(this.dataItems, function(data) {
        let found = false;
        // If model is passed then retreive the attribute.
        if (data instanceof Backbone.Model) {
          data = data.attributes;
        }
        // Check if any of the filterAttribute match
        _.some(this.filterAttributes, function(attribute) {
          let value = data[attribute];
          if (filterByValue.indexOf(value) < 0) {
            found = true;
            return found;
          }
        });
        return found;
      }, this);

      return dataItems;
    },

    // @override
    // To filter data before rendering the table
    // @param filterByValue - Display only rows matching this value to
    //                        filterAttribute.
    renderTable: function(filterByValue) {
      // Filter data before rendering
      filterByValue = ['other_file_types', 'no_extensions'];
      // Add another param in dataItems for supporting backslash in table edit
      // Remove backslash from category and assign it to new attribute for ID
      // e.g. data \ @ / will be changed to data  @ /
      _.each(this.dataItems, function(item, key) {
        item.id = item.metric.replace(/\\/g, '');
      });

      // Sort the data(list of objects) based of key 'metric'
      this.dataItems = _.sortBy(this.dataItems, function(item) {
        return item.metric.toLowerCase();
      });
      this.dataItems = this.filterDataItems(filterByValue);
      TableInputView.prototype.renderTable.apply(this, arguments);
    },

    // @private
    // Format data to save
    // Return format(json object: { "video": ["mp4"], "audio": ["mp3"], ... }
    formatDataToSave: function(categorySet) {
      let categoryData = {};
      categorySet.map(function(dataItem) {
        categoryData[dataItem.metric] = dataItem.values;
      });

      return categoryData;
    },

    // Functions (Event Handler)
    //--------------------------

    // @override
    // Event handler for edit link. Overridden in order to get previous values
    onClickEditLink: function(e) {
      TableInputView.prototype.onClickEditLink.apply(this, arguments);
      const selectedRow = this.getRowFromActionLink(e);
      this._previousValue = this.getRowData(selectedRow);
      this.parent.clearHeader();
    },

    // @inherited
    // Event handler for delete link.
    onClickDeleteLink: function(e) {
      this.parent.clearHeader();
      // Ask for confirmation.
      this.openConfirmationPopup(AppConstants.CONFIRM_DELETE_MSG,
        this.deleteRow.bind(this), e);
    },

    // @private
    // Ask for confirmation.
    openConfirmationPopup: function(message, actionMethod, e) {
      $.nutanixConfirm({
        msg: message,
        yes: function() {
          actionMethod(e);
        },
        context: this
      });
    },

    // @override
    // Event handler for delete link.
    // Overridden to remove the deleted entity from the list
    deleteRow: function(e) {
      // Restrict user from deleting all the categories.
      // So if only one category exists in the system,
      // dont let the user delete it.
      if (this.dataItems.length === 1) {
        this.parent.showHeaderError('Cannot delete all the configurations',
          null, true);
        return;
      }

      const selectedRow = this.getRowFromActionLink(e);
      const deleteRowData = this.getRowData(selectedRow);

      // Remove deleted entity from the list
      const newCategorySet = this.removeCategory(deleteRowData.categoryName);

      this.updateConfig(e, AppConstants.ACTION_DELETE, newCategorySet);
    },

    // @override
    // Save the row/file type category
    saveRow: function(e) {
      let isNewRow = this.getRowToBeAddedElement(), isNew = false;
      // Check if new row is added
      if (isNewRow.length) {
        isNew = true;
      }

      // Validate config before save
      const validationMsg = this.validateConfig(e, isNew);
      if (validationMsg.length) {
        this.parent.showHeaderError(validationMsg.join('<br/>'), null, true);
        return;
      }

      // Remove old category from the list
      const selectedRow = this.getRowFromActionLink(e);
      const dataToSave = this.getRowData(selectedRow);
      let newCategorySet = JSON.parse(JSON.stringify(this.dataItems));
      if (!isNew) {
        newCategorySet = this.removeCategory(this._previousValue.categoryName);
      }

      // Add new category to the list
      const newCategory = {
        'metric': dataToSave.categoryName,
        'values': dataToSave.extensions
      };
      newCategorySet.push(newCategory);

      // Update config
      this.updateConfig(e, AppConstants.ACTION_SAVE, newCategorySet);
    },

    // @override
    // Remove previous error messages if any
    cancelRow: function() {
      TableInputView.prototype.cancelRow.apply(this, arguments);
      this.parent.clearHeader();
    },

    // @private
    // Remove category from the list
    removeCategory: function(categoryName) {
      let newCategorySet = JSON.parse(JSON.stringify(this.dataItems));
      newCategorySet = _.reject(newCategorySet, function(dataItem) {
        return dataItem.metric === categoryName;
      });

      return newCategorySet;
    },

    // @private
    // Save new configuration
    updateConfig: function(e, action, categorySet) {
      // Show Loading message
      this.parent.showHeaderLoading('Updating file category configuration.');
      let _this = this, fsCategoryModel = new FileTypeCategoryModel();
      let categoryData = this.formatDataToSave(categorySet);

      // Pass others and no extensions as they are not shown on the UI
      categoryData.other_file_types = null;
      categoryData.no_extensions = [''];

      const fileCategory = {
        'categories': categoryData
      };

      // Disable all events untill save is complete
      this.undelegateEvents();
      fsCategoryModel.getURL(AppConstants.METHOD.SAVE);
      fsCategoryModel.save(fileCategory, {
        success: function(model, response) {
          // Bind all events back on request complete
          _this.delegateEvents(_this.events);

          // Update dataItems
          _this.dataItems = categorySet;

          if (action === AppConstants.ACTION_SAVE) {
            TableInputView.prototype.saveRow.call(_this, e);
          } else if (action === AppConstants.ACTION_DELETE) {
            TableInputView.prototype.deleteRow.call(_this, e);
          }
          _this.parent.showHeaderSuccess('Successfully update file \
            category configuration.');

          // Update the row input values by re-rendering the table
          _this.renderTable();
        },
        error: function(model, xhr) {
          // Bind all events back on request complete
          _this.delegateEvents(_this.events);
          const errorMsg = AppUtil.getErrorMessage(xhr) ||
            'Error in saving file category configuration.';
          _this.parent.showHeaderError(errorMsg);
        }
      });
    },

    // @private
    // Gather the file category information from the data row.
    getRowData: function(rowToBeSaved) {
      // Get category name to be saved in ES and display name
      const categoryName = rowToBeSaved.find('.category').val(),
            esCategoryName = AppUtil.getCategoryESName(categoryName);

      // Remove last character if it is comma
      let extensionVal = rowToBeSaved.find('.extension').val();
      if (extensionVal.charAt(extensionVal.length - 1) === ',') {
        extensionVal = extensionVal.substring(0, extensionVal.length - 1);
      }
      // Split the extensions with , and put it in array
      extensionVal = extensionVal.split(',');

      return {
        categoryName: esCategoryName,
        displayName : categoryName,
        extensions  : extensionVal,
        uuid        : rowToBeSaved.attr('data-id')
      };
    },

    // @private
    // Validate category config before saving
    // @params: e(selected element) - element clicked
    // isNew(Boolean): true if new category added, false if existing category
    // is modified
    validateConfig: function(e, isNew) {
      const rowToBeSaved = this.getRowFromActionLink(e);
      const dataToValidate = this.getRowData(rowToBeSaved);
      // To show error when user clicks on save without editing configurations
      let isCategoryNameUpdated = true;

      const defaultCategoryValidationMsg = 'Category name is case insensitive \
      and can not be ';
      let validateCategoryMsg = '', validateExtMsg = '', validationMsg = [],
          categoryName = dataToValidate.categoryName;
      const lowerCaseCategoryName = categoryName.toLowerCase();
      if (!categoryName) {
        // Category name is blank
        validateCategoryMsg = 'Please enter category name.';
      } else if (lowerCaseCategoryName === 'other_file_types' ||
        lowerCaseCategoryName === 'others') {
        // Category name should not be "other_file_types" or "others"
        validateCategoryMsg = defaultCategoryValidationMsg +
          ' "Others" or "other_file_types".';
      } else if (lowerCaseCategoryName === 'no_extensions' ||
        lowerCaseCategoryName === 'no extension') {
        // Category name should not be "no_extensions"
        validateCategoryMsg = defaultCategoryValidationMsg +
          ' "No extension" or "no_extensions".';
      } else if (categoryName !== this._previousValue.categoryName) {
        // Category name updated
        validateCategoryMsg = this.validateCategoryName(
          dataToValidate.displayName);
      } else {
        isCategoryNameUpdated = false;
      }
      if (validateCategoryMsg) {
        validationMsg.push(validateCategoryMsg);
      }

      // Check if any new unique extensions are added or removed
      // 1. previous extension length 1 (pdf), add another extension (pdf),
      // unique extension length will remain one and filter will not return
      // any unique extensions
      // 2. previous extension length 2 (pdf, txt), remove (txt) and add (pdf),
      // updated length will remain 2 however unique extension length will be 1
      const hasNewExtensions = _.uniq(dataToValidate.extensions).length !==
        this._previousValue.extensions.length ||
        dataToValidate.extensions.length !==
        this._previousValue.extensions.length;
      const uniqueExt = _.filter(dataToValidate.extensions, function(ext) {
        // Check if empty extension or new extension
        return !this._previousValue.extensions.includes(ext) || ext === '';
      }, this);
      if (hasNewExtensions || uniqueExt.length) {
        // Validate extensions are valid or not
        validateExtMsg = this.validateExtensions(dataToValidate, isNew);
        if (validateExtMsg) {
          validationMsg.push(validateExtMsg);
        }
      } else if (!isCategoryNameUpdated) {
        validationMsg.push('No changes in the configuration to be updated.');
      }

      return validationMsg;
    },

    // @private
    // Category name should be unique and can include any characters
    validateCategoryName: function(categoryName) {
      let validationMsg = '';

      const categoryESName = AppUtil.getCategoryESName(categoryName);

      // Duplicate category name
      const isDuplicate = _.find(this.dataItems, function(category) {
        // Category name to be matched with the value that will be stored in ES
        return category.metric === categoryESName ||
          category.metric.toLowerCase() === categoryName.toLowerCase();
      });
      // Show error if the category name is duplicate, if default category does exists
      // in configuration, allow the user to add the category.
      if (isDuplicate) {
        validationMsg = 'Category name is case insensitive and should be \
         unique.';
        if (AppConstants.CATEGORIES[categoryESName.toUpperCase()]) {
          validationMsg += ' It cannot be "' + categoryESName + '"';
          if (categoryESName !== categoryName) {
            validationMsg += ' or "' + categoryName + '".';
          } else {
            validationMsg += '.';
          }
        }
      }

      return validationMsg;
    },

    //
    // @param exts Extensions that need to be validated
    // @param dupExtensions Duplicate extensions
    validateDuplicateExtension: function(exts, dupExtensions) {
      const allExtensions = [];
      // Push all extensions in lower case in single array
      _.each(exts, function(extension) {
        allExtensions.push({ extension: extension.toLowerCase() });
      });

      // Count the occrrence of an extension in the category
      const groupedByCount = _.countBy(allExtensions, 'extension');
      // Check if the occurrence is more than 1
      _.each(groupedByCount, function(occurrence, extension) {
        if (occurrence > 1) {
          dupExtensions.push(extension);
        }
      });
    },

    // @private
    // Extensions name should be unique, should not include "."
    // Same ext not in same category
    // Same ext not in other categories as well
    validateExtensions: function(dataToValidate, isNew) {
      let validationMsg = '', categoryName = dataToValidate.categoryName,
          exts = dataToValidate.extensions;

      // Check if existing category name is modified or not
      if (!isNew && categoryName !== this._previousValue.categoryName) {
        categoryName = this._previousValue.categoryName;
      }

      // Should not include "" - blank
      const blankExt = exts.indexOf('');
      if (blankExt > -1) {
        // Blank extension defined
        validationMsg = 'Extension name can not be blank.';
        return validationMsg;
      }

      // Check if extension is valid and show appropriate error message
      const extensionValidation = [];
      _.each(exts, function(ext) {
        // Get the error type if extension is invalid else empty
        const msg = AppUtil.extensionValidityCheck(ext, false);
        if (msg && !extensionValidation[msg]) {
          extensionValidation[msg] = true;
          // If the error message is invalid length, show appropriate message
          if (msg === 'invalid_length') {
            validationMsg += 'Extensions should have less than or equal to 259 \
            characters. ';
            // If the message format is invalid, show appropriate message
          } else if (msg === 'invalid_format') {
            validationMsg += 'Extension name should not include "." or "/". ';
          }
        }
      });

      // Same ext in other categories
      const duplicateValues = [], _this = this;
      _.each(this.dataItems, function(category) {
        // Get category display name to show appropriate message
        const dupCategoryObject = {
          name: AppUtil.getCategoryDisplayName(category.metric)
        };

        // Get only re-occurring extensions
        const dupExtensions = [];
        // If the category to be validated is the same as being edited
        if (category.metric === categoryName) {
          _this.validateDuplicateExtension(exts, dupExtensions);
        } else {
          // Check all extensions under the category
          _.each(category.values, function(cat) {
            // Match all categories extensions with currently present exts in edit row
            _.each(exts, function(extension) {
              if (extension.toLowerCase() === cat) {
                dupExtensions.push(cat);
              }
            });
          });
        }

        // If there are duplicate extensions then push the same to parent holder array
        if (dupExtensions.length) {
          dupCategoryObject.values = dupExtensions;
          duplicateValues.push(dupCategoryObject);
        }
      });

      if (isNew) {
        const dupExtensions = [];
        const dupCategoryObject = {
          name: dataToValidate.displayName
        };
        // Push all extensions in lower case in single array
        this.validateDuplicateExtension(exts, dupExtensions);
        // If there are duplicate extensions then push the list to parent
        // holder array
        if (dupExtensions.length) {
          // Assign duplicate extensions to dupCategoryObject
          dupCategoryObject.values = dupExtensions;
          // Put the duplicate category object in parent duplicate values array
          duplicateValues.push(dupCategoryObject);
        }
      }

      // Same extension cannot be used in multiple or same categories
      if (duplicateValues.length) {
        const dupCategories = _.pluck(duplicateValues, 'name');
        const dupExtensions = _.pluck(duplicateValues, 'values');
        const dupExtensionsGrammer = dupExtensions.length > 1 ? 'are' : 'is';
        const categoryGrammer = dupCategories.length > 1
          ? 'categories' : 'category';
        validationMsg = 'All extensions are case insensitive. "' +
          dupExtensions.flatten().join('", "') + '" ' +
          dupExtensionsGrammer + ' already defined under "' +
          dupCategories.join('", "') + '" ' + categoryGrammer + '.';
      }

      return validationMsg;
    }
  });
});
