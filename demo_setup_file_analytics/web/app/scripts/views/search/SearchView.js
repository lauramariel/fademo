//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// SearchView enables the user to view the files
// according to their search input value.
define([
  // Views
  'views/base/pages/BasePageView',
  'views/search/filesearch/FileSearchTableView',
  'views/search/foldersearch/FolderSearchTableView',
  'views/search/usersearch/UserSearchTableView',
  'views/search/usermachinesearch/UserMachineSearchTableView',
  'views/search/AutoCompleteSearchView',
  // Templates
  'text!templates/search/SearchView.html',
  // Utils
  'utils/AppUtil',
  'utils/RoutingURLConstants',
  'utils/AppConstants',
  // Components
  'components/Components',
  // Models
  'models/filesearch/FileSearchModel',
  'models/usersearch/UserSearchModel'],
  function(
    // Views
  BasePageView,
  FileSearchTableView,
  FolderSearchTableView,
  UserSearchTableView,
  UserMachineSearchTableView,
  AutoCompleteSearchView,
  // Templates
  searchViewTemplate,
  // Utils
  AppUtil,
  RoutingURLConstants,
  AppConstants,
  // Components
  Components,
  // Models
  FileSearchModel,
  UserSearchModel) {
  'use strict';

  searchViewTemplate = _.template(searchViewTemplate);

  var SearchView = BasePageView.extend({

    // Properties
    //-----------

    // @inherited
    pageId: AppConstants.SEARCH_PAGE_ID,

    // @inherited
    defaultSubPageId: AppConstants.SUBPAGE_SEARCH,

    // View for autocomplete search.
    autoCompleteSearchView : null,

    // @override
    events: {
      'click .fileSearchBtn'   : 'searchFile',
      'click .searchCategory'  : 'changePlaceHolder',
      'input #fileSearch'      : 'onSearchInput',
      'change #fileSearch'     : 'onMenuClick'
    },

    // @override
    initialize: function(options) {
      BasePageView.prototype.initialize.call(this, options);
      if (options.searchVal) {
        options.searchVal = decodeURIComponent(options.searchVal);
      }
    },

    // Functions (Event Handlers)
    //---------------------------
    // @override
    // Function that handles subpage and data related actions. This is called
    // after all the page render animation is done.
    onShowSubPage: function(subPageId, options) {
      // Append page to its default sub page
      let pm = this.$('.n-page-master');
      $(pm).find("[subpage='" + subPageId + "']").html(searchViewTemplate({
        Components : Components
      }));

      // If autocomplete view is already present, destroy it.
      if (this.autoCompleteSearchView) {
        this.autoCompleteSearchView.remove();
      }

      // Create new auto suggest view.
      // wrapperEl is the element to which the auto suggest div should append.
      // containerEl is the element where the selected result will be placed.
      this.autoCompleteSearchView = new AutoCompleteSearchView({
        wrapperEl      : $('.search-input'),
        containerEl    : $('#fileSearch')
      });

      if (this.options.searchVal && this.options.searchInput) {
        // If search for what(file/user) as well as the name of entity to be
        // search exists.
        let searchVal = this.options.searchVal,
            searchClass = 'searchFileInput';

        switch (this.options.searchInput) {
          case 'users':
            searchClass = 'searchUserInput';
            break;
          case 'folders':
            searchClass = 'searchFolderInput';
            break;
          case 'ips':
            searchClass = 'searchIpInput';
            break;
        }

        // Render the search input depending on the input value.
        this.$('.' + searchClass).click();

        // Render the text to be searched depending on the input value.
        this.$('#fileSearch').val(searchVal);

        // Search for th entered text.
        this.searchFile();
      } else if (!this.options.searchVal) {
        // If there is no search text, disable the search button.
        this.$('.fileSearchBtn').prop('disabled', true);
      }
    },

    // @private
    // Change the placeholder in the search input field
    // as the option changes.
    changePlaceHolder: function(e) {
      let target = $(e.currentTarget),
          searchInput = target.val();

      // Find out all the radio buttons.
      var radioBtns = $('.searchRadioBtn').find("input[type='radio']");

      // Uncheck the rest of the radio buttons other than selected category.
      var uncheckRestRadioButtons = function(radiobtn) {
        if (radiobtn.value !== searchInput) {
          radiobtn.checked = false;
        }
      };

      _.each(radioBtns, uncheckRestRadioButtons);

      // Make the search text field blank on change of dropdown.
      if (this.$('#fileSearch').val()) {
        this.$('#fileSearch').val('');
        // Manage enabling and disabling search button.
        this.manageSearchButton();
        // Hide the suggested results on click of search button.
        $('.auto-complete-results').hide();
      }

      let placeHolder = 'Enter the file name';
      // Change the placeholder in the search text box based on the radio
      // button selected.
      switch (searchInput) {
        case 'users':
          placeHolder = 'Enter the user name';
          break;
        case 'folders':
          placeHolder = 'Enter the folder name';
          break;
        case 'ips':
          placeHolder = 'Enter the client IP';
          break;
      }

      this.$('#fileSearch').attr('placeholder', placeHolder);
    },

    // @private
    // Fetches the data as per the search field and option.
    searchFile: function(e) {
      // Hide the suggested results on click of search button.
      $('.auto-complete-results').hide();

      this.searchVal = this.$('#fileSearch').val();
      let searchInput;

      var radioBtns = $('.searchRadioBtn').find("input[type='radio']");
      var uncheckRestRadioButtons = function(radiobtn) {
        if (radiobtn.checked) {
          searchInput = radiobtn.value;
        }
      };

      _.each(radioBtns, uncheckRestRadioButtons);

      if (this.searchVal) {
        // Search template while searching for a particular value.
        let searchTempl = _.template(RoutingURLConstants.SPECIFIC_SEARCH, {
          searchInput : searchInput,
          searchVal   : encodeURIComponent(this.searchVal),
          fileServer  : this.options.fsId
        });
        // Update the URL for search.
        AppUtil.updateUrl(searchTempl);

        // Add search table.
        this.addSearchTable(searchInput);
      }
      return false;
    },

    // @private
    // Sets the time out interval after which search should take place.
    searchText: function(e) {
      if (e.target.value) {
        // Adding a temporary fix so that auto suggest doesnt happen
        // for client ip as this feature is not supported right now.
        // TODO: Remove this check once auto suggest is in place.
        if ($('.searchIpInput').is(':checked')) {
          $('.auto-complete-results').hide();
          return;
        }

        // If there is some input in the search text box, show suggestions.
        let searchValue = encodeURIComponent(e.target.value.trim());
        // Show the results div.
        this.autoCompleteSearchView.clearItems();
        $('.auto-complete-results').show();
        this.autoSuggestSearch(searchValue);
      } else {
        // Hide the results div.
        $('.auto-complete-results').hide();
      }
    },

    // @private
    // Adds search table in the page view.
    addSearchTable: function(param) {
      if (this.searchTableView) {
        this.searchTableView.remove();
      }

      let resultsEl = this.$('.file-search-results'),
          SearchTableView = FileSearchTableView;

      switch (param) {
        case 'users':
          SearchTableView = UserSearchTableView;
          break;
        case 'folders':
          SearchTableView = FolderSearchTableView;
          break;
        case 'ips':
          SearchTableView = UserMachineSearchTableView;
          break;
      }

      this.searchTableView = new SearchTableView({
        searchVal     : this.searchVal,
        defaultMinRows: 10
      });


      // Append the newly initialized datatable
      this.getDOM('.file-search-results')
        .append(this.searchTableView.render().el);

      // Start Fetch
      this.searchTableView.onStartServices();
    },

    // Functions (Event Handlers)
    //---------------------------

    // @private
    // Manages enabling and disabling of search button.
    manageSearchButton: function() {
      if (this.$('#fileSearch').val()) {
        this.$('.fileSearchBtn').prop('disabled', false);
      } else {
        this.$('.fileSearchBtn').prop('disabled', true);
      }
    },

    // @private
    // Auto suggests the entered text in the search field.
    // @param searchText is the text for which autosuggestion is required.
    autoSuggestSearch: function(searchText) {
      let _this = this, objectType = '';
      if (searchText) {
        if ($('.searchFileInput').is(':checked') ||
          $('.searchFolderInput').is(':checked')) {
          let fileSearchModel = new FileSearchModel();

          // Set the object type in order to distinguish files and
          // folders.
          objectType = $('.searchFolderInput').is(':checked') ?
            AppConstants.FILE_SEARCH_TYPE.DIRECTORY
            : AppConstants.FILE_SEARCH_TYPE.FILE;

          fileSearchModel.getAutocompleteURL(searchText, objectType);
          fileSearchModel.fetch({
            success: function(data) {
              let fileSearchArr = [], i = 0,
                  len = Object.keys(data.attributes).length;
              if (len) {
                for (i=0; i<len; i++) {
                  fileSearchArr[i] = data.attributes[i];
                }
              }
              _this.autoCompleteSearchView.suggest(fileSearchArr, searchText);
            },
            error: function() {
              _this.autoCompleteSearchView.clearItems();
              $('.auto-complete-results').hide();
            }
          });
        } else if ($('.searchUserInput').is(':checked')) {
          let userSearchModel = new UserSearchModel();
          userSearchModel.getAutocompleteURL(searchText);
          userSearchModel.fetch({
            success: function(data) {
              let userSearchArr = [], i = 0,
                  len = Object.keys(data.attributes).length;
              if (len) {
                for (i=0; i<len; i++) {
                  userSearchArr[i] = data.attributes[i];
                }
              }
              _this.autoCompleteSearchView.suggest(userSearchArr, searchText);
            },
            error: function() {
              _this.autoCompleteSearchView.clearItems();
              $('.auto-complete-results').hide();
            }
          });
        }
      }
    },

    // Enables or disables search button based on input as well as
    // auto suggests results.
    onSearchInput: function(e) {
      this.manageSearchButton(e);
      this.searchText(e);
    },

    // @private
    // Close current menu and return a boolean indicating if the currently
    // open menu was the menu clicked.
    _closeCurrentMenu: function() {
      // Check if autocomplete div exists
      if ($('.auto-complete-results').length) {
        $('.auto-complete-results').hide();
      }
    },

    // @private
    // Handle clicking on show/hide menu button.
    onMenuClick: function(event) {
      event.stopPropagation();
      // Register click handler for mouse click outside of menus
      $(document).off('click', this._closeCurrentMenu)
        .on('click', this._closeCurrentMenu);
    }
  });
  // Returns the SearchView class object.
  return SearchView;
});
