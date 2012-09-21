(function () {

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
        
        function getLatestTimestamp(metricSnaps) {
            var latestTs = "1999-01-01T00:00:00.000000";
            for (ts in metricSnaps) {
                if (ts > latestTs) {
                    latestTs = ts
                }
            }
            return latestTs
        }


        function sortByMetricValueDesc(metric1, metric2){
            if (typeof metric1.value != "number")
                return 1
            if (typeof metric2.value != "number")
                return -1
            if (metric1.value < metric2.value)
                return 1;
            if (metric1.value > metric2.value)
               return -1;
            return 0;
        }

        function renderItem(item) {
            item.metricsArr = [];
            for (metricName in item.metrics) {
                thisMetric = item.metrics[metricName];
                thisMetric.name = metricName;
                var latestTs = getLatestTimestamp(item.metrics[metricName].values);
                if (latestTs) {
                    var latestVal = item.metrics[metricName].values[latestTs];
                    thisMetric.ts = latestTs;
                    thisMetric.value = latestVal
                }

                // if no values, no point in printing
                if (thisMetric.value) {
                    item.metricsArr.push(thisMetric);
                }
            }

            // remove the dictionaries from what will be displayed
            item.metricsArr = item.metricsArr.filter(function(x) {   
                    good_to_print = (typeof x["value"] == "number")
                    if (typeof x["value"] == "string") {
                        good_to_print = true
                    }
                    return good_to_print
                })

            item.metricsArr.sort(sortByMetricValueDesc);

            if (typeof ich.itemtemplate == "undefined") {
                ich.addTemplate("itemtemplate", '<div class=\"item\" id=\"{{ id }}\">\r\n  <div class=\"biblio\"><\/div>\r\n  <ul class=\"metrics\">{{#metricsArr}}\r\n    <li>\r\n      <a href=\"{{provenance_url}}\">\r\n        <span class=\"last-update\">{{ ts }}<\/span>\r\n        <span class=\"metric-value\">{{ value }}<\/span>\r\n        <span class=\"metric-name-img\">\r\n          <img src=\"{{ static_meta.icon }}\" width=\"16\" height=\"16\" border=\"0\">\r\n          <span class=\"metric-name\">{{ static_meta.provider }} {{ static_meta.display_name }}<\/span>\r\n        <\/span>\r\n      <\/a>\r\n    <\/li>\r\n    {{\/metricsArr}}\r\n  <\/ul>\r\n<\/div>')
            }

            return ich.itemtemplate(item);
        }

        function addDataToPage(data) {
            jQuery("div#ti-data")
                .empty()
                .append(renderItem(data));
        }


        function getNewItemAndUpdateReport(tiid, interval) {
            jQuery.ajax({
                       url:'http://api.impactstory.it/item/' + tiid,
                       type:"GET",
                       dataType:"json",
                       contentType:"application/json; charset=utf-8",
                       statusCode:{
                           210:function (data) {
                               console.log("still updating");
                               addDataToPage(data);
                               setTimeout(function () {
                                   getNewItemAndUpdateReport(tiid, interval)
                               }, interval)
                           },
                           200:function (data) {
                               console.log("done with updating");
                               addDataToPage(data);
                               return false;
                           }
                       }
                   });
        }


        function getAlias(id_string) {
            // split the user-supplied alias string into namespace and id parts
            var alias = [];
            if (id_string.indexOf(":") > 0) {
                alias[0] = id_string.split(':')[0]; // namespace
                alias[1] = id_string.substr(alias[0].length + 1); // id

                // handle urls:
                if (alias[0] == "http") {
                    alias[0] = "url";
                    alias[1] = id_string
                }
            }
            return alias
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
        var ajax_load = '<img id="ti-loading" src="http://impactstory.it/static/img/ajax-loader.gif" alt="loading..." />';

        jQuery(document).ready(function ($) {
            requestStylesheet("http://total-impact.org/static/css/embed.css");
//            requestStylesheet("http://localhost:5000/static/css/embed.css");
            requestScript("http://total-impact.org/static/js/icanhaz.min.js");

            $("span#ti-id").hide();
            $("div#ti-data").html(ajax_load + " Loading...");
            var alias = getAlias($("span#ti-id").html());

            $.ajax({
                url:"http://api.impactstory.it/item/" + alias[0] + "/" + alias[1],
                type:"POST",
                dataType:"json",
                contentType:"application/json; charset=utf-8",
                data:JSON.stringify(alias),
                success:function (returnedTiid) {
                   // make a new collection, populated by our freshly-minted tiids
                   console.log("item created. ");
                   getNewItemAndUpdateReport(returnedTiid, 1000);
                }
           });
        });
    }
})()
