/**
 * js to run at the bottom of the page. it's a template so that flask can modify
 * stuff depending on the environment (local, staging, production) where it's
 * running.
 */



// UserVoice JavaScript SDK (only needed once on a page)
(function(){var uv=document.createElement('script');uv.type='text/javascript';uv.async=true;uv.src='//widget.uservoice.com/OQC1qQJBAPv28X1VBsYbw.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(uv,s)})()

// A tab to launch the Classic Widget
UserVoice = window.UserVoice || [];

// NewRelic logging
{{ newrelic_footer|safe }}

