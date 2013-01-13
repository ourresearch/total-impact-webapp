
var AliasList = function(){}
AliasList.prototype = {
    aliases : [],
    numAddedLast: 0,
    add: function(aliases) {
        var oldLen = this.aliases.length
        this.aliases = _.union(aliases, this.aliases)
        this.numAddedLast = this.aliases.length - oldLen
        return this.numAddedLast
    },
    count: function() {
        return this.aliases.length
    },
    forApi: function() {
        return this.aliases
    }
}





var AliasListInputs = function() {}
AliasListInputs.prototype = {
    aliases: new AliasList(),
    init: function() {
        var that = this

        this.textareaPlaceholders()
        this.initHelpModals()

        // import orcid, github, and slideshare from usernames
        $(".control-group.username input")
            .each(function(){
                $(this).blur(function(){
                    if (!$(this).val()) return false
                    var importer = new UsernameImporter(that.aliases, this)
                    importer.import()
            })
        })

        // import from bibtex
        $("input#input_bibtex").change(function(){
            var importer = new BibtexImporter(that.aliases, this)
            importer.import()
        })

        // set up the submit button
        $("#go-button").click(function(){

            // fetch ids from the textareas first
            $("textarea.ids").not(".default").each(function(){
                var importer = new TextareaImporter(that.aliases, this)
                importer.import()
            })

            var button = new SubmitButton(that.aliases, this)
            return button.submit(user)
        })

    },
    textareaPlaceholders: function() {
        // placeholder replacement
        $("textarea").each(function(){
            var this$ = $(this)
            var placeholderText = this$.attr("data-placeholder")
            this$.val(placeholderText).addClass("default")
            this$.blur(function(){
                if (!this$.val()) {
                    this$.val(placeholderText).addClass("default")
                    return false
                }
            })
            this$.focus(function(){
                if (this$.val() == placeholderText){
                    this$.val("").removeClass("default")
                }
            })
        })
    },
    initHelpModals: function(){

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
    }
}

var SubmitButton = function(aliases, elem){
    this.aliases = aliases
    this.elem$ = $(elem)
    this.inputClasses = ["ready", "working", "success", "failure"]
}
SubmitButton.prototype = {
    submit: function(user){
        this.start()
        var that = this;
        var email = $("#make-collection div.email input").val()
        var pw = $("#make-collection div.password input").val()
        var title = $('#name').val() || "My Collection"

        if (email && pw){
            user.setCreds(email, pw)
            _gaq.push(['_trackPageview', '/user/created']);
        }

        this.createCollection( this.aliases.forApi(), title, user )
        return false

    },
    start:function(){
    },
    update: function(){
    },
    done: function(data, user) {
        console.log("finished making the collection!")
        var redirect = function(){location.href = "/collection/" + cid}
        var cid=data.collection._id

        // add the id of the newly-created coll to the user's coll list
        user.addColl(cid, data.key)
        console.log("we're syncing this to the server")
        user.syncWithServer("push", {on200: redirect, onNoUserId: redirect})

    },
    failure: function() {

    },
    createCollection: function(aliases, title, user){
        var that = this
        var requestObj = {
            aliases: aliases,
            title:title
        }
        console.log("making the collection now.")
        $.ajax({
                   url: "http://"+api_root+'/collection',
                   type: "POST",
                   dataType: "json",
                   contentType: "application/json; charset=utf-8",
                   data:  JSON.stringify(requestObj),
                   success: function(data){
                       that.done.call(that, data, user)
                   }
               })
    }
}




// Import aliases from external services that want a username
var UsernameImporter = function(aliases, elem) {
    this.aliases = aliases
    this.elem$ = $(elem)
    this.inputClasses = ["ready", "working", "success", "failure"]
}
UsernameImporter.prototype = {

    import: function() {
        var that = this
        this.start()
        var providerName = this.elem$.attr("id").replace("input_", "")
        var queryStr = this.elem$.val()

        $.ajax({
            url: "http://"+api_root+"/provider/"+providerName+"/memberitems/"+queryStr+"?method=sync",
            type: "GET",
            dataType: "json",
            success: function(data){that.done.call(that, data)},
            error: function(request){that.failure.call(that, request)}
        });

    },
    start:function() {
        changeControlGroupState(this.elem$, "working")
    },
    update: function(){},
    done: function(data){
        changeControlGroupState(this.elem$, "success")
        this.aliases.add(data.memberitems)
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(this.aliases.numAddedLast)
        $("p#artcounter span").html(this.aliases.count())
    },
    failure: function(request) {
        changeControlGroupState(this.elem$, "failure")
    }
}





