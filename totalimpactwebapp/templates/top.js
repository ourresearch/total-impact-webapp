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

// NewRelic logging
{{ newrelic_header|safe }}


// Prepare Segment.io's analytics.js object:

// for testing, monkeypatch the Segment.io functions to do nothing
if (window.location.href.indexOf(".herokuapp.com") > -1) {
  window.analytics = {
    track: function(){console.log("called stubbed analytics.track()")},
    page: function(){console.log("called stubbed anlytics.page()")},
    alias: function(){console.log("called stubbed analytics.alias()")},
    identify: function(){console.log("called stubbed analytics.identify()")}
  }
}
else {
  window.analytics||(window.analytics=[]),window.analytics.methods=["identify","track","trackLink","trackForm","trackClick","trackSubmit","page","pageview","ab","alias","ready","group","on","once","off"],window.analytics.factory=function(a){return function(){var t=Array.prototype.slice.call(arguments);return t.unshift(a),window.analytics.push(t),window.analytics}};for(var i=0;i<window.analytics.methods.length;i++){var method=window.analytics.methods[i];window.analytics[method]=window.analytics.factory(method)}window.analytics.load=function(a){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src=("https:"===document.location.protocol?"https://":"http://")+"d2dq2ahtl5zl1z.cloudfront.net/analytics.js/v1/"+a+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n)},window.analytics.SNIPPET_VERSION="2.0.6",
  window.analytics.load("{{ segmentio_key }}")
}

