//
// Copyright (c) 2013 Nutanix Inc. All rights reserved.
//
// DataExportUtil is a utility for exporting data off the analysis charts,
// tables and diagrams.
//
define([
    'utils/StatsUtil',
    'utils/AppConstants',
    'utils/TimeUtil'],
  function(
    StatsUtil,
    AppConstants,
    TimeUtil
    ) {

    'use strict';

    // The export template for data URI
    var exportDataURITemplate = _.template('data:<%= mimeType %>;' +
      'charset=utf-8,<%= data %>');

    return {

      // Core
      //-----

      // Constants

      // The MIME types we will be using
      MIME_TYPE: {
        PLAINTEXT   : 'text/plain',
        CSV         : 'text/csv;charset=utf-8;',
        JSON        : 'application/json',
        ATTACHMENT  : 'attachment/file',
        PDF         : 'application/pdf'
      },

      // Line ending chars
      CRLF: '\r\n',

      // The text to show in the window while the download is prepared
      LOADING_TEXT: 'Downloading data.. Please wait..',

      // The file name for the exported data
      DEFAULT_FILENAME: 'data',

      // Functions

      // Get the MIME type for the specified file extension type
      // @param type - Supported types are 'csv' and 'json'
      _getMimeType: function (type) {
        switch (type) {
          case 'csv':
            return this.MIME_TYPE.CSV;
          case 'json':
            return this.MIME_TYPE.JSON;
          case 'txt' :
            return this.MIME_TYPE.PLAINTEXT;
          case 'text' :
            return this.MIME_TYPE.PLAINTEXT;
          case 'pdf' :
            return this.MIME_TYPE.PDF;
          default:
            console.log('DataExportUtil | Unsupported type: ' + type);
            return '';
        }
      },

      // Opens a new target window/tab with a loading text and returns the
      // reference to the window object to be populated with correct data
      // later on
      openExportWindow: function () {
        var target = '_blank';
        return window.open(exportDataURITemplate({
          mimeType: this.MIME_TYPE.PLAINTEXT,
          data: this.LOADING_TEXT
        }), target);
      },

      // Returns window reference based on browser agent
      getWinRef: function () {
        var winRef = null;
        if (this.getBrowser() === AppConstants.BROWSER_AGENT.SAFARI) {
          winRef = this.openExportWindow();
        }
        return winRef;
      },

      // @private
      // Export the data to a CSV or JSON file
      // @param options - object containing "type"(file extension), "data"(data
      // to be exported), "filename"(name of exported file)
      // @param windowRef - The reference to a target window object (optional)
      _export: function (options, windowRef) {

        var type = options.type;
        var data = options.data;
        var filename = (options.filename || this.DEFAULT_FILENAME) + '.' + type;

        if (type === 'json') {
          data = JSON.stringify(data);
        }

        var mimeType = this._getMimeType(type);

        // Safari
        if (windowRef) {
          // Safari will download the data as a file named "Unknown" if the
          // MIME type is "application/csv"
          windowRef.location = exportDataURITemplate({
            mimeType: this.MIME_TYPE.ATTACHMENT,
            data: encodeURIComponent(data)
          });

          // Close the new window after the browser triggers the download
          // (hence the delay)
          setTimeout(function () {
            windowRef.close();
          }, 100);
        }
        // Chrome, Firefox and IE 10 and above
        else if (Blob) {
          var blob = new Blob([data], { type: mimeType, endings: 'native' });
          this._saveAs(blob, filename);
        }
        // IE 9 and below
        else {
          // Hat-tip: https://github.com/koffsyrup/FileSaver.js
          var saveTxtWindow = window.frames.saveTxtWindow;
          if (!saveTxtWindow) {
            saveTxtWindow = document.createElement('iframe');
            saveTxtWindow.id = 'saveTxtWindow';
            saveTxtWindow.style.display = 'none';
            document.body.insertBefore(saveTxtWindow, null);
            saveTxtWindow = window.frames.saveTxtWindow;
            if (!saveTxtWindow) {
              saveTxtWindow = window.open('', '_temp', 'width=100,height=100');
              if (!saveTxtWindow) {
                console.log('DataExportUtil | Failed to export ' + type);
                return;
              }
            }
          }

          var doc = saveTxtWindow.document;
          doc.open('text/html', 'replace');
          doc.charset = 'utf-8';
          doc.write(data);
          doc.close();

          var retValue = doc.execCommand('SaveAs', null, filename + '.txt');
          saveTxtWindow.close();
          if (!retValue) {
            console.log('DataExportUtil | Failed to export ' + type);
          }
        }
      },

      // A saveAs() FileSaver implementation for Chrome and Firefox
      // Hat-tip: http://purl.eligrey.com/github/FileSaver.js/blob/master/
      //  FileSaver.js
      // @param blob - The data to save as file
      // @param filename - The default filename to save the file as
      _saveAs: function (blob, filename) {
        filename = filename || this.DEFAULT_FILENAME;
        var blobData = blob;
        // prepend BOM for UTF-8 XML and text/* types (including HTML)
        if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
          blobData = new Blob(["\ufeff", blob], {
            type: blob.type, endings: 'native'
          });
        }

        // IE 10+ (native saveAs)
        if (typeof navigator !== 'undefined' && navigator.msSaveOrOpenBlob) {
          return navigator.msSaveOrOpenBlob(blobData, filename);
        }
        // Use "download" attribute for Chrome and Firefox
        else {
          var anchorEl =
            document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
          if ('download' in anchorEl) {
            setTimeout(function() {
              anchorEl.href = (URL || window.webkitURL).
                createObjectURL(blobData);
              anchorEl.download = filename;
              anchorEl.dispatchEvent(new MouseEvent('click'));
            }, 10);
          } else {
            console.log('DataExportUtil | Failed to export: ' + filename);
          }
        }
      },


      // Chart
      //------

      // Export chart data to CSV format
      // @param chartdata -- the chart data. Array of dataseries
      // @param objects - the objects to export data for. (entities or metics)
      exportChartCSV: function(chartData, objects, windowRef) {
        // Row and column separators
        var rowSep = this.CRLF; // \r\n
        var colSep = ",";

        var csv = "";
        var columnKeys = [];
        // Emit the header row. Time column, and one column for each series
        var titleRow = I18nManager.t('DataExportUtil', 'time_header');
        _.each(chartData, function(series) {
          var rawValueTitle = this.formatTitle(series.title, 'raw');
          var displayValueTitle = this.formatTitle(series.title, 'display');
          titleRow += colSep + rawValueTitle + colSep + displayValueTitle;
          columnKeys.push(rawValueTitle);
          columnKeys.push(displayValueTitle);
        }, this);
        csv += titleRow + rowSep;

        // Data Map is in the format: [ timeStamp: {col1: value, col2: value} ]
        var dataMap = this._chartDataMap(chartData, objects);
        _.each(dataMap, function(values, timeStamp) {
          // Wrap in quotes in case there is a comma in the timestamp
          var row = '\"' + timeStamp + '\"';
          _.each(columnKeys, function(key) {
            row += colSep + (values[key] || AppConstants.STATS_NOT_AVAILABLE);
          });
          csv += row + rowSep;
        });

        this._export({type: 'csv', data: csv}, windowRef);
      },


      // Returns "ie ie-[version #]", "ff", "safari", or "chrome"
      getBrowser: function() {
        var browser = '';
        var qualifiesSafari = navigator.userAgent.indexOf('Safari') > -1;
        var qualifiesChrome = navigator.userAgent.indexOf('Chrome') > -1;
        var qualifiesEdge = navigator.userAgent.indexOf('Edge') > -1;
        var qualifiesOpera = navigator.userAgent.toLowerCase()
          .indexOf("op") > -1;

        // Make sure browser object exists
        if ($.browser) {

          // IE (or IE11)
          if ($.browser.msie ||
              !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
            // Classify HTML tag as "ie" and add version
            // e.g. "ie ie9"
            browser = AppConstants.BROWSER_AGENT.IE + ' ' +
              AppConstants.BROWSER_AGENT.IE + parseInt($.browser.version, 10);
          }

          // Edge
          else if (qualifiesEdge) {
            browser = AppConstants.BROWSER_AGENT.EDGE;
          }

          // Chrome
          else if (qualifiesChrome && !qualifiesOpera) {
            browser = AppConstants.BROWSER_AGENT.CHROME;
          }

          // Safari
          else if (qualifiesSafari) {
            browser = AppConstants.BROWSER_AGENT.SAFARI;
          }

          // Firefox
          else if ($.browser.mozilla &&
              !navigator.userAgent.match(/Trident.*rv\:11\./)) {
            browser = AppConstants.BROWSER_AGENT.FF;
          }
        }
        return browser;
      },

      // Returns the title with the formatted type appended (display or raw)
      formatTitle: function (title, type) {
        return I18nManager.ts('DataExportUtil', type + '_value', title);
      },

      // Export chart data to JSON format
      // @param chartdata -- the chart data. Array of dataseries
      // @param objects - the objects to export data for. (entities or metics)
      exportChartJSON: function(chartData, objects, windowRef) {
        this._export({type: 'json',
          data: this._chartDataMap(chartData, objects)}, windowRef);
      },


      // @private
      // Triage the current chart data by time
      // {time -> {entityTitle (Raw) -> value, entityTitle (Display) -> value}}
      _chartDataMap: function(chartData, objects) {
        var dataMap = {};
        _.each(objects, function(obj, idx) {
          if ( obj.enabled ) {
            var ds = _.find(chartData, function(dataSet) {
              return dataSet.objectId === obj.id;
            });
            var dsData = ds.data;
            for(var i=0; i < dsData.length; i++) {
              var data = dsData[i];
              var dataTime =
                TimeUtil.formatDateTime(data[0] > 0 ? data[0] : 0);


              var dataObj = dataMap[dataTime];
              if ( !dataObj ) {
                dataObj = {};
                dataMap[dataTime] = dataObj;
              }

              // Create an entry with the Raw value
              dataObj[this.formatTitle(obj.title, 'raw')] = data[1];

              // Create an entry with the Display value
              // Third value (if present) gives the formatted value for display
              // If it is not present then format the second value for display
              dataObj[this.formatTitle(obj.title, 'display')] = data[2] ||
                StatsUtil.statsFormat(ds.objectId, parseFloat(data[1]), true);
            }
          }
        }, this);
        return dataMap;
      },


      // Table
      //------

      // Export table data to CSV format
      // @param models -- the table data. Array of JSON models
      // @param columns - the array of columns  shown on the table.
      // Refer to the DataTableColumnProvider for column structures.
      // @param options - An object to configure options during data export:
      //   preserveTags - If true, markup tags are not stripped from
      // the data
      // @param windowRef - The reference to a target window object (optional)
      exportTableCSV: function(models, columns, options, windowRef) {
        options = options || {};
        // Row and column separators
        var rowSep = this.CRLF, // \r\n
            colSep = ",",
            dataArray = this._toTableArray(models, columns),
            csv = "",
            colTitle = "";

        // Header row
        _.each(columns, function(column, idx) {
          column = _.isString(column) ? "\""+column+"\"" : column;

          // Set the title
          colTitle = column.exportTitle || column.sTitle;

          // Check if the title is blank, make sure that all columns are
          // rendered even if they are blank because CSV requires it.
          if ($.trim(colTitle).length === 0) {
            colTitle = "-";
          } else {
            // Strip markup
            colTitle =
              options.preserveTags ? colTitle : this.stripTags(colTitle);
          }

          csv += (idx ? colSep : '') + colTitle +
                 (idx+1 === columns.length ? rowSep : '');
        }, this);

        // Data content
        var value;
        _.each(dataArray, function(dataObj) {
          _.each(columns, function(column, idx) {
            // Set the title (key)
            colTitle = this.stripTags(column.exportTitle || column.sTitle);

            // Get the value
            value = dataObj[colTitle] || "";

            // Make sure to surround with double quote and strip markup tags
            value = _.isString(value) ? "\""+ (options.preserveTags ? value :
              this.stripTags(value)) +"\"" : value;
            csv += (idx ? colSep : '') + value +
                   (idx+1 === columns.length ? rowSep : '');
          }, this);
        }, this);

        this._export({type: 'csv', data: csv}, windowRef);
      },

      // Export table data to JSON format
      // @param models -- the table data. Array of JSON models
      // @param columns - the array of columns  shown on the table.
      // Refer to the DataTableColumnProvider for column structures.
      // @param windowRef - The reference to a target window object (optional)
      exportTableJSON: function(models, columns, windowRef) {
        this._export({type: 'json', data: this._toTableArray(models, columns)},
          windowRef);
      },

      // Export data to PDF format.
      // @param data - the data to be stored in pdf.
      // @param name - name of the file to be saved as.
      // @param windowRef - The reference to a target window object (optional)
      exportPDF: function(pdf, name, windowRef) {
        this._export({type: 'pdf', data: pdf, filename: name}, windowRef);
      },

      // Strip markup tags from an input string
      // Hat-tip: http://phpjs.org/functions/strip_tags/
      // @param input - The input string
      // @param allowed - A string containing exempted tags that are not to
      // be stripped, e.g., "<a><b><c>"
      stripTags: function (input, allowed) {
        if (typeof input !== 'string' || input.trim().length === 0) {
          return input;
        }
        // making sure the allowed arg is a string containing only tags in
        // lowercase (<a><b><c>)
        allowed = (((allowed || '') + '')
          .toLowerCase()
          .match(/<[a-z][a-z0-9]*>/g) || [])
          .join('');
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
          comments = /<!--[\s\S]*?-->/gi;

        return input.replace(comments, '')
          .replace(tags, function($0, $1) {
            return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
          });
      },

      // @private
      // Create a new array of JSON models where its keys are based on columns.
      // Refer to the DataTableColumnProvider for column structures.
      // @options - An object containing configurable options for export:
      //  preserveTags preserves markup tags during data export
      _toTableArray: function(tableData, columns, options) {
        options = options || {};
        var dataArray = [],
            dataObj, key, value,
            parts, parent;

        // Iterate over the tableData to form a new set of table data array
        _.each(tableData, function(model) {
          dataObj = {};
          _.each(columns, function(column) {
            // Build the key-value pair
            if (column.sTitle || column.exportTitle) {
              key = column.exportTitle || column.sTitle ;
              // Strip off markup
              key = options.preserveTags ? key : this.stripTags(key);

              // If mData is a function, apply it to get the data, then
              // apply mRender if any such function exists
              if (_.isFunction(column.mData)) {
                value = column.mData(model,AppConstants.TABLE_COL_TYPE_EXPORT);
                if (_.isFunction(column.mRender)) {
                  value = column.mRender(value,
                    AppConstants.TABLE_COL_TYPE_EXPORT, model);
                }
              }

              // If mData is not a function but exists, either use mRender if it
              // exists, or parse the mData prop to get the value by
              // anticipating nested properties
              else if (column.mData) {
                if (_.isFunction(column.mRender)) {
                  value = column.mRender(model[column.mData],
                    AppConstants.TABLE_COL_TYPE_EXPORT, model);
                }
                else {
                  parts = column.mData ? column.mData.split('.') : '';
                  parent = model;
                  for (var i=0; i < parts.length; i++) {
                    parent = parent[parts[i]];
                  }
                  value = parent;
                }
              }

              // Make sure that value has at least blank value
              if (typeof value === 'undefined' || value === null) {
                value = '';
              }

              if (key) {
                dataObj[key] =
                  options.preserveTags ? value : this.stripTags(value);
              }
            }
          }, this);
          dataArray.push(dataObj);
        }, this);
        return dataArray;
      }
    };
  });
