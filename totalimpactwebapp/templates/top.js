/**
 * js to run at the top of the page. it's a template so that flask can modify
 * stuff depending on the environment (local, staging, production) where it's
 * running.
 */


// shim console.log for IE
if (typeof console === "undefined"){
    console={
      log: function(){}
    }
}

// errorception logging
       (function(_,e,rr,s){_errs=[s];var c=_.onerror;_.onerror=function(){var a=arguments;_errs.push(a);
       c&&c.apply(this,a)};var b=function(){var c=e.createElement(rr),b=e.getElementsByTagName(rr)[0];
       c.src="//beacon.errorception.com/"+s+".js";c.async=!0;b.parentNode.insertBefore(c,b)};
       _.addEventListener?_.addEventListener("load",b,!1):_.attachEvent("onload",b)})
       (window,document,"script","51ef3db2db2bef20770003e2");


// NewRelic logging
{{ newrelic_header|safe }}


// segment.io logginds
window.analytics||(window.analytics=[]),window.analytics.methods=["identify","track","trackLink","trackForm","trackClick","trackSubmit","page","pageview","ab","alias","ready","group","on","once","off"],window.analytics.factory=function(a){return function(){var t=Array.prototype.slice.call(arguments);return t.unshift(a),window.analytics.push(t),window.analytics}};for(var i=0;i<window.analytics.methods.length;i++){var method=window.analytics.methods[i];window.analytics[method]=window.analytics.factory(method)}window.analytics.load=function(a){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src=("https:"===document.location.protocol?"https://":"http://")+"d2dq2ahtl5zl1z.cloudfront.net/analytics.js/v1/"+a+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n)},window.analytics.SNIPPET_VERSION="2.0.6",
window.analytics.load("{{ segmentio_key }}")

