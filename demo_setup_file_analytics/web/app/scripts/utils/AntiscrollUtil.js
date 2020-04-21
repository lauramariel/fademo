//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// AntiscrollUtil contains antiscroll utility functions
//

define([
    // Core
    'antiscroll'
  ],
  function(
    // References of core
    Antiscroll
  ) {

    'use strict';

    // - If sizes param set:
    // Set the computed sizes on the elements inside the antiscroll container
    // before (re)applying the antiscroll
    // - If no sizes set:
    // Reset the sizes of the elements inside the antiscroll container
    // in order to recompute everything before (re)applying the antiscroll
    // @private
    // @param elt (required) - Parent DOM element (antiscroll container)
    //   containing the elements to set/reset
    // @param sizes (optional) - Object with properties:
    //   width - width to set
    //   height - height to set
    var _setSizes = function(elt, sizes) {
      var isReset = !(sizes && sizes.width && sizes.height);

      elt.find('.box-wrap, .antiscroll-inner').css({
        width: isReset ? '' : sizes.width,
        height: isReset ? '' : sizes.height
      });

      // Fix for Firefox (Windows and Mac - When not on trackpad or Magic
      // Mouse) and IE on Windows. If the width/height is not set, the browser
      // will shrink the div to add cushion for its own scrollbar. By setting
      // a minimum width/height equal to the parent wrapper div (in this case
      // 'box-wrap'), the issue will be resolved.
      elt.find('.box-inner').css({
        minWidth: isReset ? '' : sizes.width,
        minHeight: isReset ? '' : sizes.height
      });
    };

    // @private
    // @param el (required) - element for AntiScroll to be applied
    // @param width (optional) - set width of AntiScroll wrapper
    // @param height (optional) - set height of AntiScroll wrapper
    // @param option (optional) - extra options to be passed through
    var _applyAntiScroll = function(el, width, height, options) {
      if (!el) {
        throw new Error('el doesn\'t exist.');
      }
      var targetEl = $(el),
          antiScrollWidth,
          antiScrollHeight;

      // Skip when element is not visible.
      // When the element is not visible, applying antiscroll might set
      // height and width to 0, which will cause problem if later the element
      // is displayed but antiscroll is not re-applied.
      if (!targetEl.is(':visible')) {
        return;
      }

      // Check if there are any options, otherwise declare as empty object.
      options = options || {};

      // Clear width of elements before recalculating (optional)
      if (options.ntnxClearWidth) {
        targetEl.find('.box-wrap').width('auto');
        targetEl.find('.antiscroll-inner').width('auto');
      }

      // Add custom classes if they exist (optional)
      if (options.classnames) {
        targetEl.addClass(options.classnames);
      }

      // Add a track
      if (options.track) {
        targetEl.addClass('antiscroll-track');
      }

      antiScrollWidth  = width  || targetEl.parent().width();
      antiScrollHeight = height || targetEl.parent().height();

      _setSizes(targetEl, {
        width: antiScrollWidth,
        height: antiScrollHeight
      });

      targetEl.antiscroll(options);

      // Show the scroll bar the first time
      if (options && options.ntnxShowFirstTime) {
        targetEl.css('visibility','visible');
      }

      // Execute any callbacks if they exist
      if (options.callback && _.isFunction(options.callback)) {
        options.callback();
      }
    };

    var AntiscrollUtil = {

      // Name for logging and i18n purposes
      name : 'AntiscrollUtil',

      // Functions (Antiscroll)
      //-----------------------

      // Applies the antiscroll on the passed el. If the width and height
      // are not specified, the width and height of the el's parent will be
      // used. If you're getting the width and height of the el's parent, make
      // sure that you set parent's CSS overflow to hidden;
      //
      // (OPTIONAL)
      // If you want to add a track, add the 'track' property to the options
      // object. Set the value to true to enable the track.
      // You may have to use some extra CSS to line up the track and thumb.
      //
      // The el should have the HTML DOM structure:
      //
      //  <div class="antiscroll-wrap">
      //    <div class="box-wrap">
      //      <div class="antiscroll-inner">
      //        <div class="box-inner">
      //          Put your content here
      //        </div>
      //      </div>
      //    </div>
      //  </div>
      applyAntiScroll: function() {
        var _this = this;
        var _arguments = arguments;
        // Delay antiscroll to next cycle. Otherwise in some cases
        // if antiscroll() is called before element is appended to DOM,
        // antiscroll() doens't calculate width/height properly.
        setTimeout(function(){
          _applyAntiScroll.apply(_this, _arguments);
        },0);
      },


      // To apply antiscroll on the div with default height
      addAntiScroll: function() {
        $('.db-list .antiscroll-wrap').antiscroll({
          autoHide: false
        });
      },

      // Rebuild the whole antiscroll
      // The popup will then be resized according to css rules and content
      // Then the antiscroll will be applied
      // @public
      // @param elt (required) - element on which the antiscroll is applied
      // @param options (optional) - extra options to be passed to antiscroll
      rebuildAntiScroll: function(elt, options) {

        options = options || {};
        var targetEl = elt,
            antiScrollWidth,
            antiScrollHeight;

        _setSizes(targetEl);

        antiScrollWidth  = targetEl.parent().width();
        antiScrollHeight = targetEl.parent().height();

        _setSizes(targetEl, {
          width: antiScrollWidth,
          height: antiScrollHeight
        });

        targetEl.antiscroll(options);
      },

      // Refresh the scroll and scrollbars to fit the content
      // No resizing of the current popup
      // @public
      // @param antiscrollInstance (required)
      //   - Current instance of Antiscroll to refresh
      refreshAntiscroll: function(antiscrollInstance) {
        if (!antiscrollInstance) {
          return;
        }
        antiscrollInstance.refresh();
        if (antiscrollInstance.vertical) {
          antiscrollInstance.vertical.update();
        }
      }

    };

    return AntiscrollUtil;
  }
);
