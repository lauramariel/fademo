//
// Copyright (c) 2012 Nutanix Inc. All rights reserved.
//
// NotificationTemplates contains reusable messages and HTML templates for
// notification.
//
// TODO: In 4.1, we have to implement escape in underscore template's <%= %>.
//
define(function() {

  'use strict';

  return {

    // Button more information
    BTN_MORE_INFO : '<a notificationId="<%= notificationId %>"  \
                        class="btnMoreInfo">  \
                     Details  \
                     </a>',

    // Notification div message
    NOTIFICATION_MSG: '<div class="n-<%= notifyTypeStyle %>  \
                          n-notification-msg"  \
                            notificationId="<%= notificationId %>">  \
                          <a notificationId="<%= notificationId %>"  \
                            class="n-close">  \
                          </a>  \
                          <div class="n-notification-text">  \
                            <%= message %>  \
                          </div>  \
                          <div class="n-button-holder">  \
                            <%= buttons %>  \
                          </div>  \
                        </div>',

    // Notification message for Notification Bar
    NOTIFICATION_BAR_MSG:
          '<div class="n-message" id="<%= id %>"> \
            <%= message %> \
              <% if (showCloseBtn) { %>\
                <a class="n-close" notificationBar="true"> \
                  <i class="" data-icon="v" aria-hidden="true"/> \
                </a> \
              <% } %>\
            <span class="n-nav"></span> \
          </div>',

    // Latency div message
    LATENCY_MSG:      '<div class="n-notification-loading  \
                            n-notification-msg"  \
                            latencyId="<%= latencyId %>">  \
                          <a latencyId="<%= latencyId %>"  \
                            class="n-close">  \
                          </a>  \
                          <div class="n-notification-text">  \
                            <%= message %>  \
                          </div>  \
                        </div>',

    // Loading message
    LOADING:
        '<div \
            class="n-notification n-notification-loading n-notification-msg" \
            style="opacity:1" \
            latencyId="loading">  \
          <div class="n-notification-text">  \
            Loading...  \
          </div>  \
        </div>'
  };
});
