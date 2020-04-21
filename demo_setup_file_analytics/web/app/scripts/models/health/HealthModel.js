//
// Copyright (c) 2019 Nutanix Inc. All rights reserved.
//
// HealthModel is the model class of the entity file analytics health
//
define([
  // Core
  'models/base/BaseModel',
  // Utils
  'utils/DataURLConstants',
  'utils/TimeUtil',
  'utils/AppConstants'],
function(
  // References of core
  BaseModel,
  // Utils
  DataURLConstants,
  TimeUtil,
  AppConstants) {

  'use strict';

  var DP = {
    TOTAL_EVENTS              : 'file_analytics_total_number_of_events',
    TOTAL_FILES               : 'file_analytics_total_number_of_files',
    TOTAL_FOLDERS             : 'file_analytics_total_number_of_folders',
    TOTAL_USERS               : 'file_analytics_total_number_of_users',
    FILE_ANALYTICS_HEALTH     : 'file_analytics_health',
    GATEWAY_CONTAINER_STATS   : 'file_analytics_gateway_container_stats',
    GATEWAY_CONTAINER_HEALTH  : 'file_analytics_gateway_container_health',
    KAFKA_CONTAINER_STATS     : 'file_analytics_kafka_stats',
    KAFKA_CONTAINER_HEALTH    : 'file_analytics_kafka_container_health',
    ES_CONTAINER_STATS        : 'file_analytics_elastic_search_stats',
    ES_CONTAINER_HEALTH       : 'elastic_search_cluster_status',
    ES_CACHE_AVAILABLE        :
      'elastic_search_container_percent_available_memory_with_cache',
    ES_NODE_STATUS            : 'elastic_search_nodes_status',
    ES_JVM_HEAP_MEMORY_USAGE  : 'es_node_jvm_heap_memory_usage',
    ES_CPU_USAGE              : 'es_node_cpu_usage_in_percent',
    ES_OPEN_CONNECTIONS       : 'es_node_number_of_open_http_connections',
    HOST_STATS                : 'file_analytics_host_stats',
    HOST_MEMORY_USAGE         : 'file_analytics_memory_used',
    HOST_AVAILABLE_MEMORY     : 'file_analytics_percent_available_memory',
    HOST_TOTAL_MEMORY         : 'file_analytics_total_memory',
    HOST_CPU_USAGE            : 'file_analytics_percent_cpu_usage',
    HOST_DISK_USAGE_PERCENT   : 'file_analytics_percent_disk_usage',
    HOST_VG_USAGE_PERCENT     : 'file_analytics_percent_volume_group_usage',
    HOST_DISK_USAGE           : 'file_analytics_disk_used',
    HOST_TOTAL_DISK           : 'file_analytics_total_disk',
    HOST_VG_USAGE             : 'file_analytics_volume_group_used',
    HOST_TOTAL_VG_SIZE        : 'file_analytics_total_volume_group_size',
    HOST_VM_HEALTH            : 'file_analytics_vm_host_health',
    DESCRIPTION_OF_STATUS     : 'description_of_status',
    LAST_UPDATED_AT           : 'last_updated_at',
    ERROR                     : 'error'
  };

  var HealthModel = BaseModel.extend({

    urlRoot: DataURLConstants.AFS_ROOT_URL,

    // @override
    // Builds the URL structure
    getURL: function(options) {
      this.url = this.urlRoot + DataURLConstants.HEALTH_STATUS;
      if (options && options.username) {
        const usrTempl = _.template(DataURLConstants.APPEND_USER_NAME, {
          userName: options.username
        });
        this.url = this.url + '?' + usrTempl;
      }
      return this.url;
    },

    // Get current time and the time of data being populated, if the
    // difference is more than 30 minutes, mark the data as invalid.
    // multiplying into 1000 to get epoch in milliseconds
    isValidHealthData: function() {
      const timeOfData = new Date(
              this.get(DP.LAST_UPDATED_AT) * 1000),
            currentTime = new Date();
      const differenceInTime = TimeUtil
        .getDifference(currentTime, timeOfData, 'minutes');
      if (differenceInTime > AppConstants.STALE_HEALTH_TIMEOUT) {
        return false;
      }
      return true;
    },

    // Get error returned from server
    getError: function() {
      return this.get(DP.ERROR);
    }
  }, {

    // Static Constants
    //-----------------

    // Local data property constants.
    DP: DP
  });

  // Returns the HealthModel class
  return HealthModel;
});
