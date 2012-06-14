$.ajaxSetup ({
    cache: false
});
var ajax_load = "<img src='/static/img/ajax-loader.gif' alt='loading...' />";


getLatestTs = function(metricSnaps) {
    var latestTs = "1999-01-01T00:00:00.000000"
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
    item.metricsArr = []
    for (metricName in item.metrics){
        thisMetric = item.metrics[metricName]
        thisMetric.name = metricName
        var latestTs = getLatestTs(item.metrics[metricName].values)
        if (latestTs) {
            var latestVal = item.metrics[metricName].values[latestTs]
            thisMetric.ts = latestTs
            thisMetric.value = latestVal
        }

        // if no values, no point in printing
        if (thisMetric.value) {
            item.metricsArr.push(thisMetric)
        }
    }

    item.metricsArr.sort(sortByMetricValueDesc)
    
    var url = (item.aliases.url) ?  item.aliases.url[0] : false
    ich.addTemplate("item", '<div class=\"item\" id=\"{{ id }}\">\r\n  <div class=\"biblio\"><\/div>\r\n  <ul class=\"metrics\">{{#metricsArr}}\r\n    <li>\r\n      <a href=\"{{provenance_url}}\">\r\n        <span class=\"last-update\">{{ ts }}<\/span>\r\n        <span class=\"metric-value\">{{ value }}<\/span>\r\n        <span class=\"metric-name-img\">\r\n          <img src=\"{{ static_meta.icon }}\" width=\"16\" height=\"16\" border=\"0\">\r\n          <span class=\"metric-name\">{{ static_meta.provider }} {{ static_meta.display_name }}<\/span>\r\n        <\/span>\r\n      <\/a>\r\n    <\/li>\r\n    {{\/metricsArr}}\r\n  <\/ul>\r\n<\/div>')
    var html$ = ich.item(item)
    
    return html$
}

function getNewItemsAndUpdateReport() {
    tiidsStr = tiids.join(",")

    $.ajax({
        url: 'http://total-impact-core.herokuapp.com/items/'+tiidsStr,                        
        type: "GET",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data){
            $("#total-impact div#ti-data").empty()
            for (i in data){
                // make the set of all newly-rendered items
                // this is a very slow way to do this...should bundle together,
                // then make one replace.
                $("#total-impact div#ti-data").append(renderItem(data[i]))
            }
        }
    });
}
 
function pollApiAndUpdateCollection(interval, oldText, tries){
    getNewItemsAndUpdateReport();
    // has anything changed?
    currentText = $("#total-impact div#ti-data").html()
    if (currentText == oldText) {
        console.log("current and old text match; on try "+tries)
        tries++;
        if (tries > 10) {
            console.log("done with updating")
            return false
        }
    }
    else {
        tries = 0
    }

    setTimeout(function(){
        pollApiAndUpdateCollection(interval, currentText, tries);
    }, interval)
}

getAliases = function(input) {
    // get the user-supplied aliases
   var aliases = [];
   var thisAlias = [];
   thisAlias[0] = input.split(':')[0]
   thisAlias[1] = input.split(':')[1]
   aliases.push(thisAlias)
    return(aliases)
}

var tiids = []

$(document).ready(function(){
    // updating the collection from the report page
    $("span#ti-id").hide()
    $("#total-impact div#ti-data").html(ajax_load+" Loading...")
    aliases = getAliases($("span#ti-id").html());

    console.log("adding new items.")
    $.ajax({
        url: 'http://total-impact-core.herokuapp.com/items',                
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(aliases),
        success: function(returnedTiids){
            // make a new collection, populated by our freshly-minted tiids
            console.log("items created. ")
            tiids = returnedTiids
        }
    });


    /* creating and updating reports
     * *************************************************************************/
    if (typeof tiids != "undefined"){
        pollApiAndUpdateCollection(500, "", 0);
    }

});