// Import aliases from external services that want a username
var TextareaImporter = function(aliases, elem) {
    this.aliases = aliases
    this.elem$ = $(elem)
    this.inputClasses = ["ready", "working", "success", "failure"]
}
TextareaImporter.prototype = {
    import: function(){
        var newAliases = this.parseTextareaArtifacts(this.elem$.val())
        this.aliases.add(newAliases)
    },
    parseTextareaArtifacts: function(str) {
        var ids = str.split("\n");
        var ret = [];
        for (i=0; i<ids.length; i++){
            var artifact = [];
            var thisId = ids[i];
            if (thisId.indexOf(":") > 0) {
                artifact[0] = thisId.split(':')[0]; // namespace
                artifact[1] = thisId.substr(artifact[0].length + 1) // id

                // handle urls:
                if (artifact[0] == "http" || artifact[0] == "https"){
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
    },
    start:function(){},
    update:function(){},
    done:function(){},
    failure:function(){}

}








// upload bibtex from google scholar
var BibtexImporter = function(aliases, elem) {
    this.aliases = aliases
    this.elem$ = $(elem)
    this.inputClasses = ["ready", "working", "success", "failure"]
}
BibtexImporter.prototype = {

    import: function() {
        var that = this
        this.start()
        var providerName = this.elem$.attr("id").replace("input_", "")

        var formData = new FormData();
        formData.append('file', this.elem$[0].files[0]);

        $.ajax({
                   url: "http://"+api_root+'/provider/bibtex/memberitems',
                   type: "POST",
                   processData: false,
                   contentType: false,
                   timeout: 120*1000,  // 120 seconds, because bibtex is very slow
                   data: formData,
                   dataType: "json",
                   success:  function(data){
                       that.bibtexItems = data.items
                       that.update.call(that, data)
                   },
                   error: function(request) {that.failure.call(that, request)}
               });

    },
    start:function() {
        changeControlGroupState(this.elem$, "working")
    },
    update: function(data){
        var query_hash = data.query_hash
        var that = this
        console.log("updating using query hash", query_hash)
        $.ajax({
                   url: "http://"+api_root+"/provider/bibtex/memberitems/"+query_hash+"?method=async",
                   type: "GET",
                   dataType: "json",
                   success: function(response,status,xhr){
                       console.log(response)
                       if (response.pages == response.complete) {
                           that.aliases.add("done!", response.memberitems)
//                           aliases = []
//                           for (i=0; i<response.memberitems.length; i++) {
//                               var aliases = aliases.concat(response.memberitems[i])
//                           }
//                           bibtexUploadDone(response.number_entries, aliases)
                       }
                       else {
                           that.updateProgressbar.call(that, response.pages, response.complete)
                           console.log()
//                           setTimeout(function () {
//                               update_bibtex_progress(query_hash)
//                           }, 500)
                       }
                   },
                   error: function(XMLHttpRequest, textStatus, errorThrown) {
                       console.log("error!", XMLHttpRequest)
                       that.failure.call(that, XMLHttpRequest)
                   }
               });
    },
    done: function(data){
        changeControlGroupState(this.elem$, "success")
        this.aliases.add(data.memberitems)
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(this.aliases.numAddedLast)
        $("p#artcounter span").html(this.aliases.count())
    },
    failure: function(request) {
        changeControlGroupState(this.elem$, "failure")
    },
    updateProgressbar: function(total, done) {
        percentDone = Math.round(done / total * 100)
        this.elem$
            .parents(".control-group")
            .find("span.working span.value")
            .html(percentDone)
    }
}
