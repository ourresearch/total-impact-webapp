$.ajaxSetup ({
    cache: false
});
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
userInputHandler = function($this, prevValue) {
    $this.blur(function(){


    });

}

progressbar = function(total, done, loc$) {
    percentDone = Math.round(done / total * 100)
    loc$.html(percentDone + "% done...")
}

update_bibtex_progress = function(key) {
    $.ajax({
               url: "http://"+api_root+"/provider/bibtex/memberitems/"+key+"?method=async",
               type: "GET",
               dataType: "json",
               success: function(response,status,xhr){
                   console.log("searched using key " + key)
                   console.log(response)
                   if (response.pages == response.complete) {
                       aliases = []
                       for (i=0; i<response.memberitems.length; i++) {
                           aliases = aliases.concat(response.memberitems[i])
                       }
                       addCollectionIds(aliases, $("li #input_bibtex"))
                   }
                   else {
                       progressbar(response.pages, response.complete, $("#bibtex_toggler_contents div.progressbar"))
                       setTimeout(function () {
                           update_bibtex_progress(key)
                       }, 500)
                   }
               },
               error: function(XMLHttpRequest, textStatus, errorThrown) {
                   $("span.loading").remove()
                   $("li #input_bibtex").siblings("span.added").remove()
                   $("li #input_bibtex").after("<span class='added'><span class='sorry'>sorry, there was an error.</span></span>")
               }
           });  }

upload_bibtex = function(files) {
    var fileInput = $("li #input_bibtex")[0];
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);
    $("li #input_bibtex").siblings("span.added").remove()
    $("li #input_bibtex").after("<span class='loading'>"+ajaxLoadImg+"<span>");

    console.log("starting ajax request now.")

    progressbar(1, 0, $("#bibtex_toggler_contents div.progressbar"))
    $.ajax({
            url: "http://"+api_root+'/provider/bibtex/memberitems',
            type: "POST",
            processData: false,
            contentType: false,
            timeout: 120*1000,  // 120 seconds, because bibtex is very slow
            data: formData,
            success:  function(response,status,xhr){
                console.log("started update request; got this key back: " + response)
                update_bibtex_progress(response)
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
    $("ul#pullers input, ul#manual-add textarea, input#name")
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
            // limit to adding first 500 lines
            newIds = newIds.slice(0, 500)
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

function showNameChangeBanner(){
    if ($.cookie("hasDismissedNamechange")){
        return false
    }
    else {
        $("<div id='namechange'>We've got a new focus and a new name: total-impact is now <strong>ImpactStory!</strong><a class='dismiss'>dismiss &times;</a></div>")
            .prependTo("body")
            .find("a.dismiss")
            .click(function(){
                           $(this).parent().slideUp()
                           $.cookie("hasDismissedNamechange", true)
                       })
    }

}



$(document).ready(function(){
    $.cookie.defaults = {path: "/", raw: 1}

    showNameChangeBanner()

    userViews = new UserViews()
    user = new User(userViews)
    userController = new UserController(user, userViews);
    userController.init()

    collViews = new CollViews()
    coll = new Coll(collViews)
    collController = new CollController(coll, collViews);

    itemController = new ItemController()


    // table of contents
    if ($("#toc")[0]) {
        $('#toc').tocBuilder({type: 'headings', startLevel: 3, endLevel: 3, insertBackLinks: 0});

    }

    createCollectionInit();




});
