/*jshint esversion: 6 */

(function() {
    var walkme = document.createElement("script"); 
    walkme.type = "text/javascript"; 
    walkme.async = true; 
    walkme.src = "https://cdn.walkme.com/users/72cbf1f3c2d84e1d9c090d14ee9cc6dd/walkme_72cbf1f3c2d84e1d9c090d14ee9cc6dd_https.js"; 
    var s = document.getElementsByTagName("script")[0]; 
    s.parentNode.insertBefore(walkme, s); 
    window._walkmeConfig = {
        smartLoad:true
    }; 
})();
(function(){
    var w=window;var ic=w.Intercom;
    if(typeof ic==="function"){
        ic("reattach_activator");
        ic("update",w.intercomSettings);
    }else{
        var d=document;
        var i=function(){
            i.c(arguments);
        };
        i.q=[];
        i.c=function(args){
            i.q.push(args);
        };
        w.Intercom=i;
        var l=function(){
            var s=d.createElement("script");
            s.type="text/javascript";
            s.async=true;s.src="https://widget.intercom.io/widget/k93f3h82";
            var x=d.getElementsByTagName("script")[0];
            x.parentNode.insertBefore(s,x);
        };
        if(w.attachEvent){
            w.attachEvent("onload",l);
        }else{
            w.addEventListener("load",l,false);
        }}})();
function getUsersCookie(e){
    for(var t=e+"=",o=decodeURIComponent(document.cookie).split(";"),n=0;n<o.length;n++){
        for(var r=o[n];" "==r.charAt(0);)r=r.substring(1);
        if(0==r.indexOf(t))
        return r.substring(t.length,r.length);
    }
    return"";
}

var user_id = getUsersCookie("td_cu_email").replace(RegExp("\\\"", "g"),"");
if (user_id != "") {
    var user_hash = getUsersCookie("td_user_key");
    window.intercomSettings={
        app_id:"k93f3h82",
        user_id: user_id,
        user_hash: user_hash
    };
} else {
    window.intercomSettings = {
        app_id: "k93f3h82"
      };
}