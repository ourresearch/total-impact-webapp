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
  if (metric1.value < metric2.value)
     return 1;
  if (metric1.value > metric2.value)
    return -1;
  return 0;
}

function renderItem(item){
    item.metricsArr = [];
    for (metricName in item.metrics){
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

    item.metricsArr.sort(sortByMetricValueDesc);
    
    if (typeof ich.itemtemplate == "undefined"){
        ich.addTemplate("itemtemplate", '<div class=\"item\" id=\"{{ id }}\">\r\n  <div class=\"biblio\"><\/div>\r\n  <ul class=\"metrics\">{{#metricsArr}}\r\n    <li>\r\n      <a href=\"{{provenance_url}}\">\r\n        <span class=\"last-update\">{{ ts }}<\/span>\r\n        <span class=\"metric-value\">{{ value }}<\/span>\r\n        <span class=\"metric-name-img\">\r\n          <img src=\"{{ static_meta.icon }}\" width=\"16\" height=\"16\" border=\"0\">\r\n          <span class=\"metric-name\">{{ static_meta.provider }} {{ static_meta.display_name }}<\/span>\r\n        <\/span>\r\n      <\/a>\r\n    <\/li>\r\n    {{\/metricsArr}}\r\n  <\/ul>\r\n<\/div>')
    }

    return ich.itemtemplate(item);
}

function addDataToPage(data) {
    $("#total-impact div#ti-data").empty();
    $("#total-impact div#ti-data").append(renderItem(data));
}

 
function getNewItemAndUpdateReport(tiid, interval) {

    $.ajax({
        url: 'http://api.total-impact.org/item/'+tiid,
        type: "GET",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        statusCode: {
            210: function(data){
                console.log("still updating")
                addDataToPage(data)                
                setTimeout(function(){
                    getNewItemsAndUpdateReport(interval)
                })
            },
            200: function(data) {
                console.log("done with updating")
                addDataToPage(data)
                return false;
            }
        }
    });
}


function getAlias(id_string) {
   // split the user-supplied alias string into namespace and id parts
    var alias = []
    if (id_string.indexOf(":") > 0) {
        alias[0] = id_string.split(':')[0]; // namespace
        alias[1] = id_string.substr(alias[0].length + 1); // id

        // handle urls:
        if (alias[0] == "http"){
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


$.ajaxSetup ({
    cache: false
});
var tiids = []
var ajax_load = '<img src="http://total-impact.org/static/img/ajax-loader.gif" alt="loading..." />';

$(document).ready(function(){
    //requestStylesheet("http://total-impact-webapp.herokuapp.com/static/embed.css")
    //requestScript("http://total-impact-webapp.herokuapp.com/static/js/icanhaz.min.js")

    $("span#ti-id").hide()
    $("#total-impact div#ti-data").html(ajax_load+" Loading...")
    var alias = getAlias($("span#ti-id").html());

    console.log("creating new item")
    $.ajax({
        url: "http://api.total-impact.org/item/"+alias[0]+"/"+alias[1],
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(alias),
        success: function(returnedTiid){
            // make a new collection, populated by our freshly-minted tiids
            console.log("item created. ")
            getNewItemAndUpdateReport(returnedTiid, 500)
        }
    });
});