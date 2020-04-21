//
// Copyright (c) 2018 Nutanix Inc. All rights reserved.
//
// BaseGridView renders the different elements as widgets on the page
// as per the user preferences in a grid structure.
define([
  // Core
  'gridster',
  // Views
  'views/base/pages/BasePageView',
  'views/base/DataTableTemplates',
  // Utils
  'utils/CommonTemplates',
  'utils/AntiscrollUtil',
  'utils/AppConstants',
  'utils/SubViewHelper',
  'utils/AppUtil',
  // Components
  'components/Components',
  // Templates
  'text!templates/base/BaseGridView.html'],
function(
  // Core
  Gridster,
  // Views
  BasePageView,
  DataTableTemplates,
  // Utils
  CommonTemplates,
  AntiscrollUtil,
  AppConstants,
  SubViewHelper,
  AppUtil,
  // Components
  Components,
  // Templates
  viewTemplate) {

  'use strict';

  // Layout template for dashboard.
  var selectTemplate = _.template(viewTemplate);

  //-------------------------------------------------------------------------
  // GRIDSTER EXTENSIONS
  //-------------------------------------------------------------------------
  // Custom functions
  var extensions = {

    // Updates the widget block width and height, including margins.
    resize_widget_dimensions: function(options) {
      if (options.widget_margins) {
        this.options.widget_margins = options.widget_margins;
      }

      if (options.widget_base_dimensions) {
        this.options.widget_base_dimensions = options.widget_base_dimensions;
      }

      this.$widgets.each($.proxy(function(i, widget) {
        var $widget = $(widget);
        this.resize_widget($widget);
      }, this));

      this.$widgets.sort(function(a, b) {
        var $a = $(a);
        var $b = $(b);
        var aRow = parseInt($a.attr('data-row'), 10);
        var bRow = parseInt($b.attr('data-row'), 10);
        var aCol = parseInt($a.attr('data-col'), 10);
        var bCol = parseInt($b.attr('data-col'), 10);
        if (aRow > bRow || (aRow === bRow && aCol < bCol)) {
          return 1;
        }
        return -1;
      });

      // We generate a new stylesheet
      this.generate_grid_and_stylesheet();
      this.get_widgets_from_DOM();
      this.set_dom_grid_height();

      return false;
    },

    // @inherited
    // Injects the given CSS as string to the head of the document.
    add_style_tag: function(css) {
      var d = document;
      var tag = d.createElement('style');

      d.getElementsByTagName('head')[0].appendChild(tag);
      tag.setAttribute('type', 'text/css');

      // Add an attribute to gridster style so we can remove it when grid
      // is resized.
      tag.setAttribute('generated-from', 'gridster');

      // Remove the previous gridster stylesheet(s)
      // NOTE: Gridster dynamically adds stylesheet in the head document.
      $('head [generated-from="gridster"]:not(:last)').remove();

      if (tag.styleSheet) {
        tag.styleSheet.cssText = css;
      } else {
        tag.appendChild(document.createTextNode(css));
      }
      return this;
    },

    // @inherited
    // It generates the necessary styles to position the widgets. We had to
    // override this function so we don't use the duplication logic here
    // since duplicate stylesheets are already removed.
    generate_stylesheet: function(opts) {
      var styles = '';
      var max_size_x = opts.max_size_x || this.options.max_size_x;
      var i;

      opts = opts || {};
      opts.cols = opts.cols || this.options.cols || this.cols;
      opts.rows = opts.rows || this.options.rows || this.rows;
      if (typeof this.options !== 'undefined') {
        opts.namespace = this.options.namespace;
        opts.widget_base_dimensions = this.options.widget_base_dimensions;
      }
      opts.widget_margins = opts.widget_margins ||
        this.options.widget_margins;
      opts.min_widget_width = (opts.widget_margins[0] * 2) +
        opts.widget_base_dimensions[0];
      opts.min_widget_height = (opts.widget_margins[1] * 2) +
        opts.widget_base_dimensions[1];

      // generate CSS styles for cols
      for (i = opts.cols; i >= 0; i--) {
        styles += (opts.namespace + ' [data-col="' + (i + 1) + '"] { left:' +
          ((i * opts.widget_base_dimensions[0]) +
            (i * opts.widget_margins[0]) +
            ((i + 1) * opts.widget_margins[0])) + 'px;} ');
      }

      // generate CSS styles for rows
      for (i = opts.rows; i >= 0; i--) {
        styles += (opts.namespace + ' [data-row="' + (i + 1) + '"] { top:' +
          ((i * opts.widget_base_dimensions[1]) +
            (i * opts.widget_margins[1]) +
            ((i + 1) * opts.widget_margins[1])) + 'px;} ');
      }

      for (var y = 1; y <= opts.rows; y++) {
        styles += (opts.namespace + ' [data-sizey="' + y + '"] { height:' +
          (y * opts.widget_base_dimensions[1] +
            (y - 1) * (opts.widget_margins[1] * 2)) + 'px;}');
      }

      for (var x = 1; x <= max_size_x; x++) {
        styles += (opts.namespace + ' [data-sizex="' + x + '"] { width:' +
          (x * opts.widget_base_dimensions[0] +
            (x - 1) * (opts.widget_margins[0] * 2)) + 'px;}');
      }

      return this.add_style_tag(styles);
    },

    // Utility method to return all the widgets present on a page.
    get_all_widgets : function() {
      return this.$widgets;
    },

    // Proper clean up for gridster. Unfortunately Gridster doesn't have a
    // a public API to clean up the grids.
    destroyGridster: function() {
      if (this.drag_api) {
        this.drag_api.destroy();
        this.$el.removeData('drag');
      }
      this.$el.removeData('gridster');
      this.$el.empty();
    },

    // @override
    // Adding vantagePoint id in the widget.
    add_widget : function(html, size_x, size_y, col, row, id) {
        var pos;
        size_x = size_x ||  1;
        size_y = size_y || 1;

        if (!col & !row) {
          pos = this.next_position(size_x, size_y);
        }else{
          pos = {
            col: col,
            row: row
          };

          this.empty_cells(col, row, size_x, size_y);
        }

        var $w = $(html).attr({
          'data-col': pos.col,
          'data-row': pos.row,
          'data-sizex' : size_x,
          'data-sizey' : size_y,
          'data-id'    : id
        }).addClass('gs_w').appendTo(this.$el).hide();

        this.$widgets = this.$widgets.add($w);

        this.register_widget($w);

        this.add_faux_rows(pos.size_y);
        //this.add_faux_cols(pos.size_x);

        this.set_dom_grid_height();

        return $w.fadeIn();
       },

    // @inherited
    // This is to fix the overlapping bug.
    // Check issue https://github.com/ducksboard/gridster.js/issues/4
    // for more details.
    move_widget_down: function($widget, y_units) {
      if (y_units <= 0) { return false; }
      var el_grid_data = $widget.coords().grid;
      var actual_row = el_grid_data.row;
      var moved = [];
      var y_diff = y_units;

      if (!$widget) { return false; }

      if ($.inArray($widget, moved) === -1) {

        var widget_grid_data = $widget.coords().grid;
        var next_row = actual_row + y_units;
        var $next_widgets = this.widgets_below($widget);

        this.remove_from_gridmap(widget_grid_data);

        $next_widgets.each($.proxy(function(i, widget) {
          var $w = $(widget);
          var wd = $w.coords().grid;
          var tmp_y = this.displacement_diff(
            wd, widget_grid_data, y_diff);

          if (tmp_y > 0) {
            this.move_widget_down($w, tmp_y);
          }
        }, this));

        widget_grid_data.row = next_row;
        this.update_widget_position(widget_grid_data, $widget);
        $widget.attr('data-row', widget_grid_data.row);
        this.$changed = this.$changed.add($widget);

        moved.push($widget);
      }
    }
  };

  // Add the new function(s) to the gridster core library
  $.extend($.Gridster, extensions);

  var BaseGridView = BasePageView.extend({

    // Properties
    //-----------

    // @inherited
    pageId: '',

    // @inherited
    defaultSubPageId: '',

    // The model for this view.
    model: null,

    // The subviewHelper for this view.
    subViewHelper: null,

    // Block dimension constants
    BLOCK_WIDTH_MAX  : 550,
    BLOCK_WIDTH_MIN  : 110,
    BLOCK_HEIGHT_MAX : 156,
    BLOCK_HEIGHT_MIN : 135,

    // Max/Min number of blocks per perspective
    BLOCK_COL_MIN : 8,
    BLOCK_ROW_MIN : 100,

    // Placeholder for the first width of the perspective. We have to do this
    // because Gridster overrides the previously set css width.
    PERSPECTIVE_WIDTH : null,

    // Template vantage point widget
    VANTAGE_POINT_WIDGET:
      '<li class="n-vantage-point-holder">  \
       </li>',

    // Template for default vantage point content
    VANTAGE_POINT_CONTENT: _.template(`
      <div class="n-vantage-point <%= className %>">
        <div class="n-title">
          <span class="lblTitle title" title="<%= title %>">
            <%= title %>
            <span class="ntnxMoreInfo hide"></span>
          </span>
          <div class="vp-title-options-container vpTitleOptionsContainer">
            <div class="vp-title-options vpTitleOptions"></div>
          </div>
        </div>
        <div class="n-content">
          <%= content %>
        </div>
      </div>`
    ),

    // Content
    CUSTOMIZED_CONTENT_COLUMN:
      '<div class="n-content-column-customized"> \
        <div class="n-column-content n-column-content-1">  \
        </div>  \
        <div class="n-column-content n-column-content-2">  \
        </div>  \
       </div>',

    CUSTOMIZED_CONTENT_SECTION:
      '<div class="n-content-column-customized"> \
        <div class="n-column-content">  \
        </div>  \
       </div>',

    CUSTOMIZED_VERTICAL_SECTION:
      '<div class="n-content-vertical-section-customized"> \
        <div class="n-vertical-content-1"> \
        </div> \
        <div class="n-vertical-content-2"> \
        </div></div>',

    // Gridster instance
    gridster: null,

    // Default duration for Page, in case need different value override in
    // child class
    pageDefaultDurationText: AppConstants.ALL_DURATION_OPTIONS_TEXT.LAST_24_HRS,

    pageDefaultDurationVal: AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_24_HRS,

    // Default number of rows for table
    pageDefaultNumberOfTableRows: 5,

    // @override
    initialize: function(options) {
      BasePageView.prototype.initialize.call(this, options);

      // Initialize the subviewhelper.
      this.subViewHelper = new SubViewHelper();

      $(window).on('resize.app', this.onResize);
    },

    // @override
    onShowSubPage: function(subPageId, options) {
      // Append page to its default sub page
      let parentElement = this.$('.n-page-master');
      const className = options.className || '';
      const template = selectTemplate({ className: className });
      $(parentElement).find("[subpage='" + subPageId + "']").html(template);

      // Renders the page template.
      this.$('.page-loader').html(DataTableTemplates.LOADING);

      let _this = this;
      let pb = this.$('.n-page-body');

      let blockDimension = this.getBlockDimension(pb);

      this.options.max_size_x = this.BLOCK_WIDTH_MAX;
      this.options.max_size_y = this.BLOCK_HEIGHT_MAX;
      this.options.namespace = '';

      this.gridster = this.$('.gridster ul').gridster({
        autogenerate_stylesheet: false,
        widget_margins: [10, 10],
        widget_base_dimensions: [
          blockDimension.width - 10,
          blockDimension.height],
        min_rows   : this.BLOCK_ROW_MIN,
        min_cols   : this.BLOCK_COL_MIN,
        max_size_x : this.BLOCK_WIDTH_MAX,
        max_size_y : this.BLOCK_HEIGHT_MAX
      }).data('gridster');

      // Generate style sheet for gridster only once otherwise
      // it is called as part of add_widget everytime
      this.gridster.generate_stylesheet(this.options);

      // Disable the grid from drag-and-drop. Gridster enables it by default.
      if (this.gridster) {
        this.gridster.disable();
      }

      // setTimeout(function() {
        _this.updateSubPage();
      // }, 100);
    },

    // @override
    updateSubPage: function() {
      this.renderElements();
    },

    // Returns the block dimension data in JSON format with width and height
    // as properties
    // @param gridDOM - the $el grid layout DOM
    getBlockDimension: function(gridDOM) {
      // Makes sure that the baseWidth is aligned with the window width even
      // though some pages have scrollbars or not.
      var wPad = AppUtil.hasScrollBar() || this.PERSPECTIVE_WIDTH ? 13 : 9;

      // Set the perspective width
      this.PERSPECTIVE_WIDTH = $(gridDOM).width() || this.PERSPECTIVE_WIDTH;

      var blockDimension = {},
          baseColMin = this.BLOCK_COL_MIN,
          baseRowMin = this.BLOCK_ROW_MIN,
          baseWidth = Math.floor(this.PERSPECTIVE_WIDTH / baseColMin) - wPad,
          baseHeight = Math.floor($(gridDOM).height() / baseRowMin) - 4;

      // Get the width
      blockDimension.width = Math.max(this.BLOCK_WIDTH_MIN,
        Math.min(this.BLOCK_WIDTH_MAX, baseWidth));
      // Get the height
      blockDimension.height = Math.max(this.BLOCK_HEIGHT_MIN,
        Math.min(this.BLOCK_HEIGHT_MAX, baseHeight));

      return blockDimension;
    },

    // Create the widget with its content.
    createWidget: function(content, widthRatio, HeightRatio, widgetContent) {
      let widget = this.gridster.add_widget(content, widthRatio, HeightRatio);
      widget.html(widgetContent);
      return widget;
    },

    // @private
    // This function will render the elements according to the preferences.
    renderElements: function() {
      // To be overriden in child class to
      // render different elements on the page.
    },

    // @private
    // Construct the widget content
    createWidgetContent: function(title, contentTempl, classes) {
      let widgetContent =
        this.VANTAGE_POINT_CONTENT({
          title : title,
          content: contentTempl,
          className: classes
        });

      return widgetContent;
    },

    // Allow users to create dynamic column content with antiscroll.
    // Renders the column content. After this call, usually followed by
    // updateColumnContent().
    // @param numberOfColumns - Number of columns to be constructed
    // @param $el - (optional) jQuery DOM element containing the table
    //        columns. If null, just return the HTML table template.
    renderColumnContent: function(numberOfColumns, $el) {
      var cols = CommonTemplates.CONTENT_COLUMN({
        numberOfColumns : numberOfColumns
      });
      if ($el) {
        $el.html(cols);
      } else {
        return cols;
      }
    },

    // Wrapper function for updating the column content for vantage points.
    // @param columnNumber - the column selected
    // @param applyAntiScroll - boolean to apply antiscroll
    // @param content - the HTML content
    updateWidgetColumnContent: function(columnNumber, applyAntiScroll,
      content, $el = this.$el) {
      this.updateColumnContent($el, content, columnNumber,
        applyAntiScroll);
    },

    // Updates the column content
    // @param $el - jQuery DOM element containing the table columns.
    // @param content - the HTML content in string format
    // @param columnNumber - the column selected
    // @param applyAntiScroll - boolean to apply antiscroll
    updateColumnContent: function($el, content, columnNumber, applyAntiScroll) {
      var $col = $el.find('.n-column-content-' + columnNumber);
      // Check for antiScroll
      if (applyAntiScroll) {
        // Check if antiscroll template has been added
        if (!$col.find('.n-content-inner').length) {
          $col.html(CommonTemplates.ANTISCROLL);
        }

        // Add the centerbox
        content = CommonTemplates.CONTENT_COLUMN_CELL_CENTERBOX({
          content : content
        });

        $col.find('.n-content-inner').html(content);
        AntiscrollUtil.applyAntiScroll($el.find('.antiscroll-wrap'));
      } else {
        $col.html(content);
      }
    },

    // @private
    // Get the default data display duration if duration parameter is null.
    getDefaultDataDuration: function(duration) {
      let noOfDays = duration || this.pageDefaultDurationVal;

      return noOfDays;
    },

    // @private
    // Update title in the widget header - adding tooltip.
    updateTitleOptions: function(widgetClass, text) {
      this.$('.' + widgetClass + ' .ntnxMoreInfo').removeClass('hide')
        .nutanixMoreInfo({
          title: text,
          placement: 'right'
        });
    },

    // @private
    // Add dropdown in the widget header.
    addTableHeaderDropdown: function(customClass, dropdownClass, type,
      allOptions = false, defaultDuration = null) {
      let dropDownOptions = AppUtil.constructDropDownData(type, allOptions,
        this.options.fsId, this.pageId);

      defaultDuration = defaultDuration || this.pageDefaultDurationText;

      // Filter template
      let filterDropDown = Components.dropdown({
        classes   : 'action-dropdown pull-right ' + dropdownClass,
        text      : defaultDuration,
        options   : dropDownOptions,
        variants  : '-compact',
        rightAlign: true
      });

      this.$('.' + customClass + ' .vpTitleOptions').html(filterDropDown);
    },

    // @private
    // Add legend below the table.
    addTableLegend: function(color, legendClass, text) {
      let legendSquare = CommonTemplates.OPERATION_CIRCLE({
        backgroundColor: color,
        border: color
      });
      this.$('.' + legendClass).html(legendSquare + '<span>' + text +
        '</span>').addClass('text-center');
    },

    // @private
    // Add legend below the graph.
    addGraphTableLegend: function(colorArr, legendClass, textArr) {
      for (let i = 0; i < colorArr.length; i++) {
        let legendSquare = CommonTemplates.OPERATION_CIRCLE({
          backgroundColor: colorArr[i],
          border: colorArr[i]
        });

        this.$('.' + legendClass).append(legendSquare +
          '<span class="graph-legend">' + textArr[i] +
          '</span>').addClass('text-center');
      }
    },

    // Append the loading template.
    addLoadingWrapper: function(widgetClass) {
      this.$('.' + widgetClass).append(DataTableTemplates.LOADING);
    },

    // Append the no data template.
    addNoDataWrapper: function(widgetClass) {
      this.$('.' + widgetClass).append(DataTableTemplates.NO_DATA);
    },

    // Registers the subview if it  doesn't exist already.
    // @param pageId is the Id of view to register.
    // @param pageClass is the class of the view to register.
    registerSubview: function(pageId, pageClass) {
      if (this.subViewHelper.get(pageId)) {
        this.subViewHelper.remove(pageId);
      }
      this.subViewHelper.register(pageId, pageClass);
    },

    // Functions (Event Handlers)
    //---------------------------

    onResize: function() {
      let pb = $('.n-page-body');
      // Get active n-page-body when user moves through
      // different pages
      if (pb.length > 0) {
        pb = pb.get(pb.length - 1);
      }

      // Resize window function
      let baseGrid = BaseGridView.prototype;

      let blockDimension = baseGrid.getBlockDimension(pb);
      let options = {
        max_size_x: baseGrid.BLOCK_WIDTH_MAX,
        cols: baseGrid.BLOCK_COL_MIN,
        rows: baseGrid.BLOCK_ROW_MIN,
        namespace: '',
        widget_margins: [10, 10],
        widget_base_dimensions: [blockDimension.width - 10,
          blockDimension.height]
      };
      $.Gridster.generate_stylesheet(options);
      // Set perspective width to null
      baseGrid.PERSPECTIVE_WIDTH = null;

      // Redraw elements where scroll is applied
      let $el = $('li.n-vantage-point-holder.gs_w > div');
      $el.each(function(key, element) {
        AntiscrollUtil.applyAntiScroll($(this).find('.antiscroll-wrap'));
      })
    },

    // Clear contents of the existing widget
    // @param className - class that holds the widget
    clearWidget: function(className) {
      // Hide loading
      this.hideLoading(className);
      // Reset the widget by clearing error and no data available display
      this.resetWidget(className);
    },

    // Clear noData element and error element, show display holder element
    resetWidget: function(className) {
      this.getDOM('.n-vantage-point.' + className + ' .noData').hide();

      // Remove existing error messages if any
      this.getDOM('.n-vantage-point.' + className + ' .n-error').remove();

      // Show child element which will render data
      this.getDOM('.n-vantage-point.' + className + ' > .n-content').show();

      // Show all the inner elements in the content holder
      this.getDOM('.n-vantage-point.' + className + ' > .n-content').children()
        .show();

    },

    // Hide the loading
    hideLoading: function(className) {
      this.getDOM('.n-vantage-point.' + className + ' .n-loading-wrapper')
        .hide();

      // Enable dropdown option on the widget title
      this.$el.find('.n-vantage-point.' + className + ' .dropdown > button')
        .removeClass('disabled');
    },

    // Show no data available.
    showNoDataAvailable: function(className) {
      this.getDOM('.n-vantage-point.' + className + ' > .n-content').hide();
      this.getDOM('.n-vantage-point.' + className + ' .noData').show();
    }
  });
  // Return the base grid view.
  return BaseGridView;
});
