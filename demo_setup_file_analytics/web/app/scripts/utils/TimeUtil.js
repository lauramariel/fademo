//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// TimeUtil contains common utility functions for stats data.
//
define([
  // Core
  'momentTimeZone',
  'moment',
  // Managers
  'managers/NamespaceManager',
  // Utils
  'utils/AppConstants'],
function(
  // Core
  momentTimeZone,
  moment,
  // Managers
  NamespaceManager,
  // Utils
  AppConstants) {

  'use strict';

  // Constants
  //----------

  // AM PM Designators
  var AM_PM_DESIGNATORS = {
    'en-US' : {'am' : 'AM',  'pm': 'PM'},
    'zh-CN' : {'am' : '上午', 'pm': '下午'},
    'ja-JP' : {'am' : '午前', 'pm': '午後'}
  };

  // Default format for European regions
  var europeanFormatDefault = {
    default      : 'dd/MM/yy h:mm:ss tt',
    shortDate    : 'dd/MM/yyyy',
    datepicker   : 'dd/mm/yyyy',
    longDate     : 'd MMM yyyy',
    dateOnly     : 'dd/MM',
    longDateOnly : 'd MMM',
    shortTime    : 'h:mm tt',
    longTime     : 'h:mm:ss tt',
    hourOnly     : 'h tt',
    longDateTime : 'd MMM h:mm',
    shortDateTime: 'dd/MM h:mm tt',
    fullDateTime : 'd MMMM yyyy h:mm:ss tt',
    shortFullDateTime: 'd MMMM yyyy h:mm tt'
  };

  // Time/date format for USA, also used by other regions
  var usaFormatDefault = {
    default      : 'MM/dd/yy, h:mm:ss tt',
    shortDate    : 'MM/dd/yyyy',
    datepicker   : 'mm/dd/yyyy',
    longDate     : 'MMM d, yyyy',
    dateOnly     : 'MM/dd',
    longDateOnly : 'MMM d',
    shortTime    : 'h:mm tt',
    longTime     : 'h:mm:ss tt',
    hourOnly     : 'h tt',
    longDateTime : 'MMM d h:mm',
    shortDateTime: 'MM/dd h:mm tt',
    fullDateTime : 'MMMM d, yyyy, h:mm:ss tt',
    shortFullDateTime: 'MMMM d, yyyy, h:mm tt'
  };

  var TimeUtil = _.extend({

    // Properties
    //-----------

    // Module Name
    name: 'TimeUtil',

    // Constants
    //----------

    // Date time format type
    FORMAT_TYPE: {
      DEFAULT        : 'default',
      SHORT_DATE     : 'shortDate',
      LONG_DATE      : 'longDate',
      DATE_ONLY      : 'dateOnly',
      LONG_DAY_ONLY  : 'longDateOnly',
      SHORT_TIME     : 'shortTime',
      LONG_TIME      : 'longTime',
      HOUR_ONLY      : 'hourOnly',
      LONG_DATE_TIME : 'longDateTime',
      SHORT_DATE_TIME: 'shortDateTime',
      FULL_DATE_TIME : 'fullDateTime',
      SHORT_FULL_DATE_TIME: 'shortFullDateTime'
    },

    // Use the following per-defined date time format pattern if
    // internationalization API is not supported
    FORMAT_PATTERNS: {
      'ar-AE': usaFormatDefault,
      'de-DE': europeanFormatDefault,
      'de-CH': europeanFormatDefault,
      'en-AU': europeanFormatDefault,
      'en-CA': {
        default      : 'yy-MM-dd, h:mm:ss tt',
        shortDate    : 'yyyy-MM-dd',
        datepicker   : 'yyyy/mm/dd',
        longDate     : 'yyyy MMM d',
        dateOnly     : 'MM-dd',
        longDateOnly : 'MMM d',
        shortTime    : 'h:mm tt',
        longTime     : 'h:mm:ss tt',
        hourOnly     : 'h tt',
        longDateTime : 'MMM d h:mm',
        shortDateTime: 'MM-dd h:mm tt',
        fullDateTime : 'MMMM d, yyyy, h:mm:ss tt',
        shortFullDateTime: 'MM d yy, h:mm tt'
      },
      'en-GB': europeanFormatDefault,
      'en-US': usaFormatDefault,
      'fr-FR': europeanFormatDefault,
      'fr-CA': {
        default      : 'yy-MM-dd, h:mm:ss tt',
        shortDate    : 'yyyy-MM-dd',
        datepicker   : 'yyyy/mm/dd',
        longDate     : 'yyyy MMM d',
        dateOnly     : 'MM-dd',
        longDateOnly : 'MMM d',
        shortTime    : 'h:mm tt',
        longTime     : 'h:mm:ss tt',
        hourOnly     : 'h tt',
        longDateTime : 'MMM d h:mm',
        shortDateTime: 'MM-dd h:mm tt',
        fullDateTime : 'MMMM d, yyyy, h:mm:ss tt',
        shortFullDateTime: 'MMMM d, yyyy, h:mm tt'
      },
      'fr-BE': europeanFormatDefault,
      'fr-CH': europeanFormatDefault,
      'it-IT': europeanFormatDefault,
      'it-CH': europeanFormatDefault,
      'ja-JP': {
        default      : 'yy/MM/dd tth:mm:ss',
        shortDate    : 'yyyy/MM/dd',
        datepicker   : 'yyyy/mm/dd',
        longDate     : 'yyyy年M月d日',
        dateOnly     : 'MM/dd',
        longDateOnly : 'M月d日',
        shortTime    : 'tth:mm',
        longTime     : 'tth:mm:ss',
        hourOnly     : 'tth时',
        longDateTime : 'M月d日 h:mm',
        shortDateTime: 'MM/dd tth:mm',
        fullDateTime : 'yyyy年M月d日 tth:mm:ss',
        shortFullDateTime: 'yyyy年M月d日 tth:mm'
      },
      'ko-KR': usaFormatDefault,
      'nl-BE': europeanFormatDefault,
      'nl-NL': europeanFormatDefault,
      'ru-RU': europeanFormatDefault,
      'zh-CN': {
        default      : 'yy/MM/dd tth:mm:ss',
        shortDate    : 'yyyy/MM/dd',
        datepicker   : 'yyyy/mm/dd',
        longDate     : 'yyyy年M月d日',
        dateOnly     : 'MM/dd',
        longDateOnly : 'M月d日',
        shortTime    : 'tth:mm',
        longTime     : 'tth:mm:ss',
        hourOnly     : 'tth时',
        longDateTime : 'M月d日 h:mm',
        shortDateTime: 'MM/dd tth:mm',
        fullDateTime : 'yyyy年M月d日 tth:mm:ss',
        shortFullDateTime: 'yyyy年M月d日 tth:mm'
      }
    },

    DEFAULT_REGION : 'en-US',

    // Default date time format
    DEFAULT_DATE_TIME: 'MM/dd/yyyy h:mm:ss tt',

    // Properties describe the date-time components to use in
    // formatted output, and their desired representations
    DATE_TIME_OPTIONS : {
      default:      {year: '2-digit', month: '2-digit', day: '2-digit',
                     hour: '2-digit', minute: '2-digit',
                     second: '2-digit'},
      shortDate:    {year: 'numeric', month: '2-digit', day: '2-digit'},
      longDate:     {year: 'numeric', month: 'short', day: 'numeric'},
      dateOnly:     {month: '2-digit', day: '2-digit'},
      longDateOnly: {month: 'short', day: 'numeric'},
      shortTime:    {hour: '2-digit', minute: '2-digit'},
      longTime:     {hour: '2-digit', minute: '2-digit',
                     second: '2-digit'},
      hourOnly:     {hour: '2-digit'},
      longDateTime: {month: 'short', day: 'numeric',
                     hour: '2-digit', minute: '2-digit'},
      shortDateTime:{month: '2-digit', day: '2-digit',
                     hour: '2-digit', minute: '2-digit'},
      fullDateTime: {year: 'numeric', month: 'long', day: 'numeric',
                     hour: '2-digit', minute: '2-digit',
                     second: '2-digit'},
      shortFullDateTime : {year: 'numeric', month: 'short', day: 'numeric',
                           hour: '2-digit', minute: '2-digit'}
    },

    // Date time formatter, when formatting large numbers of dates
    // we want to keep reusing the formatter
    dateTimeFormatter: {},

    // Functions
    //----------------------------

    // Time zone functions using moment.js and momentTimeZone.js
    // ----------------------------------------------------------

    // Set the locale for moment.js
    setLocale: function(locale) {
      momentTimeZone.locale(locale);
    },

    // Returns the date based on the count and period passed.
    // @param count is the no of periods whereas
    // @param period can be 'months', 'years', 'days', 'seconds', etc.
    // @return date in milliseconds.
    getStartDate: function(count, period) {
      return moment().subtract(count, period).valueOf();
    },

    // Returns date after a particular count of period passed.
    // @param startDate is the start date after which the new date
    // has to be calculated.
    // @param count is the no of periods
    // @param period 'months', 'years', 'days'
    // @return date in dd-mm-yyyy format
    getDateAfter: function(startDate, count, period) {
      let newDate = moment(startDate, 'YYYY-MM-DD').add(count, period);
      return newDate;
    },

    // Returns true if the check date lies in the range passed.
    // @param from is the start of the range.
    // @param to is the end of the range.
    // @param check is the date to be checked if lies within range.
    // @return true/false
    isDateBetween: function(from, to, check) {
      return (check >= from && check <= to);
    },

    // Return complete date when a epoc is passed
    formatEpocToShortDate: function(epoc) {
      if (!epoc) {
        return '';
      }
      let date = new Date(epoc);
      let year = date.getFullYear(),
          month = this.addLeadingZero(date.getMonth() + 1),
          day = this.addLeadingZero(date.getDate());

      return year + '-' + month + '-' + day;
    },

    // Returns formatted long date string according to the locale
    // @return date string in format of dddd, MMMM dd, yyyy
    formatLongDate: function(ts, invalidDateString) {
      return this.formatLocaleDateTime(ts, this.FORMAT_TYPE.LONG_DATE,
        invalidDateString);
    },

    // Returns formatted date with year string according to the locale
    // @return date string in format of M/d
    formatDateOnly: function(ts, invalidDateString) {
      return this.formatLocaleDateTime(ts, this.FORMAT_TYPE.DATE_ONLY,
        invalidDateString);
    },

    // Returns formatted short time string according to the locale
    // @return time string in format of h:mm tt
    formatShortTime: function(ts, invalidDateString) {
      return this.formatLocaleDateTime(ts,
        this.FORMAT_TYPE.SHORT_TIME, invalidDateString);
    },

    // Returns formatted default date time string according to
    // the locale
    // @return date time in the format of M/d/yyyy h:mm:ss tt
    formatDateTime: function(ts, invalidDateString, locale) {
      return this.formatLocaleDateTime(ts, this.FORMAT_TYPE.DEFAULT,
        invalidDateString, locale);
    },

    // Returns the formatted short date time string according
    // to the locale
    // @return date time string in the format of M/d h:mm tt
    formatShortDateTime: function(ts, invalidDateString) {
      return this.formatLocaleDateTime(ts,
        this.FORMAT_TYPE.SHORT_DATE_TIME, invalidDateString);
    },

    // Returns a date string in the specified format type.
    // @param ts     - the timestamp used to format the date
    // @param formatTye - format type
    //                    - TimeUtil.FORMAT_TYPE.SHORT_TIME
    //                    - TimeUtil.FORMAT_TYPE.FULL_DATE_TIME
    // @param invalidDateString - (optional) string for invalid date
    //                            else return the default '-'
    // @param locale - override the default locale.
    formatLocaleDateTime: function(ts, formatType,
      invalidDateString, locale) {
      locale = locale || this.DEFAULT_REGION;

      // Use FORMAT_TYPE.DEFAULT as the default
      formatType = formatType || this.FORMAT_TYPE.DEFAULT;

      if (!ts || ts <= 0){
        // specified date (ts) is invalid
        return invalidDateString ? invalidDateString:
          AppConstants.INVALID_STRING;
      }

      var date;
      if (ts && typeof ts === 'object') {
        date = ts;
      } else {
         date = new Date(ts);
      }
      // Check if build-in Intl Object exist
      if (window.Intl && typeof window.Intl === "object") {
        // Use the internationalization API to format it.
        return this._getDateTimeFormat(formatType,locale)
                   .format(date);
      } else {
        return this._formatDateTime(date, formatType, locale);
      }
    },

    // Return the data time format for the format type
    _getDateTimeFormat: function(formatType, locale) {
      var key = locale +'//' + formatType ;
      var formatter = this.dateTimeFormatter[key];
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale,
          this._getDateTimeOptions(formatType));
        this.dateTimeFormatter[key] = formatter;
      }
      return formatter;
    },

    // Returns the date time options for the pattern
    _getDateTimeOptions: function(formatType) {
      var options = this.DATE_TIME_OPTIONS[formatType];
      return options || this.DATE_TIME_OPTIONS.DEFAULT;
    },

    // Returns a date string in the specified format type.
    _formatDateTime: function(date, formatType, locale) {
      var formatPattern =
        this._getFormatPatterns(formatType, locale);
      return this._formatDateTimeByFormatPattern(date,
        formatPattern, locale);
    },

    // Returns the date time format patterns for the specifi
    // format type
    _getFormatPatterns: function(formatType, locale) {
      var patterns =
        this.FORMAT_PATTERNS[locale] ||
        this.FORMAT_PATTERNS[this.DEFAULT_REGION] ;
      return patterns[formatType] || this.DEFAULT_DATE_TIME;
    },

    // Given a date, it will look at the current locale and return the correct
    // timestamp.
    // @param date - date for which timestamp is needed.
    getTimeStamp: function(date, locale) {
      locale = locale || I18nManager.getDateTimeLocale();
      var format = this.getDatePickerFormat(locale);
      // Convert different time format to standard format.
      if (format === 'dd/mm/yyyy') {
        date = date.split('/');
        var month = Number(date[1]) - 1; // JS month starts from 0.
        var newDate = new Date(date[2], month, date[0]);
        return newDate.getTime();
      }
      return new Date(date).getTime();
    },

    // Return complete date when a string is passed
    formatDate: function(dateAsString) {
    if (dateAsString === '') {
      return '';
    }
      var date = new Date(dateAsString);
      var year = date.getFullYear(),
          month = this.addLeadingZero(date.getMonth() + 1),
          day = this.addLeadingZero(date.getDate()),
          hours = this.addLeadingZero(date.getHours()),
          minutes = this.addLeadingZero(date.getMinutes()),
          seconds = this.addLeadingZero(date.getSeconds());
      return year + "-" + month + "-" + day + " " + hours + ":" +
        minutes + ":" + seconds;
    },

  // Return mm/dd/yyyy when a string is passed
  formatCurrentShortDate: function() {
    let currentDate = new Date();
    let month = this.addLeadingZero(currentDate.getMonth() + 1),
        day = this.addLeadingZero(currentDate.getDate()),
        year = currentDate.getFullYear();
    return month + '/' + day + '/' + year;
  },

    // Adds a zero before the value.
    addLeadingZero: function(value) {
      if (value < 10) {
        return "0" + value;
      }
      return value;
    },

    // Format the date time by a specific format pattern
    _formatDateTimeByFormatPattern: function(date, formatPattern,
      locale) {
      var modelName = this.name;
      if (typeof Date.prototype.formatDateTime === 'undefined') {
        Date.prototype.formatDateTime = function (format, locale) {
          var ampms;
          if (locale) {
            ampms = AM_PM_DESIGNATORS[locale] ||
            AM_PM_DESIGNATORS[this.DEFAULT_REGION];
          } else {
            ampms = {
              'am': 'AM',
              'pm': 'PM'
            };
          }
          var o = {
            "y+": this.getFullYear(),  //full year
            "d+": this.getDate(),      //day
            "h+": (this.getHours() > 12) ? this.getHours() - 12 :
              (this.getHours() === 0) ? 12 : this.getHours(), //hour
            "m+": this.getMinutes(), //minute
            "s+": this.getSeconds(), //seconds
            "M+": this.getMonth() + 1, //month
            "tt": this.getHours() < 12 ? ampms.am : ampms.pm,
            "t": this.getHours() < 12 ? ampms.am : ampms.pm
          };
          var dateStr = format;

          // Replace the date time format pattern with the the
          // corresponding year, month...etc
          for (var k in o) {
            // For each grouping of the key in regular expression,
            // replace it with the corresponding value (pad it with
            // leading 0 to a specified grouping length).
            var match = new RegExp('(' + k + ')').exec(format);

            if (match) {
              if (k === 'M+' && match[1].length === 4) {
                // handles full Month
                dateStr = dateStr.replace(
                  match[1], DEFAULT_DATES.months[o[k] -1]);
              } else if (k === 'M+' && match[1].length === 3) {
                // handles short Month
                dateStr = dateStr.replace(
                  match[1], DEFAULT_DATES.monthsShort[o[k] -1]);
              } else {
                dateStr = dateStr.replace(match[1],
                  match[1].length === 1 ? o[k] : match[1].length === 4 ?
                    ('0000' + o[k]).substr(('' + o[k]).length) :
                    ('00' + o[k]).substr(('' + o[k]).length));
              }
            }
          }
          return dateStr;
        };
      }
      return date.formatDateTime(formatPattern, locale);
    },

    // On Locale changed, update the time related
    getDatePickerFormat: function(locale) {
      // Set the localized dates for the date picker
      return this._getFormatPatterns('datepicker', locale);
    },

    // Returns the date picker options based on current locale
    getDatePickerOptions: function(){
      var locale = this.DEFAULT_REGION;
      // Update the Date Picker for the current locale
      var format = this.getDatePickerFormat(locale);
      return {
        autoclose: true,
        language: locale,
        format: format || 'mm/dd/yyyy'
      };
    },

    // Get user time zone
    getUserTimeZone: function() {
      return moment.tz.guess();
    },

    // Return date for the week buck
    getWeekDateBucket(data) {
      let startDate = new Date(data);
      const newDate = moment(startDate, 'DD-MM-YYYY').add('days',
        AppConstants.STATS_PER_WEEK_VALUE);
      return new Date(newDate);
    },

    // Return interval period based on the dropdown option
    // selected
    getInterval: function(interval) {
      let retVal = '';

      if (interval === AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_24_HRS) {
        retVal = AppConstants.STATS_PER_HOUR;
      } else if (interval ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_7_DAYS) {
        retVal = AppConstants.STATS_PER_DAY;
      } else if (interval ===
        AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_30_DAYS) {
        retVal = AppConstants.STATS_PER_WEEK;
      } else if (parseInt(interval, 10) >= 2 &&
        parseInt(interval, 10) <= 12) {
        retVal = AppConstants.STATS_PER_MONTH;
      } else if (parseInt(interval, 10) > 12) {
        retVal = AppConstants.STATS_PER_QUARTER;
      }

      return retVal;
    },

    // Return the rounded off start time based on the interval.
    getRoundedStartTime: function(noOfDays, currentTime, type) {
      const startTime = TimeUtil.getStartTime(
        noOfDays, currentTime, type);

      const format = 'HH:mm:ss',
            start = new Date(startTime),
            currTimeStamp = moment(currentTime).format(format);

      // Check if the time of query is between 00:00 AM and 23:59:59 PM in order
      // to know if the query has been fired at midnight 00:00 AM.
      const current = moment(currTimeStamp, format),
            before = moment('00:00:00', format),
            after = moment('23:59:59', format);

      // If the time is 00:00:00, don't manipulate the time.
      if (!current.isBetween(before, after)) {
        return startTime;
      }

      let dateTime = 0, remainder = 0;
      if (noOfDays.indexOf('d') > -1) {
        if (noOfDays === AppConstants.ALL_DURATION_OPTIONS_VALUE.LAST_24_HRS) {
          // In case of 24 hours, round off to next value of hr other than 00:00
          // E.g 1:45 am will be considered as 2 am
          remainder = 60 - (start.getMinutes() % 60);
          dateTime = moment(start).clone()
            .add(remainder, 'minutes')
            .valueOf();
        } else {
          // In case of 7 days/30 days, round off to next day's 00:00 am.
          // E.g any time of 26 may other than 00:00 of 26 May
          // will be considered as 00:00 of 27 may
          dateTime = moment(start).clone()
            .add(1, 'day')
            .startOf('day')
            .valueOf();
        }
      } else {
        // In case of months/years, round off to next months day 1.
        // E.g. any day/ any time of May 2018 other than 1 May will be
        // considered as 00:00 of 1 Jun 2018.
        dateTime = moment(start).clone()
          .add(1, 'month')
          .startOf('month')
          .valueOf();
      }

      return dateTime;
    },

    // Return the start time based on the passed duration and current
    // time.
    getStartTime: function(noOfDays, currentTime, type) {
      let startTime;

      if (noOfDays.indexOf('d') > -1) {
        noOfDays = parseInt(noOfDays.split('d')[0], 10);
        startTime = currentTime - (noOfDays * AppConstants.MILLIS_PER_DAY);
      } else {
        startTime = TimeUtil.getStartDate(noOfDays, 'months');
      }

      if (type === AppConstants.SHOW_CAPACITY_FLUCTUATION) {
        startTime = new Date(startTime);
        startTime.setHours(0, 0, 0, 0);
        startTime = startTime.getTime();
      }
      return startTime;
    },

    // Return the end time based on the type requested
    getCurrentTime: function(preserveTime = true) {
      let currentTime = new Date();
      if (!preserveTime)
        currentTime.setHours(0, 0, 0, 0);
      currentTime = currentTime.getTime();
      return currentTime;
    },


    // Check if duration passed is greater than the retention period.
    // If yes, make the duration equal to the retention period.
    setDuration: function(val, fileServerId) {
      if (val.indexOf('d') > -1) {
        return val;
      }

      let retentionPeriod = NamespaceManager.get(fileServerId);
      val = parseInt(val, 10);
      if (val > retentionPeriod) {
        val = retentionPeriod;
      }
      return val.toString();
    },

    convertDate: function(d, duration) {
      let dateFormat = '';
      let date = new Date(d);
      if (duration === AppConstants.MONTHS ||
        duration === AppConstants.TWO_YEARS ||
        duration === AppConstants.THREE_YEARS) {
        // Example format - Nov18
        dateFormat = AppConstants.MONTHS_ARR[date.getMonth()] +
          (date.getFullYear().toString().substr(-2));
      } else if (duration === AppConstants.HOURS) {
        // Example format - 22:00
        dateFormat = date.getHours() + ':00';
      } else {
        // Example format - 27-Nov
        dateFormat = date.getDate() + '-' +
          AppConstants.MONTHS_ARR[date.getMonth()];
      }
      return dateFormat;
    },

    // Get the difference between dates in format specified
    // @param date1 - Difference to in new Date object format
    // @param date2 - Difference from in new Date object format
    // @param unit : seconds - unit in which data needs to be returned e.g hours, minutes
    getDifference: function(date1, date2, unit = 'seconds') {
      date1 = moment(date1);
      date2 = moment(date2);
      return date1.diff(date2, unit);
    }
  });

  return TimeUtil;
});
