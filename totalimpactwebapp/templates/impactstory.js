
(function () {

    /******** Load jQuery if not present *********/
    var jQuery;
    // this embed pattern is from http://alexmarandon.com/articles/web_widget_jquery/
    if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.4.2') {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", "https://ajax.googleapis.com/ajax/libs/jquery/1.7.0/jquery.min.js");
        if (script_tag.readyState) {
            script_tag.onreadystatechange = function () { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    scriptLoadHandler();
                }
            };
        } else {
            script_tag.onload = scriptLoadHandler;
        }
        // Try to find the head, otherwise default to the documentElement
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    } else {
        // The jQuery version on the window is the one we want to use
        jQuery = window.jQuery;
        main();
    }


    /******** Called once jQuery has loaded ******/
    function scriptLoadHandler() {
        // Restore $ and window.jQuery to their previous values and store the
        // new jQuery in our local jQuery variable
        jQuery = window.jQuery.noConflict(true);

        // Call our main function
        main();
    }




    /***************************************************************************
     *
     * Our main function. This is where all the ImpactStory stuff lives.
     *
     * ************************************************************************/

    function main() {

        /*********************************
         *
         * set params
         *
         *********************************/

        var apiRoot = "{{ api_root }}"
        var webappRoot = "{{ webapp_root }}"

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
                "badge-size": "large",
                "badge-type": "tag",
                "on-finish": false,
                "show-logo": true,
                "show-badges": true,
                "verbose-badges": false
            }
        }

        /* ************************************
         * Load js libs (inserted by the server)
         *
         * note: the bootstrap plugins have been modified; they're now initialized
         * with (jQuery) instead of (window.jQuery), since we don't know if the
         * window actually has jQuery available...
         * *************************************
         */
        ;{{ libs }}


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

        function addLogo(div$, params){

            if (!params["show-logo"]) {
                return div$
            }

            // I can't figure out how to get the wrapInLink() function to work for a
            // single item like this, so here's this repulsive hack in the meantime:
            var logoLink$ = jQuery('<a href="http://' + webappRoot + '/item/'
                                       + params["id-type"] + "/" + params["id"] + '" target="_blank">'
                                       + '<img src="http://' + webappRoot
                                       + '/static/img/impactstory-logo-small.png" alt="ImpactStory logo" />'
                                       + "</a>");
            div$.prepend(logoLink$)
            return div$
        }

        function wrapInLink(el$, namespace, id){
            return el$.wrapAll("<a href='http://" + webappRoot + "/item/"+
                                   namespace + "/" + id +  "' target='_blank' />")
        }

        function reportVitals(allParams){
            var vitals = {
                allParams: allParams,
                url: location.href
            }
            $.ajax({
                url: "http://" + webappRoot + "/vitals",
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(vitals),
                success: function(data) { }
                })
        }



        /****************************************
         *
         * stuff that runs once the document is loaded
         * TODO: move more of this into functions outside here
         *
         * ***************************************
         */

        requestStylesheet("http://" + webappRoot + "/static/css/embed.css");
        jQuery(document).ready(function ($) {
            var badgesTemplateStr = '{{ badges_template }}'
            badgesTemplateStr = badgesTemplateStr.replace("&apos;", "'")

            ich.addTemplate("badges", badgesTemplateStr)
            var allParams = [] // holds every param obj created; there's one per widget.


            // this runs for each instance of the widget on the page
            $(".impactstory-embed").each(function(index){
                var thisDiv$ = $(this)
                var params = makeParams(thisDiv$)
                allParams.push(params)
                if (!(params["api-key"] && params["id"] && params["id-type"])) {
                    console.error("you're missing required parameters.")
                    return false
                }


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
                    if (params["on-finish"]) {
                        window[params["on-finish"]].call(window, dict, div$)
                    }
                }




                /**************************************************************
                 *
                 * Start procedural code, done with definitions.
                 *
                 **************************************************************/

                // apply those user-defined params that apply to the whole div:
                thisDiv$.addClass(params["badge-size"])
                thisDiv$.addClass(params["badge-type"])

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
                            getWindowCallback(thisDiv$, dict) // we generate the callback here
                        },
                        function(data){
                            thisDiv$.append("<span class='loading'>Gathering metrics now...</span>")
                        },
                        false
                    )
                    return true
                }
            }) // done with code that runs for each widget

            // report vital signs
            // DISABLE FOR NOW, error on pensoft site
            reportVitals(allParams)

        });
    }
})()
