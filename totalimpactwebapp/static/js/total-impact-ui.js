$.ajaxSetup ({
    cache: false
});
var ajaxLoadImg = "<img src='../static/img/ajax-loader.gif' alt='loading...' />";
var newCollectionIds = []

/*****************************************************************************
 * create collection page
 ****************************************************************************/

flatten = function(idsArr) {
    // flattens id values that are themselves arrays (like github)
    var aliases = [];
    numIds = idsArr.length;
    for (var i=0; i<numIds; i++ ) {
        var id = idsArr[i][1]
        var namespace = idsArr[i][0]
        if( Object.prototype.toString.call( id ) === '[object Array]' ) {
            var strVal = id.join(",")
        }
        else {
            var strVal = id
        }
        aliases.push([namespace, id])
    }
    return(aliases)
}

addCollectionIds = function(idsArr) {
    newIds = flatten(idsArr);
    
    // make an object with the unique key values
    var uniqueNamespaceIdPairs = {}
    for  (var i=0; i<newCollectionIds.length; i++){
        var namespaceIdPair = newCollectionIds[i].join(":")
        uniqueNamespaceIdPairs[namespaceIdPair] = 1
    }
    console.log(uniqueNamespaceIdPairs)
    
    for (var i=0; i < newIds.length; i++){
        var newNamespaceIdPair = newIds[i].join(":")
        if (!uniqueNamespaceIdPairs[newNamespaceIdPair]) {
            newCollectionIds.push(newIds[i])
        }
    }
}

// puts the textarea-entered ids in a format that addNewCollectionIds likes
parseTextareaArtifacts = function(str) {
    var ids = str.split("\n");
    var ret = [];
    for (i=0; i<ids.length; i++){
        var artifact = [];
        var thisId = ids[i];
        if (thisId.indexOf(":") > 0) {
            artifact[0] = thisId.split(':')[0]; // namespace
            artifact[1] = thisId.substr(artifact[0].length + 1) // id
            
            // handle urls:
            if (artifact[0] == "http"){
                artifact[0] = "url";
                artifact[1] = thisId
            }
        }
        else {
            if (thisId.length > 0) {
                artifact[0] = "unknown"
                artifact[1] = thisId
            }
        }
        if (typeof artifact[1] != "undefined") {
            ret.push(artifact);
        }
    }
    return ret;
}

createCollectionInit = function(){
    // use the textarea to paste ids. lots of duplicated code with below function...
    $("#paste_input").blur(function(){
        if (!$(this).val().trim()) {
            console.log("fail")
            return false;
        }
        newIds = parseTextareaArtifacts($(this).val());
        addCollectionIds(newIds)
        
        // how many items are in the new collection now?
        $("#artcounter span.count").html(newCollectionIds.length);
        $(this).after("<span class='added'><span class='count'>"+newIds.length+"</span> items added.</span>")
        return true;
        
    })

    // use importers to add objects pulled from member_items calls
    $("#pullers input").add("#bibtex_input").blur(function(){
        var idStrParts = $(this).attr("id").split('_');
        var providerName = idStrParts[0];
        $this = $(this)
        console.log($this.val())
        if (!$this.val().trim()) {
            return false;
        }

        if (providerName == "bibtex") { // hack, should generalize for all textareas
            var providerTypeQuery = "&type=import"
            var providerIdQuery = "?query=" + escape($this.val());
        } else {
            var providerTypeQuery = "&type=" + $this.attr("name");
            var providerIdQuery = "?query=" + escape($this.val());
        }
        $(this).after("<span class='loading'>"+ajaxLoadImg+"<span>");
        $.get("http://total-impact-core.herokuapp.com/provider/"+providerName+"/memberitems"+providerIdQuery+providerTypeQuery, function(response,status,xhr){
            console.log(response)
            addCollectionIds(response)
            $("span.loading").remove()
            // how many items are in the new collection now?
            $("#artcounter span.count").html(newCollectionIds.length);
            $this.after("<span class='added'><span class='count'>"+response.length+"</span> items added.</span>")
        
        }, "json");
    });    


    // creating a collection by submitting the object IDs from the homepage
    $("#id-form").submit(function(){

        // make sure the user input something at all
        if (newCollectionIds.length == 0) {
            alert("Looks like you haven't added any research objects to the collection yet.")
            return false;

        // created items and put them in a collection, then redirect to
        // the collection report page:
        } else {
            // first we upload the new items and get tiids back.
            console.log("adding new items.")
            $("#go-button").replaceWith("<span class='loading'>"+ajaxLoadImg+"<span>")
            $.ajax({
                url: 'http://total-impact-core.herokuapp.com/items',                
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(newCollectionIds),
                success: function(returnedTiids){
                    // make a new collection, populated by our freshly-minted tiids
                    console.log("items created. making collection.")
                    var requestObj = {
                        title: $('#name').val(),
                        items: returnedTiids
                    }

                    $.ajax({
                        url: 'http://total-impact-core.herokuapp.com/collection',                        
                        type: "POST",
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        data:  JSON.stringify(requestObj),
                        success: function(returnedCollection){

                            // we've created the items and the collection; our
                            // work here is done.
                            console.log(returnedCollection)
                            location.href="./" +returnedCollection.id;
                        }
                    });
                }
            });
            return false;
        }
    });
}









/*****************************************************************************
 * report page
 ****************************************************************************/

function renderItemBiblio(biblio, url) {
    var html = ""
    
    biblio.url = url
    biblio.title = biblio.title || "no title"
    if (biblio.create_date) {
        biblio.year = biblio.create_date.slice(0,4)
    }
    
    var templateName = "biblio_" + biblio.genre
    return ich[templateName](biblio, true)
}

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
    var html$ = ich.item(item)
    var biblioHtml = renderItemBiblio(item.biblio, url)
    html$.find("div.biblio").append(biblioHtml)
    
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
            $("ul#items").empty()
            for (i in data){
                // make the set of all newly-rendered items
                // this is a very slow way to do this...should bundle together,
                // then make one replace.
                var genre = data[i].biblio.genre
                var genreItems = "div." + genre + " ul#items"
                $(genreItems).append(renderItem(data[i]))
                $("div." + genre).show()  // would ideally only do this once
            }
        }
    });
}
 
function pollApiAndUpdateCollection(interval, oldText, tries){
    getNewItemsAndUpdateReport();
    // has anything changed?
    currentText = $("#metrics").text()
    if (currentText == oldText) {
        console.log("current and old text match; on try "+tries)
        tries++;
        if (tries > 10) {
            console.log("done with updating")
            $("h2 img").hide()
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



$(document).ready(function(){
    
    // report page stuff
    $('ul.metrics li').tooltip();

    // dialog for supported IDs
    $("div#paste-ids legend a").click(function(){
        // get the contents
        TINY.box.show({url:'../static/whichartifacts.html'})
        return false;
    });
    
    // table of contents
    if ($("#toc")[0]) {
        $('#toc').tocBuilder({type: 'headings', startLevel: 3, endLevel: 3, backLinkText: 'back to contents'});
    
    }
    
    createCollectionInit();
    

    // updating the collection from the report page
    $("#update-report-button").click(function(){
        $("h2 img").show()
        $.ajax({
            url: 'http://total-impact-core.herokuapp.com/items',
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(tiids),
            success: function(data){
                //window.location.reload(false);
                console.log("updating.")
                pollApiAndUpdateCollection(500, "", 0);
            }});
        return false;
    })


    if (typeof tiids != "undefined"){
        pollApiAndUpdateCollection(500, "", 0);
    }

});
