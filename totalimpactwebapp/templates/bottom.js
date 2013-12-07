/**
 * js to run at the bottom of the page. it's a template so that flask can modify
 * stuff depending on the environment (local, staging, production) where it's
 * running.
 */


// twitter "embed tweets" script (https://dev.twitter.com/docs/embedded-tweets)
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");


// UserVoice JavaScript SDK (only needed once on a page)
(function(){var uv=document.createElement('script');uv.type='text/javascript';uv.async=true;uv.src='//widget.uservoice.com/OQC1qQJBAPv28X1VBsYbw.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(uv,s)})()

// A tab to launch the Classic Widget
UserVoice = window.UserVoice || [];

// NewRelic logging
{{ newrelic_footer|safe }}

