//
// Copyright (c) 2012 Nutanix Inc. All rights reserved.
//
// DataTableTemplates contains reusable HTML templates for datatables.
//
// jsHint options on the next line
/*global require: false, $: false, _: false, define: false, */
//
define(
  [
    'utils/SVG'
  ],
  function(
    SVG
  ) {

    'use strict';

    return {
      // COMMON
      //-------

      // The is where the header tabs will go
      TABLE_GRP_HEADER:
        '<ul class="tableGrpHeader n-table-tab-buttons"></ul>',

      ENTITY_TAB: _.template(
        '<li>  \
           <a data-target="#<%= domID %>"  \
               actionTarget="<%= entity %>"  \
               class="buttonTab">  \
             <%= entityName %>  \
           </a>  \
         </li>'),

      // This is where the DataTableView will go
      TABLE_GRP_BODY:
        '<div class="tableGrpBody  tab-content n-tab-content">  \
           <!-- tab contents go here... -->  \
         </div>',

      // Loading
      LOADING:
        '<div class="n-loading-wrapper"> \
          <div class="n-disable">  \
          </div> \
          <div class="n-loading">  \
            <div class="donut-loader-blue"></div> \
            Loading...  \
          </div> \
        </div>',

      // No Data available
      NO_DATA:
        '<div class="noData" style="display:none"> \
            No Data Available \
        </div>',

      // DATA TABLE FORMAT
      //------------------

      // The format that the datatables library needs for rendering
      DATATABLE:
        '<table class="baseDataTable display" cellpadding="0" cellspacing="0" \
             border="0" style="width: 100%">  \
           <!-- data rows go here... -->  \
         </table> ',


      // HEADER
      //-------

      // Header
      BAR_HEADER:
        '<div class="n-header">  \
          <!-- Header left components go here... -->  \
          <!-- Header right components go here... -->  \
          <div class="n-clearfix"></div> \
         </div>',

      // Left
      HEADER_LEFT:
        '<div class="col-xs-11 pull-left"><ul class="n-header-left">  \
        <%= totalRecords %> Total Results\
        </ul></div>',

      // Right
      HEADER_RIGHT:
        '<div class="pull-right"><ul class="n-header-right"> \
          <li class="n-page-info-container">  \
            <p class="n-page-info"></p>  \
          </li>  \
          <li class="n-page-size-container">  \
          <div class="dropdown pull-right">  \
            <a class="n-page-size-settings dropdown-toggle"  \
            data-toggle="dropdown" >  \
              <i aria-hidden="true" data-icon="z" class="-down-arrow"></i>  \
            </a>  \
            <ul class="dropdown-menu page-select-dropdown">  \
            <li class="page-size-option  \
             <%= defaultMinRows === 10 ? "selected" : "" %>">  \
              <a class="page-size-link"  \
                 data-id="10">10 Rows</a>  \
            </li>  \
            <li class="page-size-option  \
            <%= defaultMinRows === 25 ? "selected" : "" %>">  \
              <a class="page-size-link"  \
                 data-id="25">25 Rows</a>  \
            </li>  \
            <li class="page-size-option  \
            <%= defaultMinRows === 50 ? "selected" : "" %>">  \
              <a class="page-size-link"  \
                 data-id="50">50 Rows</a>  \
            </li>  \
            <li class="page-size-option  \
            <%= defaultMinRows === 100 ? "selected" : "" %>">  \
              <a class="page-size-link"  \
                 data-id="100">100 Rows</a>  \
            </li>  \
        </ul>  \
        </div>  \
          </li>  \
          <li class="n-page-nav-container">  \
            <a class="btn btnPrevious n-button-previous n-disabled">  \
              <i aria-hidden="true" data-icon="x"></i>  \
            </a>  \
            <a class="btn btnNext n-button-next n-disabled" >  \
              <i aria-hidden="true" data-icon="y"></i>  \
            </a>  \
          </li>  \
          <li class="n-download n-settings-container"> \
            <div class="dropdown pull-right settings-dropdown">  \
              <a class="btnSettings n-button-settings dropdown-toggle"  \
                data-toggle="dropdown">  \
                ' + SVG.SVGIcon("C", "gear-icon") + '<!-- \
                  [ This comment is fixing a positioning issue ] \
                --><i aria-hidden="true" data-icon="z" class="-down-arrow"></i>  \
              </a>  \
              <!-- User drop down menu -->  \
              <ul class="dropdown-menu dropdown-menu-right">  \
                <li>  \
                  <a class="btnExport csv">  \
                    Export CSV  \
                  </a>  \
                </li>  \
                <li>  \
                  <a class="btnExport json">  \
                    Export JSON  \
                  </a>  \
                </li>  \
              </ul>  \
            </div>  \
          </li> \
          <li class="n-sep">  \
            &middot; \
          </li>  \
          <li class="n-table-filter-container">  \
            <div class="n-table-filter-wrapper">  \
              <i aria-hidden="true" data-icon="B" class="n-icon-search"></i> \
              <input class="n-table-filter tableFilter tableFilterChange"  \
                     type="text" placeholder="search in table">  \
            </div>  \
          </li>  \
        </ul></div>',

      // Filter Bar
      QUERY_BAR: '<div class="query-bar-wrapper"> \
        <div class="query-bar" data-test="eb-query-bar"></div> \
        <div class="favorite-queries hidden"></div> \
      </div>',

      // Filter Tags
      FILTER_EQUALS_TEMPLATE : _.template(
      '<div class="filter-box <%= filterId %> <%= filterVal %>_tag" \
        title="<%- filterTitle %> <%= operator %> <%- displayFilterVal %>"> \
        <div class="filter-name"> \
        <%- filterTitle %> <%= operator %> <%- displayFilterVal %> \
        </div> \
        <div class="close-btn" data-val="<%= filterVal %>" data-id="<%= filterId %>" > \
        x \
        </div> \
      </div>'),

      // Error
      ERROR: _.template(
        '<div class="n-error">  \
           An error occurred. \
           <% if (typeof errorDetails !== "undefined") { %>  \
             <a data-original-title="<%= errorDetails %>" \
              tooltip="<%= errorDetails %>"\
              class="n-error-details"> \
                Show me why</a> \
           <% } %> \
         </div>'),

      // PAGINATOR
      //----------

      // Showing more than 1 page
      PAGE_INFO_PAGES: _.template(
        '<%= start %>&ndash;<%= end %> of <%= total %>'),

      // Showing only 1 page
      PAGE_INFO_PAGE: _.template(
        '<%= total %> <%= total > 1 ? entityType : entity %>'),

      // Template for table cell popover initiator
      HOVER_TABLE_CELL: _.template(
        '<span class="n-no-style n-cell-popover <%=customClassName%>"' +
          ' data-toggle="popover" <%=dataIdAttr%> ><%= value %></span>'),

      // Template for more element popup view
      MORE_ELEMENT_POPUP: '<a class="more-records" action-target = \
        <%=morePopupLink%>> More..</a>'
    };
  });
