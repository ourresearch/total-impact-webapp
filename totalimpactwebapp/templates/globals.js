// console calls fail gracefully.
// from https://github.com/liamnewmarch/console-shim/blob/master/console-shim.js
if (!window.console) (function() {

    var __console, Console;

    Console = function() {
        var check = setInterval(function() {
            var f;
            if (window.console && console.log && !console.__buffer) {
                clearInterval(check);
                f = (Function.prototype.bind) ? Function.prototype.bind.call(console.log, console) : console.log;
                for (var i = 0; i < __console.__buffer.length; i++) f.apply(console, __console.__buffer[i]);
            }
        }, 1000);

        function log() {
            this.__buffer.push(arguments);
        }

        this.log = log;
        this.error = log;
        this.warn = log;
        this.info = log;
        this.__buffer = [];
    };

    __console = window.console = new Console();
})();

function setRoot(url){
    var vmLocalhost = "10.0.2.2"

    if (location.host.indexOf(vmLocalhost) === 0) {
        url = url.replace("localhost", vmLocalhost)
    }

    url.replace("http:", window.location.protocol)
    console.log("making new url; it's now", url)

    return url
}

console.log("loading globals")
var api_root=setRoot('{{ g.roots.api }}')
var api_root_pretty=setRoot('{{ g.roots.api_pretty }}')
var webapp_root=setRoot('{{ g.roots.webapp }}')
var webapp_root_pretty=setRoot('{{ g.roots.webapp_pretty }}')

console.log("webapp root in ", webapp_root)

var api_key='{{ g.api_key }}'
var request_url='{{ request_url }}' // i don't think we need, this, keeping for legacy code
