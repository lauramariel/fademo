//
// Copyright (c) 2016 Nutanix Inc. All rights reserved.
//
// DataTableColResizeMixin is a mixin to help add column resize
// persistence support to DataTables.
// In many cases our table data refresh causes the table to be
// rebuilt and column resize state to be lost.
// This mixin makes use of localStorage to store column resize
// state so it is retained across table refreshes.
//
// The actual column resize support is from dataTables.colResize plugin.
// There is a bug in the plugin state-save code,
// which is fixed by lines marked with nutanix in dataTables.colResize.js.
// Note: for tables not based on dataTables, column resize
// is not currently supported.
//
// jsHint options on the next line
/*global setTimeout: false */
//
define([
    // ensure dataTables.colResize is pulled in
    'colresize'],
  function (ColResize) {

    'use strict';

    var DataTableColResizeMixin = {

      // keep track of active col resizers
      // need this to reset col resize on window resize
      _colResizers: [],

      // This should be mixed into dataTableSettings
      getColResizeDataTableSettings: function (ctx) {
        return {
          // using dom for colResize only works for dataTables 1.10.2 or above
          // sDom here is necessary to get colResize to work for dataTables
          // version 1.9.3 (we use)
          // Note: the casing: sDom, NOT sDOM
          // dataTables sDom defaults to 'lfrtip', adding 'Z' for colResize
          sDom: 'Zlfrtip',
          bStateSave: true,
          fnStateSave: function (oSettings, oData) {
            ctx._dataTableStateSave(oSettings, oData);
          },
          fnStateLoad: function (oSettings) {
            return ctx._dataTableStateLoad(oSettings);
          },
          colResize: {
            resizeCallback: function (column) {
              ctx._dataTableColResizeCallback(column);
              DataTableColResizeMixin._addColResizer(this);
            },
            destroyCallback: function() {
              DataTableColResizeMixin._removeColResizer(this);
            }
          }
        };
      },

      // This should be mixed into DataTable view classes.
      // E.g., BaseTableView, DetailsTableView.
      getDataTableColResizeMixin: function () {
        return {
          _dataTableStateSave: function (oSettings, oData) {
            var colResizeOn = localStorage[this._getColResizeEnabledKey()];
            if (colResizeOn === 'true') {
              var key = this._getColResizeStateKey(),
                value = JSON.stringify(oData);
              localStorage[key] = value;
            }
          },
          _dataTableStateLoad: function (oSettings) {
            var colResizeOn = localStorage[this._getColResizeEnabledKey()];
            if (colResizeOn === 'true') {
              var key = this._getColResizeStateKey(),
                value = localStorage[key];
              if (value) {
                return JSON.parse(value);
              }
            }
            return null;
          },
          _dataTableColResizeCallback: function (column) {
            localStorage[this._getColResizeEnabledKey()] = 'true';
            // force a draw so the column resize state will be saved
            this.dataTable.fnDraw(true);
          },

          // get the key used to store if colResize is enabled in localStorage
          // saving table state introduces about 1KB overhead per table
          // to minimize the overhead, we only save table state if user resize
          // some column of the table
          //
          // Note: ideally we need a key which should be unique per table.
          // The $el.selector seems to be available for EB tables,
          // however, it is not set for details tables.
          // May need to find a better alternative for details tables.
          _getColResizeEnabledKey: function () {
            var sel = this._getKeySuffix();
            return 'colResize.on.' + sel;
          },

          // get the key used to store the table state in localStorage
          _getColResizeStateKey: function () {
            var sel = this._getKeySuffix();
            return 'colResize.' + sel;
          },

          _getKeySuffix: function() {
            // use selector by default (EB tables have)
            var sel = this.$el.selector;
            if (!sel) {
              var el0 = this.$el[0],
                id = el0.id,
                m;
              // no selector and have id, then use id,
              // but strip off trailing digits (timestamp)
              if (id && (m = id.match(/(.*\D)[\d]*$/))) {
                sel = m[1];
              } else {
                // no selector or id, use tagName.className
                var tagName = el0.tagName,
                  className = el0.className;
                sel = tagName + '.' + className.trim().replace(/\s+/g, '.');
              }
            }
            return sel;
          }
        };
      },

      // Clear all resize states stored in localStorage.
      // This method is called on app start up (browser refresh)
      // to ensure column resize states are reset.
      clearAllColResizeStates: function () {
        Object.keys(localStorage).forEach(
          function (key) {
            if (key.indexOf('colResize.') === 0) {
              localStorage.removeItem(key);
            }
          }
        );
      },

      // @private
      // add column resizer into this._colResizers
      // called in column resize callback
      _addColResizer: function(resizer) {
        var r = _.find(this._colResizers, function(r) {
          return r === resizer;
        });
        if (!r) {
          this._colResizers.push(resizer);
        }
      },

      // @private
      // remove column resizer from this._colResizers
      // called when column resizer is destroyed
      // (when table refresh or destroy)
      _removeColResizer: function(resizer) {
        var i = _.indexOf(this._colResizers, resizer);
        if (i !== -1) {
          this._colResizers.splice(i, 1);
        }
      },

      // @private
      // window resize handler - reset all active column resizers
      // note: we do not remove this resize handler over the lifetime of the app
      // this is okay since we need it as column resize can be made at any time
      // and if there is no active resizer, the overhead here is minimal.
      _onResize: function() {
        if (this._colResizers.length) {
          var that = this,
              resizers = this._colResizers.slice();
          _.each(resizers, function(resizer) {
              if (resizer.fnReset) {
                resizer.fnReset();
              }
              that._removeColResizer(resizer);
          });
        }
      }
    };

    // on window resize, reset all active column resizers
    $(window).on('resize',
        DataTableColResizeMixin._onResize.bind(DataTableColResizeMixin));

    // clear all column resize states on app start up
    DataTableColResizeMixin.clearAllColResizeStates();

    return DataTableColResizeMixin;
  }
);
