(function () {


    /*********************************
    *
    * set params
    *
    *********************************/

    var apiRoot = "{{ g.roots.api }}".replace("http:", window.location.protocol)
    var webappRoot = "{{ g.roots.webapp }}".replace("http:", window.location.protocol)
    var webappRootPretty = "{{ g.roots.webapp_pretty }}".replace("http:", window.location.protocol)



    /*********************************
    *
    * Load js libs (inserted by the server)
    *
    * note: the bootstrap plugins have been modified; they're now initialized
    * with (jQuery) instead of (window.jQuery), since we don't know if the
    * window actually has jQuery available...
    *
    *********************************/

    console.log("loading external libs")
    ;{{ libs }}

    /*********************************
    *
    * Load styles for widgets
    *
    *********************************/

    function requestStylesheet(stylesheet_url) {
        var stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        stylesheet.href = stylesheet_url;
        stylesheet.media = "all";
        document.getElementsByTagName("head")[0].appendChild(stylesheet);
    }
    requestStylesheet(webappRoot + "/static/css/embed.css");


    /*********************************
    *
    * Use our local jQuery to create all the widgets.
    *
    *********************************/
    jQuery(document).ready(function ($) {
        console.log("page has loaded; inside $(document).ready block")

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

        var badgesTemplateStr = '{{ badges_template }}'
        badgesTemplateStr = badgesTemplateStr.replace(new RegExp("&apos;", "g"), "'")

        ich.addTemplate("badges", badgesTemplateStr)
        var allParams = [] // holds every param obj created; there's one per widget.







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
                str = $.trim(str)
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

        function logParams(params, isFirstWidget){
            if (!isFirstWidget) return false

            var dataToSubmit = {
                params: params,
                url: location.href,
                num_widgets: $(".impactstory-embed").length
            }

            $.ajax({
                url: webappRoot + "/widget-analytics",
                type:"POST",
                data: JSON.stringify(dataToSubmit),
                contentType: "application/json; charset=utf-8",
                success:function(r){
                    console.log("successfully sent analytics data to server.")
                }
           })
            return false
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
            var logoLink$ = $('<a href="' + webappRootPretty + '/item/'
                                  + params["id-type"] + "/" + params["id"] + '?source=widget" target="_blank">'
                                  + img + "</a>");
            div$.prepend(logoLink$)
            return div$
        }

        function wrapInLink(el$, namespace, id){
            return el$.wrapAll("<a href='" + webappRootPretty + "/item/"+
                                   namespace + "/" + id +  "?source=widget' target='_blank' />")
        }


        /****************************************
        *
        * Iterate over each widget
        *
        * ***************************************
        */
        // this runs for each instance of the widget on the page
        console.log("starting loop to iterate over each widgets")
        var isFirstWidget = true
        $(".impactstory-embed").each(function(index){

            var thisDiv$ = $(this)
            var params = makeParams(thisDiv$)
            allParams.push(params)
            if (!(params["api-key"] && params["id"] && params["id-type"])) {
                console.error("you're missing required parameters.")
                return false
            }
            isFirstWidget = logParams(params, isFirstWidget)




            /***************************************************************
            * Define callbacks to use. It's really ugly define them here,
            * but this way they get called with the correct div all set inside 'em.
            * No sure how else to do that right now.
            **************************************************************/

            var insertBadges = function (dict, id) {
                var itemView = new ItemView($)
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
            *  procedural code, run for each widget
            *
            **************************************************************/

            // apply those user-defined params that apply a class to the whole div:
            thisDiv$.addClass("impactstory-" + params["badge-size"])
            thisDiv$.addClass("impactstory-" + params["badge-type"])
            thisDiv$.addClass("impactstory-" + params["badge-palette"])

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
