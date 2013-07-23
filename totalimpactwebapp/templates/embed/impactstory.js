

(function () {


    /*********************************
     *
     * set params
     *
     *********************************/

    var apiRoot = window.location.protocol + "//{{ g.roots.api }}"
    var webappRoot = window.location.protocol + "//{{ g.roots.webapp }}"
    var webappRootPretty = "http://{{ g.roots.webapp_pretty }}"


    /*********************************
     *
     * Load js libs (inserted by the server)
     *
     * note: the bootstrap plugins have been modified; they're now initialized
     * with (jQuery) instead of (window.jQuery), since we don't know if the
     * window actually has jQuery available...
     *
     *********************************/

     ;{{ libs }}

    // load segment.io
    analytics.load("{{ g.segmentio_key }}");



    var $ = jQuery
    $.support.cors = true; // makes IE8 and IE9 support CORS somehow...
    $.ajaxSetup({ cache:false });
    if (!window.console) { window.console = {log: function() {}}; }


    var defaultParams = function() {
        return {
            // required from client; these defaults will not work
            "id": false,
            "id-type": false,
            "api-key": false,

            // optional
            "badge-palette": "color",
            "badge-size": "large",
            "badge-type": "tag",
            "on-finish": false,
            "show-logo": true,
            "show-badges": true,
            "verbose-badges": false
        }
    }







    /****************************************
     *
     * impactstory.js function definitions
     *
     * **************************************
     */


    function makeParams(div$) {
        var el = div$[0]
        var params = defaultParams()

        var convertAttrs = function(str, lowercase) {
            var out
            str = jQuery.trim(str)
            if (lowercase == false) {
                out = str
            }
            else if (str.toLowerCase() === "false") {
                out = false
            }
            else if (str.toLowerCase() === "true") {
                out = true
            }
            else {
                out = str.toLowerCase()
            }
            return out
        }

        for (var i=0;i<el.attributes.length;i++){
            var key = convertAttrs(el.attributes[i].nodeName, true)
            if (key.indexOf("data-") === 0) {
                var key = key.replace("data-", "")

                var defaultVal = params[key]

                var val
                if (key == "on-finish") {
                    val = convertAttrs(el.attributes[i].nodeValue, false)
                }
                else {
                    val = convertAttrs(el.attributes[i].nodeValue, true)
                }
                params[key] = val
            }
        }

        return params
    }


    function requestStylesheet(stylesheet_url) {
        var stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        stylesheet.href = stylesheet_url;
        stylesheet.media = "all";
        document.getElementsByTagName("head")[0].appendChild(stylesheet);
    }

    function sendPageAnalytics(apiKey, firstRun){
        if (firstRun) {
            console.debug("sending page analytics")
            analytics.identify("apiKey");
            analytics.track('Served a page with embedded widget',{
                "number of widgets on page": 10
            })
        }
    }

    function sendWidgetAnalytics(params) {
        console.debug("sending widget analytics")
        analytics.track('Loaded a widget', params)
    }

    function addLogo(div$, params){

        if (!params["show-logo"]) {
            return div$
        }
        var imgSrc = webappRoot + "/static/img/impactstory-logo-small.png"
        if (params['badge-palette'] == "grayscale") {
            imgSrc = imgSrc.replace(".png", "-grayscale.png")
        }
        var img = '<img src="' + imgSrc +'" alt="ImpactStory logo" />'

        // I can't figure out how to get the wrapInLink() function to work for a
        // single item like this, so here's this repulsive hack in the meantime:
        var logoLink$ = jQuery('<a href="' + webappRootPretty + '/item/'
                                   + params["id-type"] + "/" + params["id"] + '" target="_blank">'
                                   + img + "</a>");
        div$.prepend(logoLink$)
        return div$
    }

    function wrapInLink(el$, namespace, id){
        return el$.wrapAll("<a href='" + webappRootPretty + "/item/"+
                               namespace + "/" + id +  "' target='_blank' />")
    }


    /****************************************
     *
     * stuff that runs once the document is loaded
     * TODO: move more of this into functions outside here
     *
     * ***************************************
     */

    requestStylesheet(webappRoot + "/static/css/embed.css");
    jQuery(document).ready(function ($) {
        console.debug("Document ready has fired, running ImpactStory scripts inside block now.")
        var firstRun = true

        var badgesTemplateStr = '{{ badges_template }}'
        badgesTemplateStr = badgesTemplateStr.replace(new RegExp("&apos;", "g"), "'")

        ich.addTemplate("badges", badgesTemplateStr)
        var allParams = [] // holds every param obj created; there's one per widget.


        // this runs for each instance of the widget on the page
        console.debug("starting loop to iterate over each widgets")
        $(".impactstory-embed").each(function(index){

            var thisDiv$ = $(this)
            var params = makeParams(thisDiv$)
            allParams.push(params)
            if (!(params["api-key"] && params["id"] && params["id-type"])) {
                console.error("you're missing required parameters.")
                return false
            }
            sendPageAnalytics(params["apiKey"], firstRun)
            firstRun = false


            /***************************************************************
             * Define callbacks to use. It's really ugly define them here,
             * but this way they get called with the correct div all set inside 'em.
             * No sure how else to do that right now.
             **************************************************************/

            var insertBadges = function (dict, id) {
                var itemView = new ItemView(jQuery)
                var badges$ = itemView.renderBadges(dict.awards)
                wrapInLink(badges$.find("span.label"), params["id-type"], params["id"])


                thisDiv$ = addLogo(thisDiv$, params)
                if (params["verbose-badges"]) thisDiv$.addClass("verbose")
                thisDiv$.append(badges$)

            }

            var getWindowCallback = function(div$, dict){
                var awards = dict.awards
                if (params["on-finish"]) {
                    window[params["on-finish"]].call(window, awards, div$)
                }
            }




            /**************************************************************
             *
             * Start procedural code, done with definitions.
             *
             **************************************************************/

            // apply those user-defined params that apply a class to the whole div:
            thisDiv$.addClass("impactstory-" + params["badge-size"])
            thisDiv$.addClass("impactstory-" + params["badge-type"])
            thisDiv$.addClass("impactstory-" + params["badge-palette"])

            // log the user filling in this widget.
            sendWidgetAnalytics(params)

            // if the user doesn't want badges, no need to make the get() call.
            if (!params["show-badges"]){
                addLogo(thisDiv$, params)
                return true
            }
            else {
                var item = new Item([params["id-type"], params["id"]], new ItemView($), $)
                item.get(
                    apiRoot,
                    params["api-key"],
                    function(dict, id) { // run insertBadges, then a user-defined callback
                        insertBadges(dict, id)
                        getWindowCallback(thisDiv$, dict) // we find the user callback here
                    },
                    function(data){
                        thisDiv$.append("<span class='loading'>Gathering metrics now...</span>")
                    }
                )
                return true
            }
        }) // done with code that runs for each widget
    });
    jQuery.noConflict(true) // return control of jQuery obj to page's version

})()
