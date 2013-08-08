function setRoot(url){
    var vmLocalhost = "10.0.2.2"

    if (location.host.indexOf(vmLocalhost) === 0) {
        url = url.replace("localhost", vmLocalhost)
    }

    url.replace("http:", window.location.protocol)
    return url
}

var api_root=setRoot('{{ g.roots.api }}')
var api_root_pretty=setRoot('{{ g.roots.api_pretty }}')
var webapp_root=setRoot('{{ g.roots.webapp }}')
var webapp_root_pretty=setRoot('{{ g.roots.webapp_pretty }}')

var api_key='{{ g.api_key }}'
var request_url='{{ request_url }}' // i don't think we need, this, keeping for legacy code
