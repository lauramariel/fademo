
(function ($) {

  /**
   * Initialize
   */

  // Flags for detecting 'extra' scroll padding
  // [NUTANIX Custom]
  Antiscroll.prototype.artificialVScroll = false;
  Antiscroll.prototype.artificialHScroll = false;

  /**
   * Augment jQuery prototype.
   */

  $.fn.antiscroll = function (options) {
    return this.each(function () {
      if ($(this).data('antiscroll')) {
        $(this).data('antiscroll').destroy();
      }

      $(this).data('antiscroll', new $.Antiscroll(this, options));
    });
  };

  /**
   * Expose constructor.
   */

  $.Antiscroll = Antiscroll;

  /**
   * Antiscroll pane constructor.
   *
   * @param {Element|jQuery} main pane
   * @parma {Object} options
   * @api public
   */

  function Antiscroll (el, opts) {
    this.el = $(el);
    this.options = opts || {};

    this.x = false !== this.options.x;
    this.y = false !== this.options.y;
    this.padding = undefined == this.options.padding ? 2 : this.options.padding;

    this.inner = this.el.find('.antiscroll-inner');
    var sbSize = this.options.sbSize || scrollbarSize();

    // [NUTANIX Custom - Start]

    this.resize();

    // If an onScroll function is passed in the options
    // we bind it to the scroll event with a throttle of 100ms
    if (this.options.onScroll) {
      // we store it in order to unbind it when antiscroll is destroyed
      this.onScroll = _.throttle(this.options.onScroll, 100);

      this.inner.on('scroll', this.onScroll);
    }

    // If a `resize` flag is passed in the options we bind the resize function
    // to the resize event with a throttle of 50ms
    if (this.options.resize) {
      // we store it in order to unbind it when antiscroll is destroyed
      this.onResize = _.throttle(function(){
        this.resize();
      }.bind(this), 50);

      $(window).on('resize', this.onResize);
    }

    // [NUTANIX Custom - End]

    this.refresh();
  };

  // [NUTANIX Custom - Start]

  /**
   * resize
   *
   * @api public
   */

  Antiscroll.prototype.resize = function() {
    // Reset the padding and width added by the plugin
    this.inner.css({
        'padding-right': ''
      , 'padding-bottom': ''
      , 'width': ''
    });

    // Track padding that may already exist (We will need to
    // change our calculations if it does).
    var vPadding = parseInt(this.inner.css('padding-right').substring(0,
      this.inner.css('padding-right').length - 2), 10);
    var hPadding = parseInt(this.inner.css('padding-bottom').substring(0,
      this.inner.css('padding-bottom').length - 2), 10);

    // Should be set to initially false by default. Then if so, we pre-check
    // 'inner-box' if we need scrolling.
    if (!this.artificialVScroll && !this.artificialHScroll) {
      // If we already have horizontal padding then we need to account for
      // the difference.
      if (hPadding == FFHackSize(scrollbarSize())) {
        if ( (this.inner.get(0).scrollHeight - FFHackSize(scrollbarSize()))
          > this.el.height() ) {
            this.artificialVScroll = true;
        }
      }
      else if ( this.inner.get(0).scrollHeight > this.el.height() ) {
        this.artificialVScroll = true;
      }
      // If we already have vertical padding then we need to account for
      // the difference.
      if (vPadding == FFHackSize(scrollbarSize())) {
        if ( (this.inner.get(0).scrollWidth - FFHackSize(scrollbarSize()))
          > this.el.width() ) {
            this.artificialHScroll = true;
        }
      }
      else if ( this.inner.get(0).scrollWidth > this.el.width() ) {
          this.artificialHScroll = true;
      }
    }

    // Create artificial padding only if we need it
    if (this.artificialVScroll && this.y) {
      // CSS box-sizing includes the CSS padding to the total width calculated
      // for the scrollbar resizing so we need to check if we previously
      // added padding and account for that extra difference or not.
      if (vPadding == FFHackSize(scrollbarSize())) {
        // We need to double this value due to CSS box-sizing.
        var CSSvWidth = FFHackSize(scrollbarSize()) +
          FFHackSize(scrollbarSize());
      }
      // We did not have padding before, so we do not to increase the
      // width parameter.
      else {
        var CSSvWidth = FFHackSize(scrollbarSize());
      }
      var CSSvPadding = FFHackSize(scrollbarSize());
    }
    // Otherwise keep dimensions as would have.
    else {
      var CSSvWidth = this.options.sbSize || scrollbarSize();
      var CSSvPadding = 0;

      // If scroll bar is removed from resize, we need to reset the
      // the lingering padding that was added from the scrollbar or else there
      // will remain a shadow instance of a scroll bar.
      if (CSSvWidth === 0 && parseInt(this.inner.css('width'))
        < this.el.width() ) {
        CSSvWidth = this.el.width() - parseInt(this.inner.css('width'));
      }
    }


    // Create artificial padding only if we need it
    if (this.artificialHScroll && this.x) {
      // CSS box-sizing includes the CSS padding to the total width calculated
      // for the scrollbar resizing so we need to check if we previously
      // added padding and account for that extra difference or not.
      if (hPadding == FFHackSize(scrollbarSize())) {
        var CSShWidth = FFHackSize(scrollbarSize())
        + FFHackSize(scrollbarSize());
      }
      // We did not have padding before, so we do not to increase the
      // width parameter.
      else {
        var CSShWidth = FFHackSize(scrollbarSize());
      }
      var CSShPadding = FFHackSize(scrollbarSize());
    }
    // Otherwise keep dimensions as would have.
    else {
      var CSShWidth = this.options.sbSize || scrollbarSize();
      var CSShPadding = 0;

      // If scroll bar is removed from resize, we need to reset the
      // the lingering padding that was added from the scrollbar or else there
      // will remain a shadow instance of a scroll bar.
      if (CSShWidth === 0 && parseInt(this.inner.css('height'))
        < this.el.height() ) {
        CSShWidth = this.el.height() - parseInt(this.inner.css('height'));
      }
    }


    this.inner.css({
        'width': '+=' + CSSvWidth // create artificial padding to hide scroll
      , 'height': '+=' + CSShWidth
      , 'padding-right': CSSvPadding
      , 'padding-bottom': CSShPadding
    });
  };

  // [NUTANIX Custom - End]

  /**
   * refresh scrollbars
   *
   * @api public
   */

  Antiscroll.prototype.refresh = function() {

    // [NUTANIX Custom - Start]
    // The trick here is to literally push the browser scrollbar
    // off the screen if it exists. So we do this by adding padding
    // combined with the already existing CSS overflow: hidden property.

    // Same as before, account for artificial padding difference
    // if it exists so we do not falsey trigger a scrollbar
    // if we do not really need it.
    if (this.artificialVScroll) {
      var needHScroll = (this.inner.get(0).scrollWidth
        - FFHackSize(scrollbarSize())) > this.el.width();
    }
    else {
      var needHScroll = this.inner.get(0).scrollWidth > this.el.width();
    }

    if (this.artificialHScroll) {
      var needVScroll = (this.inner.get(0).scrollHeight
        - FFHackSize(scrollbarSize())) > this.el.height();
    }
    else {
      var needVScroll = this.inner.get(0).scrollHeight > this.el.height();
    }

    // reset artificial flags if needed
    if (!needVScroll) {
      this.artificialVScroll = false;
    }
    if (!needHScroll) {
      this.artificialHScroll = false;
    }
    // [NUTANIX Custom - End]

    if (!this.horizontal && needHScroll && this.x) {
      this.horizontal = new Scrollbar.Horizontal(this);
    } else if (this.horizontal && !needHScroll)  {
      this.horizontal.destroy();
      this.horizontal = null
    }

    if (!this.vertical && needVScroll && this.y) {
      this.vertical = new Scrollbar.Vertical(this);
    } else if (this.vertical && !needVScroll)  {
      this.vertical.destroy();
      this.vertical = null
    }
  };

  /**
   * Cleans up.
   *
   * @return {Antiscroll} for chaining
   * @api public
   */

  Antiscroll.prototype.destroy = function () {
    if (this.horizontal) {
      this.horizontal.destroy();
    }
    if (this.vertical) {
      this.vertical.destroy();
    }

    // [NUTANIX Custom - Start]

    if (this.onScroll) {
      this.inner.off('scroll', this.onScroll);
    }
    if (this.onResize) {
      $(window).off('resize', this.onResize);
    }

    // [NUTANIX Custom - End]

    return this;
  };

  /**
   * Rebuild Antiscroll.
   *
   * @return {Antiscroll} for chaining
   * @api public
   */

  Antiscroll.prototype.rebuild = function () {
    this.destroy();
    this.inner.attr('style', '');
    Antiscroll.call(this, this.el, this.options);
    return this;
  };

  /**
   * Scrollbar constructor.
   *
   * @param {Element|jQuery} element
   * @api public
   */

  function Scrollbar (pane) {
    this.pane = pane;
    this.pane.el.append(this.el);
    this.innerEl = this.pane.inner.get(0);

    this.dragging = false;
    this.enter = false;
    this.shown = false;

    // hovering
    this.pane.el.mouseenter($.proxy(this, 'mouseenter'));
    this.pane.el.mouseleave($.proxy(this, 'mouseleave'));

    // dragging
    this.el.mousedown($.proxy(this, 'mousedown'));

    // scrolling
    this.pane.inner.scroll($.proxy(this, 'scroll'));

    // wheel -optional-
    this.pane.inner.bind('mousewheel', $.proxy(this, 'mousewheel'));

    // show
    var initialDisplay = this.pane.options.initialDisplay;

    if (initialDisplay !== false) {
      this.show();
      this.hiding = setTimeout($.proxy(this, 'hide'), parseInt(initialDisplay, 10) || 3000);
    }
  };

  /**
   * Cleans up.
   *
   * @return {Scrollbar} for chaining
   * @api public
   */

  Scrollbar.prototype.destroy = function () {
    this.el.remove();
    return this;
  };

  /**
   * Called upon mouseenter.
   *
   * @api private
   */

  Scrollbar.prototype.mouseenter = function () {
    this.enter = true;
    this.show();
  };

  /**
   * Called upon mouseleave.
   *
   * @api private
   */

  Scrollbar.prototype.mouseleave = function () {
    this.enter = false;

    if (!this.dragging) {
      this.hide();
    }
  }

  /**
   * Called upon wrap scroll.
   *
   * @api private
   */

  Scrollbar.prototype.scroll = function () {
    if (!this.shown) {
      this.show();
      if (!this.enter && !this.dragging) {
        this.hiding = setTimeout($.proxy(this, 'hide'), 1500);
      }
    }

    this.update();
  };

  /**
   * Called upon scrollbar mousedown.
   *
   * @api private
   */

  Scrollbar.prototype.mousedown = function (ev) {
    ev.preventDefault();

    this.dragging = true;

    this.startPageY = ev.pageY - parseInt(this.el.css('top'), 10);
    this.startPageX = ev.pageX - parseInt(this.el.css('left'), 10);

    // prevent crazy selections on IE
    document.onselectstart = function () { return false; };

    var pane = this.pane
      , move = $.proxy(this, 'mousemove')
      , self = this

    $(document)
      .mousemove(move)
      .mouseup(function () {
        self.dragging = false;
        document.onselectstart = null;

        $(document).unbind('mousemove', move);

        if (!self.enter) {
          self.hide();
        }
      })
  };

  /**
   * Show scrollbar.
   *
   * @api private
   */

  Scrollbar.prototype.show = function (duration) {
    if (!this.shown) {
      this.update();
      this.el.addClass('antiscroll-scrollbar-shown');
      if (this.hiding) {
        clearTimeout(this.hiding);
        this.hiding = null;
      }
      this.shown = true;
    }
  };

  /**
   * Hide scrollbar.
   *
   * @api private
   */

  Scrollbar.prototype.hide = function () {
    var autoHide = this.pane.options.autoHide;
    if (autoHide !== false && this.shown) {
      // check for dragging
      this.el.removeClass('antiscroll-scrollbar-shown');
      this.shown = false;
    }
  };

  /**
   * Horizontal scrollbar constructor
   *
   * @api private
   */

  Scrollbar.Horizontal = function (pane) {
    this.el = $('<div class="antiscroll-scrollbar antiscroll-scrollbar-horizontal">');
    Scrollbar.call(this, pane);
  }

  /**
   * Inherits from Scrollbar.
   */

  inherits(Scrollbar.Horizontal, Scrollbar);

  /**
   * Updates size/position of scrollbar.
   *
   * @api private
   */

  Scrollbar.Horizontal.prototype.update = function () {
    var paneWidth = this.pane.el.width()
      , trackWidth = paneWidth - this.pane.padding * 2
      , innerEl = this.pane.inner.get(0)

    this.el
      .css('width', trackWidth * paneWidth / innerEl.scrollWidth)
      .css('left', trackWidth * innerEl.scrollLeft / innerEl.scrollWidth)
  }

  /**
   * Called upon drag.
   *
   * @api private
   */

  Scrollbar.Horizontal.prototype.mousemove = function (ev) {
    var trackWidth = this.pane.el.width() - this.pane.padding * 2
      , pos = ev.pageX - this.startPageX
      , barWidth = this.el.width()
      , innerEl = this.pane.inner.get(0)

    // minimum top is 0, maximum is the track height
    var y = Math.min(Math.max(pos, 0), trackWidth - barWidth)

    innerEl.scrollLeft = (innerEl.scrollWidth - this.pane.el.width())
      * y / (trackWidth - barWidth)
  };

  /**
   * Called upon container mousewheel.
   *
   * @api private
   */

  Scrollbar.Horizontal.prototype.mousewheel = function (ev, delta, x, y) {
    if ((x < 0 && 0 == this.pane.inner.get(0).scrollLeft) ||
        (x > 0 && (this.innerEl.scrollLeft + Math.ceil(this.pane.el.width())
          == this.innerEl.scrollWidth))) {
      ev.preventDefault();
      return false;
    }
  };

  /**
   * Vertical scrollbar constructor
   *
   * @api private
   */

  Scrollbar.Vertical = function (pane) {
    this.el = $('<div class="antiscroll-scrollbar antiscroll-scrollbar-vertical">');
    Scrollbar.call(this, pane);
  };

  /**
   * Inherits from Scrollbar.
   */

  inherits(Scrollbar.Vertical, Scrollbar);

  /**
   * Updates size/position of scrollbar.
   *
   * @api private
   */

  Scrollbar.Vertical.prototype.update = function () {
    var paneHeight = this.pane.el.height()
      , trackHeight = paneHeight - this.pane.padding * 2
      , innerEl = this.innerEl

    this.el
      .css('height', trackHeight * paneHeight / innerEl.scrollHeight)
      .css('top', trackHeight * innerEl.scrollTop / innerEl.scrollHeight)
  };

  /**
   * Called upon drag.
   *
   * @api private
   */

  Scrollbar.Vertical.prototype.mousemove = function (ev) {
    var paneHeight = this.pane.el.height()
      , trackHeight = paneHeight - this.pane.padding * 2
      , pos = ev.pageY - this.startPageY
      , barHeight = this.el.height()
      , innerEl = this.innerEl

    // minimum top is 0, maximum is the track height
    var y = Math.min(Math.max(pos, 0), trackHeight - barHeight)

    innerEl.scrollTop = (innerEl.scrollHeight - paneHeight)
      * y / (trackHeight - barHeight)
  };

  /**
   * Called upon container mousewheel.
   *
   * @api private
   */

  Scrollbar.Vertical.prototype.mousewheel = function (ev, delta, x, y) {
    if ((y > 0 && 0 == this.innerEl.scrollTop) ||
        (y < 0 && (this.innerEl.scrollTop + Math.ceil(this.pane.el.height())
          == this.innerEl.scrollHeight))) {
      ev.preventDefault();
      return false;
    }
  };

  /**
   * Cross-browser inheritance.
   *
   * @param {Function} constructor
   * @param {Function} constructor we inherit from
   * @api private
   */

  function inherits (ctorA, ctorB) {
    function f() {};
    f.prototype = ctorB.prototype;
    ctorA.prototype = new f;
  };

  /**
   * Scrollbar size detection.
   */

  var size;

  // [NUTANIX Custom - Start]
  function FFHackSize (size) {
    // HACK: assume it's a floating scrollbars browser like FF on MacOS Lion
    // if not 0, then ignore (we are fine). The default Firefox scrollbar is
    // 14px but when used with overflow there's a slight crop issue when
    // scrolling. So add 2px to hide the extra stuff.
    if (size === 0) {
      size = 14 + 2;
    }
      return size;
  }
  // [NUTANIX Custom - End]

  function scrollbarSize () {
    if (size === undefined) {
      var div = $(
          '<div class="antiscroll-inner" style="width:50px;height:50px;overflow-y:scroll;'
        + 'position:absolute;top:-200px;left:-200px;"><div style="height:100px;width:100%">'
        + '</div>'
      );

      $('body').append(div);

      var w1 = $(div).innerWidth();
      var w2 = $('div', div).innerWidth();
      $(div).remove();

      size = w1 - w2;
    }

    return size;
  };

})(jQuery);