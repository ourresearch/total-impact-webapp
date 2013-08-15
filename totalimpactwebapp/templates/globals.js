
/******************************************************************************
 *
 *  Set static global js vars; can be used anywhere. This is STATIC vars...
 *  things that don't change once flask starts up (generally just env vars).
 *
 ******************************************************************************/


// set various roots
var api_root=setRoot('{{ g.roots.api }}', true)
var api_root_pretty=setRoot('{{ g.roots.api_pretty }}')
var webapp_root=setRoot('{{ g.roots.webapp }}', true)
var webapp_root_pretty=setRoot('{{ g.roots.webapp_pretty }}')


// set other globals
var api_key='{{ g.api_key }}'
var request_url='{{ request_url }}' // i don't think we need this, keeping for legacy code
var segmentio_key = 'g.segmentio_key'






/******************************************************************************
 *
 *  function definitions
 *
 ******************************************************************************/

function setRoot(url, httpsify){
    var vmLocalhost = "10.0.2.2"

    if (location.host.indexOf(vmLocalhost) === 0) {
        url = url.replace("localhost", vmLocalhost)
    }

    if (httpsify) {
        url = url.replace("http:", window.location.protocol)
    }

    return url
}