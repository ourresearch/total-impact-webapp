(function () {
//    var webappRoot = "http://impactstory.org"
    var webappRoot = "http://localhost:5000" // for testing

    var jQuery;

    /******** Load jQuery if not present *********/
    // this embed pattern is from http://alexmarandon.com/articles/web_widget_jquery/
    if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.4.2') {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src",
                                "https://ajax.googleapis.com/ajax/libs/jquery/1.7.0/jquery.min.js");
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


    /******** Our main function ********/

    function main() {

        if (!window.console) {
           console = {log: function() {}}; 
        }

        // Based on http://drnicwilliams.com/2006/11/21/diy-widgets/
        function requestStylesheet(stylesheet_url) {
            var stylesheet = document.createElement("link");
            stylesheet.rel = "stylesheet";
            stylesheet.type = "text/css";
            stylesheet.href = stylesheet_url;
            stylesheet.media = "all";
            document.lastChild.firstChild.appendChild(stylesheet);
        }


        // Based on http://drnicwilliams.com/2006/11/21/diy-widgets/
        function requestScript(script_url) {
            var script = document.createElement('script');
            script.src = script_url;
            // IE7 doesn't like this: document.body.appendChild(script);
            // Instead use:
            document.getElementsByTagName('head')[0].appendChild(script);
        }

        jQuery.ajaxSetup({ cache:false });
        var ajax_load = '<img id="ti-loading" src=""' + webappRoot + '/static/img/ajax-loader.gif" alt="loading..." />';

        function getItemId() {
            var doi = jQuery("div#impactstory-embed").attr("data-doi")
            console.log(doi)
            return ["doi", doi]
        }



        requestStylesheet(webappRoot + "/static/css/embed.css");
        requestScript(webappRoot + "/static/js/icanhaz.min.js");
        requestScript(webappRoot + "/static/js/ti-item.js");

        jQuery(document).ready(function ($) {

            var $ = jQuery
            var itemId = getItemId()
            var item = new Item(itemId, new ItemView($), $)


        });
    }
})()
