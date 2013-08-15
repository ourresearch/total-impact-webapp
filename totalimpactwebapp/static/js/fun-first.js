/**********************************************************************
 *
 * This stuff should run before all our other js.
 *
 **********************************************************************/





// console calls fail gracefully. must load before ANYTHING we've made
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

