//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// ChartTemplates contains reusable HTML templates for charts.
//
define(function() {

  'use strict';

  return {

    // Chart for showing multiple data attributes of an entity
    // It has the legend on the left and the chart on the right of the
    // container. The same template can be used different kinds of charts
    // following the same pattern.
    ENTITY_CHART_WITHOUT_HEADER: _.template(
      '<div class="n-chart-body-container"> \
        <div class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
      </div>'),

    ENTITY_MULTIDATA_CHART_WITHOUT_HEADER: _.template(
      '<div class="n-chart-body-container"> \
        <div class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
      </div>  \
      <div class="noDataBody n-chart-body"  \
        style="display: none;">  \
        <div class="n-chart-no-data" text-center>  \
          <%= no_data %>  \
        </div>  \
      </div> \
      <div class="loading  n-loading">Loading...</div>'),

    ENTITY_SINGLEDATA_CHART: _.template(
      '<div class="n-chart-body-container"> \
        <div id="<%= chartId %>" class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
      </div> \
      <div class="noDataBody n-chart-body"  \
        style="display: none;">  \
        <div class="n-chart-no-data text-center">  \
          <%= no_data %> \
        </div>  \
      </div> \
      <div class="loading  n-loading">Loading...</div>'),

    ENTITY_MULTIDATA_CHART_WITH_BORDER : _.template(
      '<div class="n-chart-header">  \
        <span class="n-chart-metric-title"> \
          <%= title %>  \
        </span>  \
      </div>  \
      <div class="n-chart-body-container"> \
        <div id="<%= chartId %>" class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
      </div>  \
      <div class="noDataBody n-chart-body"  \
        style="display: none;">  \
        <div class="n-chart-no-data text-center">  \
          <%= no_data %>  \
        </div>  \
      </div> \
      <div class="n-chart-separator"></div> \
      <div class="n-loading-wrapper"> \
        <div class="n-disable"></div> \
        <div class="n-loading loading">  \
        <div class="donut-loader-blue"></div> \
          Loading...  \
        </div> \
      </div>'),

    ENTITY_MULTIDATA_CHART_WITH_BORDER_AND_TABLE : _.template(
      '<div class="n-chart-header">  \
        <span class="n-chart-metric-title"> \
          <%= title %>  \
        </span>  \
      </div>  \
      <div class="n-chart-body-container"> \
        <div id="<%= chartId %>" class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
        <table class="chart-legend-table col-md-12">\
          <%= tableData %> \
        </table>\
      </div>  \
      <div class="noDataBody n-chart-body"  \
        style="display: none;">  \
        <div class="n-chart-no-data">  \
          <%= no_data %>  \
        </div>  \
      </div> \
      <div class="n-chart-separator"></div> \
      <div class="loading  n-loading"><%= loading %>...</div>'),

    ENTITY_MULTIDATA_CHART_WITH_BORDER_AND_TABLE_WITHOUT_HEADER : _.template(
      '<div class="n-chart-body-container"> \
        <div id="<%= chartId %>" class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
      </div>  \
      <div class="noDataBody n-chart-body"  \
        style="display: none;">  \
        <div class="n-chart-no-data">  \
          <%= no_data %>  \
        </div>  \
      </div> \
      <div class="loading  n-loading"><%= loading %>...</div>'),

    TABLE: _.template(
      '<table class="n-content-column-container" cellspacing="0" \
        cellpadding="0" border="0">\
          <%= tableData %> \
        </table>'),

    ENTITY_MULTIDATA_CHART_WITH_BORDER_AND_EXPORT: _.template(
      '<div class="n-chart-header">  \
        <span class="n-chart-metric-title"> \
          <%= title %>  \
        </span>  \
        <%= Components.dropdown({ \
          classes   : "n-chart-metric-title download-data btn-group", \
          text      : exportTitle, \
          options   : exportOptions, \
          rightAlign: true \
        }) %> \
      </div>  \
      <div class="n-chart-body-container"> \
        <div class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
      </div>  \
      <div class="noDataBody n-chart-body"  \
        style="display: none;">  \
        <div class="n-chart-no-data">  \
          <%= no_data %>  \
        </div>  \
      </div> \
      <div class="n-chart-separator"></div> \
      <div class="loading  n-loading"><%= loading %>...</div>'),

    ENTITY_MULTIDATA_CHART_WITH_DROPDOWN: _.template(
      '<div class="n-chart-header">  \
        <%= Components.dropdown({ \
          classes   : "action-dropdown", \
          text      : title, \
          options   : options, \
          rightAlign: false \
        }) %> \
        <%= Components.dropdown({ \
          classes   : "n-chart-metric-title download-data btn-group", \
          text      : exportTitle, \
          options   : exportOptions, \
          rightAlign: true \
        }) %> \
      </div>  \
      <div class="n-chart-body-container"> \
        <div class="chartBody  n-chart-body  \
             n-chart-type-entity-multidata"\
             style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
        </div>  \
      </div>  \
      <div class="noDataBody n-chart-body"  \
        style="display: none;">  \
        <div class="n-chart-no-data">  \
          <%= no_data %>  \
        </div>  \
      </div> \
      <div class="n-chart-separator"></div> \
      <div class="loading  n-loading"><%= loading %>...</div>'),

    ENTITY_CHART_WITH_BORDER_AND_FILTER : _.template(
      '<div class="n-chart-header">  \
          <span class="n-chart-metric-title"> \
            <%= title %>  \
          </span>  \
          <div class="n-chart-metric-title filter-data"> \
          </div> \
        </div>  \
        <div class="n-chart-body-container"> \
          <div id="<%= chartId %>" class="chartBody n-chart-body  \
              n-chart-type-entity-multidata"\
              style="<%= chartWidthP ? "width:"+chartWidthP+"%" : "" %>"> \
          </div>  \
        </div>  \
        <div class="noDataBody n-chart-body"  \
          style="display: none;">  \
          <div class="n-chart-no-data">  \
            <%= no_data %>  \
          </div>  \
        </div> \
        <div class="n-chart-separator"></div> \
        <div class="n-loading-wrapper"> \
          <div class="n-disable"></div> \
          <div class="n-loading loading">  \
          <div class="donut-loader-blue"></div> \
            Loading...  \
          </div> \
        </div>'),

    // This template is used for rendering the tooltip content for the bar
    // chart. The tooltip data is generated when formatting received data as
    // needed by d3.
    TOOL_TIP_TEMPLTE: _.template('<div style="padding:10px"> \
      <div><%= entityName %></div> \
      <div> \
        <span><%= dataTitle %>&nbsp;&nbsp;</span> \
        <span><%= dataValue %></span> \
      </div> \
      </div>'),

    CAPACITY_TOOL_TIP_TEMPLATE: _.template('<div style="display:flex; \
      justify-content:flex-start;padding:5px 10px"><div> \
      <%= temp1 %> \
      </div> \
      <div style="flex-basis:70%; margin-right:5px;"> \
      <%= temp2 %> \
      </div> \
      <div> \
      <%= temp3 %> \
      </div> \
      </div>'),

    // No data available template
    NO_DATA_HTML:
     _.template('<div class="n-chart-no-data"> \
        <%= i18n("Placeholder.no_data_available", \
        "No data available") %> \
      </div>'),

    // Error in retrieving data template
    ERROR_IN_DATA_RETRIEVAL_HTML:
     _.template('<div class="n-chart-no-data"> \
        <%= i18n("error_retrieve_data") %></div>'),

    // When Data is not ready yet
    NOT_READY_HTML:
     _.template('<div class="n-chart-no-data">  \
        <p><%= i18n("collecting_data") %></p>   \
      </div>')

  };
});
