$.ajaxSetup ({
    cache: false
});
var ajaxLoadImg = "<img class='loading' src='../static/img/ajax-loader.gif' alt='loading...' />";
var ajaxLoadImgTransparent = "<img class='loading' src='../static/img/ajax-loader-transparent.gif' alt='loading...' />";
var collectionIds = []
var currentUserInputValue = ""



/*****************************************************************************
 * create collection page
 ****************************************************************************/

exampleStrings = {
    paste_input:"doi:10.123/somejournal/123\nhttp://www.example.com",
    crossref_input: "Watson:  A Structure for Deoxyribose Nucleic Acid\nGeertz: Deep play: Notes on the Balinese cockfight",
    name: "My Collection"
}

inputExamplesIClickHandler = function(thisInput) {
    
}

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
        aliases.push([namespace, strVal])
    }
    return(aliases)
}

addCollectionIds = function(idsArr, $this) {
    var startingCollectionLength = collectionIds.length
    var newIds = flatten(idsArr);
    
    // make an object with the unique key values
    var uniqueNamespaceIdPairs = {}
    for  (var i=0; i<collectionIds.length; i++){
        var namespaceIdPair = collectionIds[i].join(":")
        uniqueNamespaceIdPairs[namespaceIdPair] = 1
    }
    console.log(uniqueNamespaceIdPairs)
    
    for (var i=0; i < newIds.length; i++){
        var newNamespaceIdPair = newIds[i].join(":")
        if (!uniqueNamespaceIdPairs[newNamespaceIdPair]) {
            collectionIds.push(newIds[i])
        }
    }
    $("span.loading").remove()
    
    // how many items are in the new collection now?
    var endingCollectionLength = collectionIds.length;
    numIdsAdded = endingCollectionLength - startingCollectionLength;
    $("#artcounter span.count").html(endingCollectionLength);
    if (numIdsAdded) {
        $this.siblings("span.added").remove()
        $this.after("<span class='added'><span class='count'>"+numIdsAdded+"</span> items added.</span>")
        $this.siblings("span.added")
            .find("span.count")
                .css({color: "#ff4e00"})
                .animate({color: "#555555"}, 1000)
        
    }
    return true;

}

// puts the textarea-entered ids in a format that addcollectionIds likes
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
                // handle dois entered without the doi prefix
                if (thisId.substring(0,3) == "10.") {
                    artifact[0] = "doi"
                } else {
                   artifact[0] = "unknown"
                }
                artifact[1] = thisId
            }
        }
        if (typeof artifact[1] != "undefined") {
            ret.push(artifact);
        }
    }
    return ret;
}
userInputHandler = function($this, prevValue) {
    $this.blur(function(){


    });    
    
}

upload_bibtex = function(files) {
    var fileInput = $("li #input_bibtex")[0];
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);
    $("li #input_bibtex").siblings("span.added").remove()
    $("li #input_bibtex").after("<span class='loading'>"+ajaxLoadImg+"<span>");

    $.ajax({
            url: "http://"+api_root+'/provider/bibtex/memberitems',
            type: "POST",
            processData: false,
            contentType: false,
            data: formData,
            success:  function(response,status,xhr){
                addCollectionIds(response, $("li #input_bibtex"))
        }});
    }

createCollectionInit = function(){
    
    $("li textarea, input#name").each(function(){
        $(this).val(exampleStrings[this.id])
    })
    $("li input, li textarea, input#name")
    .focus(function(){
        currentUserInputValue = $(this).val();
        $(this).removeClass("no-input-yet")
        
        // hid the example strings if they're still up.
        if (currentUserInputValue == exampleStrings[this.id]) {
            $(this).val("")
        }
    })
    .blur(function(){
        $this = $(this)
        if ($this.val() == "") {
            $this.addClass("no-input-yet")
            $this.val(exampleStrings[this.id]) 
            return false;
        }
        else if ($this.val() == currentUserInputValue) {
            return false;
        }
        
        if ($this.attr("id") == "paste_input") {
            newIds = parseTextareaArtifacts($(this).val());
            addCollectionIds(newIds, $(this))
        }
        else {
            var idStrParts = $(this).attr("id").split('_');
            var providerName = idStrParts[0];

            if (providerName == "crossref") { // hack, should generalize for all textareas
                var providerTypeQuery = "&type=import"
                var pipeVal = $this.val().replace(":", "|");
                var providerIdQuery = "?query=" + escape(pipeVal);
            } else {
                var providerTypeQuery = "&type=" + $this.attr("name");
                var providerIdQuery = "?query=" + escape($this.val());
            }
            $(this).siblings("span.added").remove()
            $(this).find("li input, li textarea")
                .after("<span class='loading'>"+ajaxLoadImg+"<span>");
            $.get("http://"+api_root+"/provider/"+providerName+"/memberitems"+providerIdQuery+providerTypeQuery, function(response,status,xhr){
                addCollectionIds(response, $this)
            }, "json");
            
        }        
    })


    // creating a collection by submitting the object IDs from the homepage
    $("#id-form").submit(function(){

        // make sure the user input something at all
        if (collectionIds.length == 0) {
            alert("Looks like you haven't added any research objects to the collection yet.")
            return false;

        // created items and put them in a collection, then redirect to
        // the collection report page:
        } else {
            // first we upload the new items and get tiids back.
            console.log("adding new items.")
            $("#go-button").replaceWith("<span class='loading'>"+ajaxLoadImg+"<span>")
            $.ajax({
                url: "http://"+api_root+'/items',                
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(collectionIds),
                success: function(returnedTiids){
                    // make a new collection, populated by our freshly-minted tiids
                    console.log("items created. making collection.")
                    var requestObj = {
                        title: $('#name').val(),
                        items: returnedTiids
                    }

                    $.ajax({
                        url: "http://"+api_root+'/collection',                        
                        type: "POST",
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        data:  JSON.stringify(requestObj),
                        success: function(returnedCollection){

                            // we've created the items and the collection; our
                            // work here is done.
                            console.log(returnedCollection)
                            location.href = "/collection/" +returnedCollection.id;
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
        url: "http://"+api_root+'/items/'+tiidsStr,                        
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
            $("#page-header img").remove()
            
            
            // let's do this thing
            
            $("#num-items").remove();
            $("<span id='num-items'>"+tiids.length+" items</span>")
                .hide()
                .insertAfter("#report-button")
                .show();
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
        $('#toc').tocBuilder({type: 'headings', startLevel: 3, endLevel: 3, insertBackLinks: 0});
    
    }
    
    createCollectionInit();
    

    // updating the collection from the report page
    $("#update-report-button").click(function(){
        $("h2").before(ajaxLoadImgTransparent)
        $.ajax({
            url: "http://"+api_root+'/items',
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
        $("h2").before(ajaxLoadImgTransparent)
        pollApiAndUpdateCollection(500, "", 0);
    }

});
