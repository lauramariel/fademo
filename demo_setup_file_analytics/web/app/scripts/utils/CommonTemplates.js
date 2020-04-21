//
// Copyright (c) 2017 Nutanix Inc. All rights reserved.
//
// CommonTemplates contains HTML templates that are reusable.
//
define(
  [
    // Utils
    'utils/SVG'],
  function(
    // Utils
    SVG) {
    'use strict';

    const svgCloseIcon = SVG.SVGIcon('v', '-mini');
    const svgWarnIcon = SVG.SVGIcon('Exclamation_Mark', '-inline -micro');
    const svgEditIcon = SVG.SVGIcon('F', '-mini');

    return {

      // TOP_TABLE : _.templatse('<div class="<%= className %>"></div>'),
      TOP_TABLE : _.template('<div class="<%= className %>" actiontarget="<%= actionTarget %>"></div>'),

      FIRST_PAGE_ERROR : _.template('<div class="first-page-error main">\
        <p>YOU DONT KNOW WHERE YOU ARE ?</p>\
        <p class="sub">Neither do we.</p>\
        <p> 404 Error.</p>\
        </div>'),

      LEGEND_TEMPLATE: _.template(`</div>
        <div class="<%= legendClass %> dashboard-table-legend"></div>`),

      SEARCH_TEMPLATE: _.template('<div class="filterBox filter-box">\
        <div class="searchIcon icon -search">\
          <%= Components.icon("mag-glass", "-inline") %>\
        </div>\
        <input class="text searchBox tableFilter" type="text"\
          placeholder="Search">\
      </div>'),

      OPERATION_CIRCLE : _.template(
        '<span class="n-operation-icon"\
         style="background:<%= backgroundColor %>;\
         border-color:<%= border %>;"></span> '),

      POPOVER_TEMPLATE : _.template('<span>Loading...</span>'),

      FILESERVER_DROPDOWN : _.template('<li>\
        <a>\
          <span class="n-nav-label selected-file-server" \
          actiontarget="<%= fileServer %>"\
          actiontargetId="<%= fileServerId %>">\
            <%= fileServer %>\
          </span>\
          <%= SVG.SVGIcon("z") %>\
        </a>\
        <ul class="n-main-menu n-nav-menu n-nav-toggle">\
          <li>\
            <ul class="n-nav-col col1">\
              <%\
                _.each(fileServerList, function(fs) {\
              %>\
              <li class="n-nav-menu-item">\
                <a name="<%= fs.fileserver_name %>"\
                  actionTarget="<%= fs.fileserver_name %>"\
                  actionTargetId="<%= fs.fileserver_uuid %>"\
                  class="optionviewer fancy-select file-server-list-option">\
                  <%= fs.fileserver_name %>\
                </a>\
              </li>\
              <%\
                });\
              %>\
            </ul>\
          </li>\
        </ul>\
      </li>'),

      DASHBOARD_DROPDOWN : _.template('<li class="n-nav-menu-item \
       dashboard-item">\
        <a class="optionviewer fancy-select">\
          <span class="pull-left field-name" action="open" \
          actiontarget=<%= dashboardId %>> \
            <%= field %> \
          </span> \
          <span class="pull-right delete-db" action="delete" \
          actiontarget=<%= dashboardId %>>'
          +  svgCloseIcon + '</span>\
          <span class="pull-right edit-db"\
          style="padding-right: 10px;" action="edit" \
          actiontarget=<%= dashboardId %>>'
          +  svgEditIcon + '</span></a>\
        </li>'),

      NO_DATA : '<div class="alert alert-block">  \
                   <h4>No Data Found</h4>  \
                 </div>',

      LOADING : '<div class="alert alert-info">  \
                   <h4>Loading...</h4>  \
                 </div>',

      SAVING : '<div class="alert alert-info">  \
                  <h4><%= message %></h4>  \
                </div>',

      SUCCESS : _.template(
        `<div class="alert alert-success">  \
           <button type="button" class="close" data-dismiss="alert">  \
            ${svgCloseIcon} \
           </button>  \
           <h4><%= msg %></h4>  \
         </div>`),

      ERROR   : _.template(
        `<div class="alert alert-danger alert-error" data-test="alert-error"  \
        >  \
          <button type="button" class="close" data-dismiss="alert">  \
            ${svgCloseIcon} \
          </button>  \
          <h4 class="error-messages"><%= error %></h4>  \
        </div>`),

      WARNING : _.template(
       `<div class="alert alert-warning">  \
          <button type="button" class="close" data-dismiss="alert">  \
            ${svgCloseIcon} \
          </button>  \
          <h4><%= msg %></h4>  \
        </div>`),

      INFO   : _.template(
        `<div class="alert alert-info">  \
           <button type="button" class="close" data-dismiss="alert">  \
             ${svgCloseIcon} \
           </button>  \
           <h4><%= msg %></h4>  \
         </div>`),

      ERROR_DETAILS : _.template(
        `<div class="alert alert-danger alert-error">  \
            <button type="button" class="close" data-dismiss="alert">  \
              ${svgCloseIcon} \
            </button>  \
            <h4> \
              <%= error %><br/>\
              <a title="<%= details %>" class="n-error-details" \
                tooltip="<%= details %>" > \
                Show me why</a> \
            </h4>  \
          </div>`),

      ERROR_WITH_ACTION : _.template(
        `<div class="alert alert-danger alert-error">  \
          <button type="button" class="close" data-dismiss="alert">  \
            ${svgCloseIcon} \
          </button>  \
          <h4 class="error-messages"><%= error %></h4>  \
          <% if(routeObj.options.trigger == "click") { %> \
            <a href="#" id="<%= routeObj.actionTargetId %>">` +
              '<%= routeObj.actionTargetName%>' +
            '</a> \
          <% } else { %>\
            <a actiontargetid="<%=routeObj.actionTargetId %>" \
              actiontargetname="<%=routeObj.actionTargetName%>" \
              actiontarget="<%=routeObj.actionTarget%>" \
              action="<%=routeObj.action%>" \
              actionparententitytype="<%=routeObj.actionParentEntityType%>" \
              actionparentid="<%=routeObj.actionParentId%>">' +
              '<%=routeObj.actionTargetName%>' +
            '</a> \
          <%}%> \
        </div>'),

      // Action item template
      // Uncomment this when "View Pppermission" link is required
      // ENG-186961 | View Permission need to be removed from UI for now
      // SEARCH_ACTION_ITEM : _.template(
      //   '<span action-target-id="<%= targetId %>"' +
      //     'action-target-name="<%= targetName %>">' +
      //       '<a class="btnDetailsAction auditHistory <%= className %>"' +
      //       ' action="audit" data-toggle="popover">' +
      //         '<%= auditAction %>' +
      //       '</a>' +
      //       '<span class="action-separator"> &middot; </span>' +
      //       '<a class="btnDetailsAction auditHistory" \
      //         action="permission">' +
      //         '<%= permissionAction %>' +
      //       '</a>' +
      //   '</span>'),

      // Action item template
      // Removing "View Permission" link
      // Remove this once link is enabled
      // ENG-186961 | View Permission need to be removed from UI for now
      SEARCH_ACTION_ITEM : _.template(
        '<span action-target-id="<%= targetId %>"' +
          'action-target-name="<%= targetName %>">' +
            '<a class="btnDetailsAction auditHistory <%= className %>"' +
            ' action="audit" data-toggle="<%= dataToggle %>">' +
              '<%= auditAction %>' +
            '</a>' +
        '</span>'),

      // Columns
      //--------

      // Content
      CONTENT_COLUMN : _.template(
       '<table class="n-content-column-container"  \
               cellspacing="0" cellpadding="0" border="0">  \
          <tr>  \
            <%  for (var ii=0; ii < numberOfColumns; ii++ ) {  %>  \
              <td class="n-column  n-column-<%= (ii+1) %>"  \
                  style="width: <%= Math.round(100/numberOfColumns) %>% ">  \
                <div class="n-column-content n-column-content-<%= (ii+1) %>"> \
                </div>  \
              </td>  \
            <%  }  %>  \
          </tr>  \
        </table>'),

      // Cell used to make sure that the content is vertically aligned,
      // especially when antiscroll is enabled.
      CONTENT_COLUMN_CELL_CENTERBOX : _.template(
       '<div class="n-content-column-cell-centerbox">  \
          <%=  content %>  \
        </div>'),

      // Label for big title column (usually placed on the 1st column)
      LABEL_COLUMN : _.template(
        '<div class="n-label-column"> \
          <p class="n-label-column-title"><%= title %></p> \
          <p class="n-label-column-subtitle"><%= subtitle %></p> \
          <% if (smallTitle) { %>  \
            <p class="n-label-column-small-title"><%= smallTitle %></p> \
          <% } %>  \
        </div>'),

      // Label for big/small title (usually placed on the 1x1 widget)
      SMALL_LABEL_COLUMN : _.template(
        '<div class="n-vantage-point-metric-small"> \
          <div class="n-metric-value"> \
            <div class="n-h3 lblValue"> \
              <%= title %> \
              <% if (subtitle) { %>  \
                <span class="n-stats-unit"><%= subtitle %></span> \
              <% } %>  \
            </div> \
            <% if (smallTitle) { %>  \
              <span class="lblResource"><%= smallTitle %></span> \
            <% } %>  \
          </div> \
        </div>'),

      // AntiScroll
      //-----------

      ANTISCROLL : '<div class="antiscroll-wrap">  \
                      <div class="box-wrap">  \
                        <div class="antiscroll-inner">  \
                          <div class="box-inner  n-content-inner">  \
                            <!-- Place content here -->  \
                          </div>  \
                        </div>  \
                      </div>  \
                    </div>',

      // Header Alerts
      //--------------

      DEFAULT_ALERT : _.template(` \
        <div class="alert alert-<%= style %>"> \
          <% if (closeButton) { %>  \
            <button type="button" class="close" data-dismiss="alert">  \
             ${svgCloseIcon} \
            </button>  \
          <% } %>  \
          <h4><%= content %></h4> \
        </div> \
      `),

      // Gateway restart message.
      //-------------------------

      GATEWAY_RESTART : _.template(
        '<div class="n-popup-description" style="font-size:14px;">' +
          'The <%= subject %> has been successfully updated and ' +
          'the prism session is in the process of restarting. This page will ' +
          'automatically refresh shortly.' +
          '<br/><br/>' +
          '<div class="donut-loader-blue-large"></div>' +
        '</div>'),

      // Popup
      // ----------------------

      FOOTER_BUTTON : _.template(
        '<button class="btn n-secondary-btn btnCancel <%= jsCancelClass %>">Cancel \
        </button><button class="btn n-primary-btn btnOk <%= jsSaveClass %>">Save \
        </button>'),

      CUSTOM_FOOTER_BUTTON : _.template(
        '<button class="btn n-secondary-btn btnCancel <%= jsCancelClass %>"><%= cancelBtnText %>\
        </button><button class="btn n-primary-btn btnOk <%= jsSaveClass %>"><%= saveBtnText  %>\
        </button>'),

      CUSTOM_BUTTON : _.template(
        '<button class="btn n-secondary-btn \
          <%= jsCustomClass %>"><%= customBtnText %></button>'),

      // Settings Page
      // ----------------------

      OPTIONS_SEPARATOR : _.template(
        '<div class="ntnx-title-divider ntnx-flex-layout ntnx" \
          data-display="flex" data-flex-direction="row"> \
          <div class="ntnx-divider ntnx" data-type="short" data-theme="light"> \
          </div> \
        </div>'),

      OPTIONS_GROUP : _.template(
        '<div class="ntnx-menu-group ntnx-stacking-layout ntnx"> \
          <div class="mg-title ntnx-stacking-layout ntnx" \
            data-padding="0px-20px"> \
            <h4 class="ntnx ntnx-title"><%= groupTitle %></h4> \
          </div> \
          <%= optionsList %> \
        </div>'),

      OPTIONS_TEMPALTE : _.template(
        '<div class="ntnx-menu-item ntnx ntnx-flex-layout ntnx" \
          data-display="flex" data-flex-direction="row" \
          data-justify-content="space-between" data-align-items="center" \
          data-padding="0px-20px" data-id="<%= optionEntityId %>"> \
          <span data-setting="<%= optionEntity %>" title="<%= optionTitle %>"> \
            <%= optionTitle %> \
          </span> \
        </div>'),

      // Entity Stats content for widgets
      //--------

      // Entity single row template with loading
      ENTITY_TYPE_STATS_LOADING_HTML: _.template(`<div
        id='ets-<%=entityType%>' class='entityTypeStats loading'>
          <%= entityTypeName %>
          <div class='donut-loader-blue'></div>
        </div>`),

      // Entity single row template with only content
      ENTITY_TYPE_STATS_ROW_HTML: _.template(
        `<div id='ets-<%=entityType%>' class='entityTypeStats'>
          <div class="entityTypeStats-header" stream-action="show"
            stream-target="<%= entityTypeName %> entity">
            <div class="pull-right">
              <% if (subText != null) { %>
                <div class="count-box count-box-good">
                  <span class="count-box-number">
                    <%= subText %>
                  </span>
                </div>
              <% } %>
            </div>
            <div class='entity-type-name' title="<%= entityTypeName %>">
              <%= entityTypeName %>
            </div>
          </div>
        </div>`),

      // Entity single row template with content and status
      ENTITY_SUMMARY_ROW_TEMPLATE: _.template(
        `<div id='ets-<%=entityType%>' class='entityTypeStats'>
          <div class="entityTypeStats-header" stream-action="show"
            stream-target="<%= entityTypeName %> entity">
            <div class="pull-right">
              <% if (criticalCount != null) { %>
                <div class="count-box count-box-critical">
                  <div class="count-badge-small critical-count-badge">
                    &nbsp;
                  </div>
                  <span class="count-box-number">
                    <%= criticalCount %>
                  </span>
                </div>
              <% } if (warningCount != null) { %>
                <div class="count-box count-box-warning">
                  <div class="count-badge-small warning-count-badge">
                    &nbsp;
                  </div>
                  <span class="count-box-number">
                    <%= warningCount %>
                  </span>
                </div>
              <% } if (okCount != null) { %>
                <div class="count-box count-box-good">
                  <div class="count-badge-small good-count-badge">&nbsp;</div>
                  <span class="count-box-number">
                    <%= okCount %>
                  </span>
                </div>
              <% } %>
            </div>
            <div class='entity-type-name-back'>
              <a class="back-icon n-icon">x</a>
            </div>
            <div class='entity-type-name' title="<%= entityTypeName %>">
              <%= entityTypeName %>
            </div>
            <% if (totalCount != null) { %>
              <div class="count-badge-small total-count-badge">
                <%= totalCount %>
              </div>
            <% } %>
          </div>
        </div>`),

      // Entity row count
      ENTITY_COUNT_TEMPLATE: _.template(
        `<div class="count-box count-box-<%= type %>" >
           <div class="count-badge-small <%= type %>-count-badge">
             &nbsp;
           </div>
           <span class="count-box-number">
             <%= status %>
           </span>
         </div>`),

      // Entity single row template with content and status
      ENTITY_SUMMARY_ROW_TEMPLATE_POPOVER: _.template(
        `<div id='ets-<%=entityType%>' class='entityTypeStats'>
          <div class="entityTypeStats-header" stream-action="show"
            stream-target="<%= entityTypeName %> entity">
            <div class="pull-right">
            <% if (entityStatus != null) { %>
                <%= entityStatus %>
            <% } %>
            </div>
            <div class='entity-type-name-back'>
              <a class="back-icon n-icon">x</a>
            </div>
            <div class='entity-type-name' title="<%= entityTypeName %>">
              <%= entityTypeName %>
            </div>
            <% if (totalCount != null) { %>
              <div class="count-badge-small total-count-badge">
                <%= totalCount %>
              </div>
            <% } %>
          </div>
        </div>`),

      // Shows the container
      SINGLE_ENTITY_SUMMARY_HEALTH: _.template(
        '<div class="health-container">  \
          <div class="entityTypesSummary">  \
            <%= entitySummary %>  \
          </div> \
        </div>'),

      // Default Loading Template
      LOADING_TEMPLATE: '<div class="loader text-center"> \
        <div class="donut-loader-gray"> \
        </div> \
      </div>'
    };
  }
);
