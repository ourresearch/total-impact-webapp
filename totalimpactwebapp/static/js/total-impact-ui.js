$.ajaxSetup ({
    cache: false
});
if (!window.console) {
    console = {log: function() {}}; 
}

var ajaxLoadImg = "<img class='loading' src='../static/img/ajax-loader.gif' alt='loading...' />";
var ajaxLoadImgTransparent = "<img class='loading' src='../static/img/ajax-loader-transparent.gif' alt='loading...' />";
var collectionIds = []
var currentUserInputValue = ""
var currentlyUpdating = false



/*****************************************************************************
 * create collection page
 ****************************************************************************/

exampleStrings = {
    paste_input:"doi:10.123/somejournal/123\nhttp://www.example.com",
    crossref_input: "Watson : A Structure for Deoxyribose Nucleic Acid",
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
            },
          error: function(XMLHttpRequest, textStatus, errorThrown) { 
            $("li #input_bibtex").siblings("span.added").remove()
            $("li #input_bibtex").siblings("span.loading").remove()
            $("li #input_bibtex").after("<span class='added'><span class='sorry'>sorry, there was an error.</span></span>")
            }    
        });
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
            // limit to adding first 100 lines
            newIds = newIds.slice(0,100)
            addCollectionIds(newIds, $(this))
        }
        else if ($this.attr("id") == "name") {
            // do nothing, it's just an entry field. hack, ick.
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
            $(this).not("input#name").after("<span class='loading'>"+ajaxLoadImg+"<span>");
            $.ajax({
              url: "http://"+api_root+"/provider/"+providerName+"/memberitems"+providerIdQuery+providerTypeQuery,
              type: "GET",
              dataType: "json",
              success: function(response,status,xhr){
                addCollectionIds(response, $this)
                },
              error: function(XMLHttpRequest, textStatus, errorThrown) { 
                $("span.loading").remove()
                $this.siblings("span.added").remove()
                $this.after("<span class='added'><span class='sorry'>sorry, there was an error.</span></span>")
                }    
            });                        
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
                            location.href = "/collection/" +returnedCollection._id;
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

function showHideExtraMetrics(item$) {
    var numMetrics = item$.find("ul.metrics li").length
    console.log("numMetrics=" + numMetrics)
    var extraMetrics = (11 - numMetrics) * -1
    console.log(extraMetrics)
    if (extraMetrics > 0) {
        $("<a class='showhide'>+"+extraMetrics+" more...</a>")
            .click(function() {
                   $(this).hide().prev().find("li").show()
               })
            .insertAfter(item$.find("ul.metrics"))
        item$.find("li:gt(10)").hide()

    }
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

// developing countries as per IMF 2012, plus Cuba and North Korea (not IMF members)
// see http://www.imf.org/external/pubs/ft/weo/2012/01/pdf/text.pdf
developing_countries = "Afghanistan|Albania|Algeria|Angola|Antigua and Barbuda|Argentina|Armenia|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Cuba|Democratic Republic of the Congo|Republic of the Congo|Costa Rica|Côte d Ivoire|Croatia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Ethiopia|Fiji|Gabon|The Gambia|Georgia|Ghana|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|India|Indonesia|Iran|Iraq|Jamaica|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Lithuania|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Marshall Islands|Mauritania|Mauritius|Mexico|Federated States of Micronesia|Moldova|Mongolia|Montenegro|Morocco|Mozambique|Namibia|Nauru|Nepal|Nicaragua|Niger|Nigeria|North Korea|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Solomon Islands|Somalia|South Africa|South Sudan|Sri Lanka|Sudan|Suriname|Swaziland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe"

function get_mendeley_percent(metricsArr, dict_key, key_substring) {
    mendeleyRelevantDict = metricsArr.filter(function(x) {return x["name"]==dict_key})
    if (typeof mendeleyRelevantDict[0] == "undefined") {
        return(0)
    }

    var re = new RegExp(key_substring, 'i');
    mendeleyRelevantKeys = mendeleyRelevantDict[0].value.filter(function(x) {return x["name"].match(re)})
    if (typeof mendeleyRelevantKeys[0] == "undefined") {
        return(0)
    }

    mendeleyPercentages = mendeleyRelevantKeys.map(function(x) {return x["value"]})
    if (typeof mendeleyPercentages[0] == "undefined") {
        return(0)
    }

    sum = eval(mendeleyPercentages.join("+"))
    return(sum)
}

function mendeley_reader_subset_count(metricsArr, subset_type){
    mendeleyReaders = metricsArr.filter(function(x) {return x["name"]=="mendeley:readers"})
    if (typeof mendeleyReaders[0] == "undefined") {
        return(0)
    }
    total_mendeley_readers = mendeleyReaders[0].value

    if (subset_type == "student") {
        percent = get_mendeley_percent(metricsArr, "mendeley:career_stage", "student")
    }
    if (subset_type == "developing_countries") {
        percent = get_mendeley_percent(metricsArr, "mendeley:country", developing_countries)
    }

    total = Math.round(total_mendeley_readers * percent / 100)
    console.log(total_mendeley_readers + " mendeley readers * " + percent + "% " + subset_type + " = " + total)

    return(total)
}

function get_copy_of_mendeley_item(metricsArr) {
    // do a deep copy    
    mendeleyReaders = metricsArr.filter(function(x) {return x["name"]=="mendeley:readers"})
    copyMendeleyReaders = $.extend(true, [], mendeleyReaders[0]);
    return(copyMendeleyReaders)
}

function update_metric(item, metric_name, display_name, value) {
    item["name"] = metric_name
    item["static_meta"]["display_name"] = display_name
    item["value"] = value
    return(item)
}

function add_derived_metrics(metricsArr) {
    // mendeley student readers
    total = mendeley_reader_subset_count(metricsArr, "student")
    if (total > 0) {
        mendeleyItem = get_copy_of_mendeley_item(metricsArr)
        mendeleyItem = update_metric(mendeleyItem, 
                                    "mendeley:student_readers",
                                    "readers: students",
                                    total)
        metricsArr.push(mendeleyItem)
    }
    //if (total >= 5) {
    //    mendeleyItem = get_copy_of_mendeley_item(metricsArr)
    //    mendeleyItem["name"] = "mendeley:student_readers_star"
    //    mendeleyItem["static_meta"]["display_name"] = "student readers"
    //    mendeleyItem["value"] = 0.1
    //    mendeleyItem["static_meta"]["icon"] = "http://total-impact.org/static/img/favicon.png"
    //    metricsArr.push(mendeleyItem)
    //}

    // mendeley developing countries
    total = mendeley_reader_subset_count(metricsArr, "developing_countries")
    if (total > 0) {
        mendeleyItem = get_copy_of_mendeley_item(metricsArr)
        mendeleyItem = update_metric(mendeleyItem, 
                                    "mendeley:developing_countries",
                                    "readers: developing countries",
                                    total)        
        metricsArr.push(mendeleyItem)
    }
    //if (total >= 5) {
    //    mendeleyItem = get_copy_of_mendeley_item(metricsArr)
    //    mendeleyItem["name"] = "mendeley:developing_countries_star"
    //    mendeleyItem["static_meta"]["display_name"] = "developing countries reader"
    //    mendeleyItem["value"] = 0.1
    //    mendeleyItem["static_meta"]["icon"] = "http://total-impact.org/static/img/favicon.png"
    //    metricsArr.push(mendeleyItem)
    //}

    return(metricsArr)
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

    // add on the derived metrics
    if (typeof item.metricsArr[0] != "undefined") {
        item.metricsArr = add_derived_metrics(item.metricsArr)
    }

    // remove the dictionaries from what will be displayed
    item.metricsArr = item.metricsArr.filter(function(x) {   
            good_to_print = (typeof x["value"] == "number")
            if (typeof x["value"] == "string") {
                good_to_print = true
            }
            return good_to_print
        })

    // sort by descending order of metrics
    item.metricsArr.sort(sortByMetricValueDesc)

    var url = (item.aliases.url) ?  item.aliases.url[0] : false
    var html$ = ich.item(item)
    showHideExtraMetrics(html$)
    var biblioHtml = renderItemBiblio(item.biblio, url)
    html$.find("div.biblio").append(biblioHtml)
    
    return html$
}

function addDataToGenres(data) {
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

function getNewItemsAndUpdateReport(interval) {
    tiidsStr = tiids.join(",")

    $.ajax({
        url: "http://"+api_root+'/items/'+tiidsStr,                        
        type: "GET",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        statusCode: {
            210: function(data){
                console.log("still updating")
                addDataToGenres(data)                
                setTimeout(function(){
                    getNewItemsAndUpdateReport(interval)
                })
            },
            200: function(data) {
                console.log("done with updating")
                addDataToGenres(data)
                $("#page-header img").remove()

                $("#num-items").remove();
                $("<span id='num-items'>"+tiids.length+" items</span>")
                    .hide()
                    .insertAfter("#report-button")
                    .show();
                return false;
            }
        }
    });
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
                getNewItemsAndUpdateReport(500);
            }});
        return false;
    })


    if (typeof tiids != "undefined" && $("body.report")[0]){
        $("h2").before(ajaxLoadImgTransparent)
        getNewItemsAndUpdateReport(500)
    }

});
