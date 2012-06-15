$.ajaxSetup ({
    cache: false
});
var ajaxLoadImg = "<img src='../static/img/ajax-loader.gif' alt='loading...' />";
var newCollectionIds = []

parseImporterArgs = function(argStr){
    var args = argStr.split('-');
    var urlArgs = "id=" + args[0];
    if (args.length > 1) {
        urlArgs = urlArgs + "&type=" + args[1];
    }
    return urlArgs
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
            artifact.namespace = "unknown";
            artifact.id = thisId;
        }
        ret.push(artifact);
    }
    return ret;
}



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
    
    var url = (item.aliases.url) ?  item.aliases.url[0] : false
    var html$ = ich.item(item)
    var biblioHtml = renderItemBiblio(item.biblio, url)
    html$.find("div.biblio").append(biblioHtml)
    
    return html$
}

function updateReportWithNewItem(item) {
    itemHtml$ = renderItem(item)
    $("ul#items").replaceWith(itemHtml$)
}

function getNewItemsAndUpdateReport() {
    tiidsStr = tiids.join(",")

    $.ajax({
        url: '/call_api/items/'+tiidsStr,
        type: "GET",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data){
            $("ul#items").empty()
            for (i in data){
                // make the set of all newly-rendered items
                // this is a very slow way to do this...should bundle together,
                // then make one replace.
                $("ul#items").append(renderItem(data[i]))
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
            $("#metrics h2.updating").slideUp(500)
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

function showCommits() {
    $.get('./commits', function(data){
        var foo = {commits: data}
        var commitsList = ich.commits_template(foo)
        $("div.recent-changes").append(commitsList)
        console.log(data)
        console.log(commitsList)
    })
}




$(document).ready(function(){
    
    // report page stuff
    $('ul.metrics li').tooltip();
    $('a#copy-permalink').zclip({
        path:'ui/js/ZeroClipboard.swf',
        copy:$('#permalink a.copyable').text(),
        afterCopy:function(){
            $('a#copy-permalink').text('copied.');
        }
    });
    $('#about-metrics').hide();

    // show/hide stuff
    $('#importers ul li')
        .prepend('<span class="pointer">?</span>') // hack; these arrows should be entities, but that causes probs when replacing...
        .children("div")
        .hide();

    $('#importers ul li').children("a").click(function(){
        var arrow = $(this).siblings("span").text();
        arrow = (arrow == "?") ? "?" : "?";
        $(this).siblings("span").text(arrow);
        $(this).siblings("div").slideToggle();
    });


    // use the textarea to paste ids. lots of duplicated code with below function...
    $("#paste_input").blur(function(){
        if (!$(this).val().trim()) {
            console.log("fail")
            return false;
        }
        newIds = parseTextareaArtifacts($(this).val());
        $.merge(newCollectionIds, newIds)
        
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
        $.get("../call_api/provider/"+providerName+"/memberitems"+providerIdQuery+providerTypeQuery, function(response,status,xhr){
            console.log(response)
            addNewCollectionIds(response);
            $this.siblings().find("span.loading").remove()
            // how many items are in the new collection now?
            $("#artcounter span.count").html(newCollectionIds.length);
            $(this).after("<span class='added'><span class='count'>"+newIds.length+"</span> items added.</span>")
        
        }, "json");
    });



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



/* creating and updating reports
 * *****************************************************************************/
    showWaitBox = function(verb){
        verb = (typeof verb == "undefined") ? "Updating" : verb
        var $waitMsg = $("<div class='loading'></div")
            .append("<h2><img src='./static/img/ajax-loader-rev.gif' />"+verb+" your report now.</h2>")
            .append("<p>(Hang in there; it usually takes a few minutes...)</p>")

        TINY.box.show({
            html:$("<div>").append($waitMsg).html(),
            animate: false,
            close: false,
            removeable: false
        });
    }

    getAliases = function() {
        var aliases = [];

        // get the user-supplied aliases
        $("ul#collection-list span.object-id").each(function(){
           var thisAlias = [];
           thisAlias[0] = $(this).find("span.namespace").text().split(':')[0]
           thisAlias[1] = $(this).find("span.id").text()
           aliases.push(thisAlias);
        });
        return(aliases)
    }

    // creating a collection by submitting the object IDs from the homepage
    $("#id-form").submit(function(){
        var aliases = getAliases();

        // make sure the user input something at all
        if (aliases.length == 0) {
            alert("Looks like you haven't added any research objects to the collection yet.")
            return false;

        // created items and put them in a collection, then redirect to
        // the collection report page:
        } else {
            // first we upload the new items and get tiids back.
            console.log("adding new items.")
            $.ajax({
                url: '/call_api/items',
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(aliases),
                success: function(returnedTiids){
                    // make a new collection, populated by our freshly-minted tiids
                    console.log("items created. making collection.")
                    var requestObj = {
                        title: $('#name').val(),
                        items: returnedTiids
                    }

                    $.ajax({
                        url: '/call_api/collection',
                        type: "POST",
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        data:  JSON.stringify(requestObj),
                        success: function(returnedCollection){

                            // we've created the items and the collection; our
                            // work here is done.
                            console.log(returnedCollection)
                            location.href="./collection/" +returnedCollection.id;
                        }
                    });
                }
            });
            return false;
        }
    });

    // updating the collection from the report page
    $("#update-report-button").click(function(){
        $("#metrics h2.updating").slideDown(500)
        $.ajax({
            url: '/call_api/items',
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

    /* creating and updating reports
     * *************************************************************************/
    if (typeof tiids != "undefined"){
        pollApiAndUpdateCollection(500, "", 0);
    }

});