$.ajaxSetup ({
    cache: false
});
$.support.cors = true; // makes IE8 and IE9 support CORS
if (!window.console) {
    console = {log: function() {}};
}
var tiLinkColor = "#FF4E00"
var ajaxLoadImg = "<img class='loading' src='../static/img/ajax-loader.gif' alt='loading...' />";
var ajaxLoadImgTransparent = "<img class='loading' src='../static/img/ajax-loader-transparent.gif' alt='loading...' />";
var collectionAliases = []
var currentUserInputValue = ""
var currentlyUpdating = false






/*****************************************************************************
 * create collection page
 ****************************************************************************/

exampleStrings = {
    paste_input:"10.1038/171737a0\n13054692",
    paste_webpages: "http://www.example.com\nhttp://www.zombo.com",
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

addCollectionIds = function(idsArr, updateInfoLoc$, itemsAddedMsg$, showZeros) {
    if (itemsAddedMsg$ === undefined) {
        var itemsAddedMsg$ = $("<span class='items-added-msg'>items added</span>")
    }


    var startingCollectionLength = collectionAliases.length
    var newIds = flatten(idsArr);

    // make an object with the unique key values
    var uniqueNamespaceIdPairs = {}
    for  (var i=0; i<collectionAliases.length; i++){
        var namespaceIdPair = collectionAliases[i].join(":")
        uniqueNamespaceIdPairs[namespaceIdPair] = 1
    }
    console.log(uniqueNamespaceIdPairs)

    for (var i=0; i < newIds.length; i++){
        var newNamespaceIdPair = newIds[i].join(":")
        if (!uniqueNamespaceIdPairs[newNamespaceIdPair]) {
            collectionAliases.push(newIds[i])
        }
    }
    $("div.progressbar").empty()
    $("span.loading").remove()

    // how many items are in the new collection now?
    var endingCollectionLength = collectionAliases.length;
    numIdsAdded = endingCollectionLength - startingCollectionLength;
    $("#artcounter span.count").html(endingCollectionLength);
    if (numIdsAdded || showZeros) {
        updateInfoLoc$.siblings("span.added").remove()
        $("<span class='added'><span class='count'>"+numIdsAdded+"</span></span>")
            .append(itemsAddedMsg$)
            .insertAfter(updateInfoLoc$)

        updateInfoLoc$.siblings("span.added")
            .find("span.count")
                .css({color: "#ff4e00"})
                .animate({color: "#555555"}, 1500)

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
        if (thisId.indexOf(":") != -1) {
            artifact[0] = thisId.split(':')[0]; // namespace
            artifact[1] = thisId.substr(artifact[0].length + 1) // id

            // handle urls:
            if ((artifact[0] == "http") || (artifact[0] == "https")) {
                if (thisId.indexOf("http://dx.doi.org/") != -1) {
                    artifact[0] = "doi";
                    artifact[1] = thisId.replace("http://dx.doi.org/", "");                    
                } else {
                    artifact[0] = "url";
                    artifact[1] = thisId;
                }
            }
        }
        else {
            if (thisId.length > 0) {
                var isnum_with_possible_period = /^[\d\.]+$/.test(thisId)
                // handle dois entered without the doi prefix
                if (thisId.substring(0,3) == "10.") {
                    artifact[0] = "doi"
                } else if (isnum_with_possible_period && (thisId.length > 5) && (thisId.length <= 8)) {
                    // definition of pmid from http://www.nlm.nih.gov/bsd/mms/medlineelements.html#pmid
                    // this doesn't catch short PMIDs, but that's ok
                    artifact[0] = "pmid"
                }
                else {
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

progressbar = function(total, done, loc$) {
    percentDone = Math.round(done / total * 100)
    loc$.html(percentDone + "% done...")
}
bibtexUploadDone = function(numItemsTotal, aliases) {
    var numFailedItems = numItemsTotal - aliases.length
    var msg$ = $(ich.bibtexUploadDoneMsg({numFailedItems: numFailedItems}))
    msg$.find("a.help-text")
        .clickover()
    addCollectionIds(aliases, $("div.fileupload"), msg$, true)
}

update_bibtex_progress = function(query_hash) {
    $.ajax({
               url: "http://"+api_root+"/provider/bibtex/memberitems/"+query_hash+"?method=async",
               type: "GET",
               dataType: "json",
               success: function(response,status,xhr){
                   console.log("searched using query_hash " + query_hash)
                   console.log(response)
                   if (response.pages == response.complete) {
                       aliases = []
                       for (i=0; i<response.memberitems.length; i++) {
                           var aliases = aliases.concat(response.memberitems[i])
                       }
                       bibtexUploadDone(response.number_entries, aliases)
                   }
                   else {
                       progressbar(response.pages, response.complete, $("#bibtex_toggler_contents div.progressbar"))
                       setTimeout(function () {
                           update_bibtex_progress(query_hash)
                       }, 500)
                   }
               },
               error: function(XMLHttpRequest, textStatus, errorThrown) {
                   $("span.loading").remove()
                   $("div.fileupload span.added").remove()
                   $("div.fileupload").append("<span class='added'><span class='sorry'>sorry, there was an error.</span></span>")
               }
           });  }

upload_bibtex = function(files) {
    var fileInput = $("li #input_bibtex")[0];
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);
    $("span.btn-file").remove()
    $("<span class='loading'>"+ajaxLoadImg+"<span>").insertBefore("div.fileupload div.progressbar");

    console.log("starting ajax request now.")

    progressbar(1, 0, $("#bibtex_toggler_contents div.progressbar"))
    $.ajax({
            url: "http://"+api_root+'/provider/bibtex/memberitems',
            type: "POST",
            processData: false,
            contentType: false,
            timeout: 120*1000,  // 120 seconds, because bibtex is very slow
            data: formData,
            dataType: "json",
            success:  function(response,status,xhr){
                query_hash = response.query_hash
                console.log("started update request; got this query_hash back: " + query_hash)
                update_bibtex_progress(query_hash)
            },
          error: function(XMLHttpRequest, textStatus, errorThrown) {
              $("span.loading").remove()
              $("div.fileupload span.added").remove()
              $("div.fileupload").append("<span class='added'><span class='sorry'>sorry, there was an error.</span></span>")
          }
        });
    }

createCollectionInit = function(){


    $("#google-scholar-help-link").click(function(){
        $("#google-scholar-help").modal("show")
        return false
    })
    $("#orcid-help-link").click(function(){
        $("#orcid-help").modal("show")
        return false
    })
    $("#bibtex-fail-help a").click(function(){
        $(".modal").modal("hide")
        if ($(this).hasClass("uservoice")) {
            UserVoice.showPopupWidget()
        }
    })

    $("li textarea, input#name").each(function(){
        $(this).val(exampleStrings[this.id])
    })
    $("div.toggler_contents input, ul#manual-add textarea, input#name")
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

        if ($this.hasClass("artifactList")) {
            newIds = parseTextareaArtifacts($(this).val());
            // limit to adding first 250 lines
            newIds = newIds.slice(0, 100)
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
                var providerIdQuery = escape(pipeVal);
            } else {
                var providerIdQuery = escape($this.val());
            }
            $(this).siblings("span.added").remove()
            $(this).not("input#name").after("<span class='loading'>"+ajaxLoadImg+"<span>");
            console.log("running memberitems")
            $.ajax({
              url: "http://"+api_root+"/provider/"+providerName+"/memberitems/"+providerIdQuery+"?method=sync",
              type: "GET",
              dataType: "json",
              success: function(response,status,xhr){
                addCollectionIds(response.memberitems, $this)
                },
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                $("span.loading").remove()
                $this.siblings("span.added").remove()
                var explainString;
                if (XMLHttpRequest.status == 404) {
                    explainString = "sorry, not found."
                } else {
                    explainString = "sorry, there was an error."
                }
                $this.after("<span class='added'><span class='sorry'>" + explainString + "</span></span>")
                }
            });
        }
    })


    // creating a collection by submitting the object IDs from the homepage
    $("#id-form").submit(function(){

        // make sure the user input something at all
        if (collectionAliases.length == 0) {
            alert("Looks like you haven't added any research objects to the collection yet.")
            return false;

        // create a collection with these aliases
        } else {
            console.log("adding collection with new items.")

            $("#go-button").replaceWith("<span class='loading'>"+ajaxLoadImg+"<span>")

            var requestObj = {
                title: $('#name').val(),
                aliases: collectionAliases
            }

            $.ajax({
                url: "http://"+api_root+'/collection',
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data:  JSON.stringify(requestObj),
                success: function(ret){
                    returnedCollection=ret.collection

                    // add the id of the newly-created coll to the user's coll list
                    user.addColl(returnedCollection._id, ret.key)

                    var email = $("#inline-register-email").val()
                    var pw = $("#inline-register-pw").val()
                    if (email && pw){
                        user.setCreds(email, pw)
                    }

                    var success = function(){
                        _gaq.push(['_trackPageview', '/user/created']);
                        location.href = "/collection/" +returnedCollection._id
                    }

                    if (user.hasCreds()){
                        user.syncWithServer("push", {on200: success})
                    }
                    else {
                        success()
                    }
                }
            });
            return false;
        }
    });
}

function homePageInit() {
    $('.carousel').carousel()
    $('.carousel').carousel("cycle")
}

function aboutPageInit() {
    if (location.href.indexOf("#contact") > 0) {
        $("#contact h3").css("color", tiLinkColor)
            .siblings("p").css({backgroundColor: "#ff834c"})
            .animate({backgroundColor: "#ffffff"}, 1000)
    }
}






$(document).ready(function(){
    $.cookie.defaults = {path: "/", raw: 1}

    userViews = new UserViews()
    user = new User(userViews)
    userController = new UserController(user, userViews);
    userController.init()

    collViews = new CollViews()
    coll = new Coll(collViews)
    collController = new CollController(coll, collViews);

    itemController = new ItemController($)

    // report pages
    if (typeof reportIdNamespace == "undefined"){
        // nothing
    }
    else if (reportIdNamespace == "impactstory_collection_id") {
        collController.collReportPageInit()
    }
    else { // must be an item report page
        itemController.itemReportPageInit()
    }



    // table of contents
    if ($("#toc")[0]) {
        $('#toc').tocBuilder({type: 'headings', startLevel: 3, endLevel: 3, insertBackLinks: 0});

    }

    createCollectionInit();
    homePageInit()
    aboutPageInit()

    // let people link straight to the item-help modal
    if(window.location.href.indexOf('#context') != -1) {
        $('#context').modal('show');
    }


    prettyPrint()



});
