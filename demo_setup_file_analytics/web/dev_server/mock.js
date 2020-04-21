var path = require('path'),
  fs = require('fs'),
  moment = require('moment'),
  bodyParser = require('body-parser');
var options = {
  inflate: true,
  limit: '100kb',
  type: 'application/*'
};


module.exports = function(app) {

  app.get('/fa_gateway/fileservers', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data', 'file_servers_data.json'),
      'utf8', function(err, data) {
        if (err) {
          console.log('health_status :' + err);
        }
        res.send(data);
      });
  });

  app.get('/fa_gateway/fileservers/subscription', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'file_server_subscription_data.json'),
      'utf8', function(err, data) {
        if (err) {
          console.log('access_patterns :' + err);
        }
        res.send(data);
      });
  });


  app.get('/fa_gateway/health_status', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data', 'health_status.json'),
      'utf8', function(err, data) {
        if (err) {
          console.log('health_status :' + err);
        }
        var health = JSON.parse(data);
        health.last_updated_at = new Date().getTime() / 1000;
        res.send(JSON.stringify(health));
      });
  });

  app.get('/fa_gateway/anomalies', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data', 'anomaly_notification_data.json'),
      'utf8', function(err, data) {
        if (err) {
          console.log('anomalies :' + err);
        }
        res.send(data);
      });
  });
  app.post('/fa_gateway/configurations/file_categories/list', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data', 'file_categories_list.json'),
      'utf8', function(err, data) {
        if (err) {
          console.log('file_categories :' + err);
        }
        res.send(data);
      });
  });

  var jsonParser = bodyParser.json();
  app.post('/fa_gateway/users/top_active/list', jsonParser, function(req, res) {
    var diffInDays = moment().diff(moment(req.body.start_time_in_ms), 'days');
    // create application/json parser
    if (req.body.includes && req.body.includes.op_status && req.body.includes.op_status.indexOf('PermissionDenied') > -1) {
      var file = 'permission_denial_last_24_hours.json';
      if (diffInDays > 360) {
        file = 'permission_denial_last_1_year.json'
      } else if (diffInDays > 29) {
        file = 'permission_denial_last_30_days.json'
      } else if (diffInDays > 6) {
        file = 'permission_denial_last_7_days.json'
      }
      fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data', file),
        'utf8', function(err, data) {
          if (err) {
            console.log('permission_denial :' + err);
          }
          res.send(data);
        });
    } else {
      var file = 'top_active_users_last_24_hours.json';
      if (diffInDays > 360) {
        file = 'top_active_users_last_1_year.json'
      } else if (diffInDays > 29) {
        file = 'top_active_users_last_30_days.json'
      } else if (diffInDays > 6) {
        file = 'top_active_users_last_7_days.json'
      }
      fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data', file),
        'utf8', function(err, data) {
          if (err) {
            console.log('top_active_users :' + err);
          }
          res.send(data);
        });
    }
  });

  app.post('/fa_gateway/files/file_type', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'file_type_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      res.send(data);
    });
  });

  app.post('/fa_gateway/files/file_type/stats', jsonParser, function(req, res) {
    var interval = req.body.interval;
    var file = 'file_type_stats_last_30_days.json';
    if (interval === '1d') {
      file = 'file_type_stats_last_7_days.json';
    } else if (interval === '1M') {
      file = 'file_type_stats_last_1_year.json'
    }
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      file), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      var file_type = JSON.parse(data);

      if (interval === '5d') {
        file_type.entities.forEach(function(item) {
          var date = moment(req.body.start_time_in_ms).hours(0).minutes(0).seconds(0).milliseconds(0);
          item.values.forEach(function(series) {
            series.epoch_time = date.valueOf();
            date.add(5, 'days');
          })
        });
      } else if (interval === '1d') {
        file_type.entities.forEach(function(item) {
          var date = moment(req.body.start_time_in_ms).hours(0).minutes(0).seconds(0).milliseconds(0);
          item.values.forEach(function(series) {
            series.epoch_time = date.valueOf();
            date.add(1, 'days');
          })
        });
      } else if (interval === '1M') {
        file_type.entities.forEach(function(item) {
          var date = moment(req.body.start_time_in_ms).hours(0).minutes(0).seconds(0).milliseconds(0);
          item.values.forEach(function(series) {
            series.epoch_time = date.valueOf();
            date.add(1, 'months');
          })
        });
      }

      res.send(JSON.stringify(file_type));
    });
  });

  app.get('/fa_gateway/files/:file_id/path', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'file_path.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      var response = {};
      var data = JSON.parse(data);
      data.entities.forEach(function(element, i) {
        if (element.id === req.params.file_id) {
          response.path = element.path + element.name;
        }
      })
      res.send(JSON.stringify(response));
    });
  });

  app.get('/fa_gateway/files', function(req, res) {
    var searchFile = 'file_search.json';
    if (req.query.object_type === 'Directory') {
      searchFile = 'folder_search.json';
    }
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      searchFile), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      res.send(JSON.stringify(search(data, req)));
    });
  });

  app.get('/fa_gateway/files/suggest', function(req, res) {
    var searchFile = 'file_search.json';
    if (req.query.object_type === 'Directory') {
      searchFile = 'folder_search.json';
    }
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      searchFile), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      req.query.search = req.query.prefix;
      res.send(JSON.stringify(search(data, req, true)));
    });
  });


  app.get('/fa_gateway/users/suggest', function(req, res) {
    var searchFile = 'user_search.json';
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      searchFile), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      req.query.search = req.query.prefix;
      res.send(JSON.stringify(search(data, req, true)));
    });
  });


  app.get('/fa_gateway/users', function(req, res) {
    var searchFile = 'user_search.json';
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      searchFile), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      res.send(JSON.stringify(search(data, req)));
    });
  });

  app.post('/fa_gateway/user_machines', jsonParser, function(req, res) {
    var searchFile = 'user_machine_search.json';
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      searchFile), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      res.send(JSON.stringify(search(data, req)));
    });
  });

  app.get('/fa_gateway/anomaly_configurations', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'anomaly_configuration_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('file_type :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/files/top_accessed', function(req, res) {
    var diffInDays = moment().diff(moment.unix(req.query.start_time_in_ms / 1000), 'days');
    var file = 'top_accessed_files_last_24_hours.json';
    if (diffInDays > 360) {
      file = 'top_accessed_files_last_1_year.json'
    } else if (diffInDays > 29) {
      file = 'top_accessed_files_last_30_days.json'
    } else if (diffInDays > 6) {
      file = 'top_accessed_files_last_7_days.json'
    }
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      file), 'utf8', function(err, data) {
      if (err) {
        console.log('top_accessed_files :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/fileservers/capacity/stats', function(req, res) {
    var file = 'capacity_trend_last_30_days.json';
    var interval = req.query.interval;
    if (interval === '1d') {
      file = 'capacity_trend_last_7_days.json';
    } else if (interval === '1M') {
      file = 'capacity_trend_last_1_year.json';
    }

    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      file), 'utf8', function(err, data) {
      if (err) {
        console.log('capacity_stats :' + err);
      }
      var capacity = JSON.parse(data);
      if (interval === '1d') {
        var days = 7;
        capacity.entities.forEach(function(buckets) {
          var date = moment().hours(0).minutes(0).seconds(0).milliseconds(0)
            .subtract(--days, 'days');
          buckets.from = date.valueOf();
          buckets.to = date.valueOf();
        });
      } else if (interval === '1M') {
        var months = 13;
        capacity.entities.forEach(function(buckets) {
          var date = moment().hours(0).minutes(0).seconds(0).milliseconds(0)
            .subtract(--months, 'months');
          buckets.from = date.valueOf();
          buckets.to = date.add(1, 'months')
            .subtract(1, 'milliseconds').valueOf();
        });
      } else if (interval === '5d') {
        var days = 35;
        capacity.entities.forEach(function(buckets) {
          days = days - 5;
          var date = moment().hours(0).minutes(0).seconds(0).milliseconds(0)
            .subtract(days, 'days');
          buckets.from = date.valueOf();
          buckets.to = date.add(5, 'days')
            .subtract(1, 'milliseconds').valueOf();
        });
      }
      res.send(JSON.stringify(capacity));
    });
  });


  app.get('/fa_gateway/fileservers/capacity/details', function(req, res) {
    var file = 'capacity_share_details.json';
    if (req.query.type === 'folder') {
      file = 'capacity_folder_details.json';
    } else if (req.query.type === 'category') {
      file = 'capacity_category_details.json';
    }
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      file), 'utf8', function(err, data) {
      if (err) {
        console.log('capacity_details :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/files/dormantdata_distribution', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'file_age_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('dormant_data :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/fileservers/full_scan', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'file_server_meta_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('full_scan :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/fileservers/details', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'about_analytics_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('full_scan :' + err);
      }
      res.send(data);
    });
  });


  app.get('/fa_gateway/smtp_conf', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'smtp_config_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('full_scan :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/fileservers/notification_policy', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'notification_policy_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('full_scan :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/files/distribution_by_size', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'distribution_by_size.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('distribution_by_size :' + err);
      }
      res.send(data);
    });
  });

  app.get('/fa_gateway/files/access_patterns', function(req, res) {
    var diffInDays = moment().diff(moment.unix(req.query.start_time_in_ms / 1000), 'days');
    var file = 'file_operation_stats_last_24_hours.json';
    if (diffInDays > 360) {
      file = 'file_operation_stats_last_1_year.json'
    } else if (diffInDays > 29) {
      file = 'file_operation_stats_last_30_days.json'
    } else if (diffInDays > 6) {
      file = 'file_operation_stats_last_7_days.json'
    }
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      file), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }
      res.send(data);
    });
  });

  // Top accessed Users audit history
  app.post('/fa_gateway/users/:uid/audit_history', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'user_audit_history_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }
      res.send(JSON.stringify(paginate(data, req)));
    });
  });
  app.post('/fa_gateway/users/:uid/access_patterns', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'user_access_pattern_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }
      res.send(JSON.stringify(filterAccessPattern(data, req)));
    });
  });

  // Top accessed Files audit history
  app.post('/fa_gateway/files/:fid/audit_history', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'file_search.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }
      var result = JSON.parse(data);
      var filename = null;
      result.entities.forEach(function(entity) {
        if (entity.id === req.params.fid) {
          filename = entity.name.split('.', 1) + '.json';
        }
      });
      filename = filename || 'CD_DVD_Images_9NCZ4T7.json';
      fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data', 'fileaudithistorydata',
        filename), 'utf8', function(err, data) {
        if (err) {
          console.log('access_patterns :' + err);
        }
        res.send(JSON.stringify(paginate(data, req)));
      });
    });
  });
  app.post('/fa_gateway/files/:fid/access_patterns', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'file_access_pattern_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }

      res.send(JSON.stringify(filterAccessPattern(data, req)));
    });
  });

  // Top accessed Folders audit history
  app.post('/fa_gateway/folders/:fid/audit_history', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'folder_audit_history_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }

      res.send(JSON.stringify(paginate(data, req)));
    });
  });
  app.post('/fa_gateway/folders/:fid/access_patterns', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'folder_access_pattern_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }
      res.send(JSON.stringify(filterAccessPattern(data, req)));
    });
  });

  // Top accessed User machines audit history
  app.post('/fa_gateway/user_machines/:machine_id/audit_history', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'user_machine_audit_history_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }
      res.send(JSON.stringify(paginate(data, req)));
    });
  });
  app.post('/fa_gateway/user_machines/:machine_id/access_patterns', jsonParser, function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
      'user_machine_access_pattern_data.json'), 'utf8', function(err, data) {
      if (err) {
        console.log('access_patterns :' + err);
      }
      res.send(JSON.stringify(filterAccessPattern(data, req)));
    });
  });


  app.get('/fa_gateway/anomalies/details', function(req, res) {
    if (req.query.detail_type === 'time_series') {

      var file = '';
      var interval = req.query.interval;
      if (interval === '1d') {
        if (req.query.start_time_in_ms > moment().subtract(11, 'days'))
          file = 'anomaly_trend_last_7_days.json';
        else
          file = 'anomaly_trend_last_30_days.json';
      } else if (interval === '1M') {
        file = 'anomaly_trend_last_1_year.json';
      } else if (interval === '1h') {
        file = 'anomaly_trend_last_24_hours.json';
      }

      fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
        file), 'utf8', function(err, data) {
        if (err) {
          console.log('anomaly_trends :' + err);
        }
        var anomaly = JSON.parse(data);
        if (interval === '1d') {
          var days = 30;
          if (req.query.start_time_in_ms > moment().subtract(11, 'days'))
            days = 7;
          anomaly.entities.forEach(function(doc) {
            var date = moment().hours(0).minutes(0).seconds(0).milliseconds(0)
              .subtract(--days, 'days');
            doc.key = date.valueOf();
          });
        } else if (interval === '1h') {
          var hours = 24;
          anomaly.entities.forEach(function(doc) {
            var date = moment().minutes(0).seconds(0).milliseconds(0)
              .subtract(--hours, 'hours');
            doc.key = date.valueOf();
          });
        } else if (interval === '1M') {
          var months = 12;
          anomaly.entities.forEach(function(doc) {
            var date = moment().hours(0).minutes(0).seconds(0).milliseconds(0)
              .subtract(--months, 'months');
            doc.key = date.valueOf();
          });
        }
        res.send(JSON.stringify(anomaly));
      });
    } else if (req.query.detail_type === 'alert_types') {
      fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
        'operation_anomaly_types_last_30_days.json'), 'utf8', function(err, data) {
        if (err) {
          console.log('anomaly_trends :' + err);
        }
        res.send(data);
      });
    } else if (req.query.detail_type === 'top_users') {
      fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
        'anomaly_users_last_30_days.json'), 'utf8', function(err, data) {
        if (err) {
          console.log('anomaly_trends :' + err);
        }
        res.send(data);
      });
    } else if (req.query.detail_type === 'top_dirs') {
      fs.readFile(path.join(__dirname, '..', 'app', 'extras', 'data',
        'anomaly_folders_last_30_days.json'), 'utf8', function(err, data) {
        if (err) {
          console.log('anomaly_trends :' + err);
        }
        res.send(data);
      });
    }

  });

  function search(data, req, name = false) {
    if (!req.query.search)
      req.query.search = req.body.search;

    if (!req.query.count)
      req.query.count = req.body.count;

    var entities = [];
    var result = JSON.parse(data);
    result.metadata.count = req.query.count;
    var relativeDate = moment();
    if (req.query.search !== '*') {
      result.entities.forEach(function(element, i) {
        var updatedDate = relativeDate.subtract(
          Math.floor(Math.random() * (10000000 - 100000 + 1)) + 100000, 'milliseconds').toISOString();
        if (element.last_event.modified_date)
          element.last_event.modified_date = updatedDate;
        else if (element.last_event.event_date)
          element.last_event.event_date = updatedDate;
        let searchBy = element.name || element.machine_name;
        var search =  new RegExp(req.query.search, 'i');
        if (searchBy.match(search)) {
          if (name) {
            if (entities.indexOf(searchBy) === -1) {
              entities.push(searchBy);
            }
          } else {
            entities.push(element);
          }
        }
      });
    } else if (!name) {
      result.entities.forEach(function(element) {
        var updatedDate = relativeDate.subtract(
          Math.floor(Math.random() * (10000000 - 100000 + 1)) + 100000, 'milliseconds').toISOString();
        if (element.last_event.modified_date)
          element.last_event.modified_date = updatedDate;
        else if (element.last_event.event_date)
          element.last_event.event_date = updatedDate;
      });
      entities = result.entities;
    }
    result.metadata.total = entities.length;
    if (req.query.page) {
      result.entities = entities.splice((req.query.count * req.query.page), req.query.count);
    } else {
      result.entities = entities.splice(0, req.query.count);
    }
    result.metadata.page = req.query.page || 0;
    return result;
  }

  function paginate(data, req) {
    if (!req.query.count)
      req.query.count = req.body.count;
    if (!req.query.page)
      req.query.page = req.body.page || 0;
    var result = JSON.parse(data);
    var entities = result.entities;

    var relativeDate = moment();

    entities.forEach(function(entity) {
      entity.audit_event_date = relativeDate.subtract(Math.floor(Math.random() * (10000000 - 100000 + 1)) + 100000, 'milliseconds').toISOString();
    });
    if (req.query.page) {
      result.entities = entities.splice((req.query.count * req.query.page), req.query.count);
    } else {
      result.entities = entities.splice(0, req.query.count);
    }
    result.metadata.page = req.query.page;
    result.metadata.count = result.entities.length;
    return result;
  }

  function filterAccessPattern(data, req) {
    var result = JSON.parse(data);

    var excludes = req.body.excludes && req.body.excludes.operations ? req.body.excludes.operations : [],
      includes = req.body.includes && req.body.includes.operations ? req.body.includes.operations : [];
    if (req.body.includes && req.body.includes.op_status)
      includes = includes.concat(req.body.includes.op_status);
    if (req.body.excludes && req.body.excludes.op_status)
      excludes = excludes.concat(req.body.excludes.op_status);
    var entities = [];

    result.entities.forEach(function(entity) {
      var addEntity = false;
      if (includes.length) {
        includes.forEach(function(item) {
          if (entity.name == item) {
            addEntity = true;
          }
          if (excludes.length) {
            excludes.forEach(function(item) {
              if (entity.name === item) {
                addEntity = false;
              }
            })
          }
        })
      } else {
        addEntity = true;
        if (excludes.length) {
          excludes.forEach(function(item) {
            if (entity.name === item) {
              addEntity = false;
            }
          });
        }
      }
      if (addEntity)
        entities.push(entity);
    });

    result.entities = entities;
    result.metadata.count = result.metadata.total = entities.length;
    return result;
  }
};
