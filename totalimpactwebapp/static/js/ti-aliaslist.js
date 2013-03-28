
var AliasList = function(){}
AliasList.prototype = {
    aliasesArr : [],
    numAddedLast: 0,
    add: function(aliases) {
        var oldLen = this.aliasesArr.length
        this.aliasesArr = _.union(aliases, this.aliasesArr)
        this.numAddedLast = this.aliasesArr.length - oldLen
        this.onChange()
        return this.numAddedLast
    },
    count: function() {
        return this.aliasesArr.length
    },
    forApi: function() {
        return this.aliasesArr
    },
    clear: function() {
        this.aliasesArr = []
        this.onChange()
        return true
    },
    onChange: function() {
        $("p#artcounter span").html(this.count())
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
                    importer.pull()
            })
        })

        // import from bibtex
        $("input#input_bibtex").change(function(){
            var importer = new BibtexImporter(that.aliases, this)
            importer.pull()
        })

        // set up the submit button
        $("#go-button").click(function(){
            var action = "create"

            // fetch ids from the textareas first
            $("textarea.ids").not(".default").each(function(){
                var importer = new TextareaImporter(that.aliases, this)
                importer.pull()
            })
            if ($(this).hasClass(("update"))) action = "update"

            var button = new SubmitButton(that.aliases, this)
            return button.submit(coll, user, action)
        })


        // clear the aliases when input modals are dismissed
        $("#import-products-modal").on("hide", function(){
            that.resetList.call(that)
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
    },
    resetList: function() {
        console.log("REEEEEEEEEEE SEEEETTTT!")
        this.aliases.clear()
        $(".import-products .control-group").each(function(){
            changeControlGroupState(this, "ready")
        })
        $(".import-products input").val("")
        $(".import-products textarea").val("")
        this.textareaPlaceholders()
    }
}

var SubmitButton = function(aliases, elem){
    this.aliases = aliases
    this.elem$ = $(elem)
}
SubmitButton.prototype = {
    submit: function(coll, user, action){
        var action = action || "create"

        if (!this.aliases.forApi().length) {
            alert("You have to add some products before you create a collection.")
            return false
        }

        this.start()

        var that = this;
        var email = $("#make-collection div.email input").val()
        var pw = $("#make-collection div.password input").val()
        var title = $('#name').val() || "My Collection"

        if (email && pw){
            user.setCreds(email, pw)
            _gaq.push(['_trackPageview', '/user/created']);
        }

        if (action == "create") {
            // we're not going to use the old coll. it's boring and we're making a new one.
            this.createCollection( this.aliases.forApi(), title, user )
        }
        else if (action == "update") {
            // we need to use the old coll, otherwise who do we update?
            this.addItemsToCollection(coll, this.aliases.forApi())
        }
        return false

    },
    start:function(){
        changeControlGroupState(this.elem$, "working")
        console.log(this.elem$)
    },
    update: function(){
    },
    failure: function() {
    },
    createCollection: function(aliases, title, user){
        var coll = new Coll(new CollViews(), user)
        coll.create(aliases, title)
    },
    addItemsToCollection: function(coll, aliases) {
        var callbacks = {
            onSuccess: function(){location.reload()}
        }
        coll.addItems(aliases, callbacks)

    }
}




// Import aliases from external services that want a username
var UsernameImporter = function(aliases, elem) {
    this.aliases = aliases
    this.elem$ = $(elem)
}
UsernameImporter.prototype = {

    pull: function() {
        var that = this
        this.start()
        var providerName = this.elem$.attr("id").replace("input_", "")
        var queryStr = this.elem$.val()

        $.ajax({
            url: api_root+"/provider/"+providerName+"/memberitems/"+queryStr+"?method=sync",
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
    },
    failure: function(request) {
        changeControlGroupState(this.elem$, "failure")
    }
}





// Import aliases from external services that want a username
var TextareaImporter = function(aliases, elem) {
    this.aliases = aliases
    this.elem$ = $(elem)
}
TextareaImporter.prototype = {
    pull: function(){
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
    this.bibtexEntriesParsedFromFile = []
}
BibtexImporter.prototype = {

    pull: function() {
        var that = this
        this.start()
        var providerName = this.elem$.attr("id").replace("input_", "")

        var formData = new FormData();
        formData.append('file', this.elem$[0].files[0]);

        $.ajax({
                   url: api_root+'/provider/bibtex/memberitems',
                   type: "POST",
                   processData: false,
                   contentType: false,
                   timeout: 5*1000,  // 5 seconds
                   data: formData,
                   dataType: "json",
                   success:  function(data){
                       entries = {
                           biblio: data,
                           total: data.length,
                           aliases: []
                       }
                       console.log("got some items back:", data)
                       that.update.call(that, entries)
                   },
                   error: function(request) {that.failure.call(that, request)}
               });

    },
    start:function() {
        changeControlGroupState(this.elem$, "working")
    },
    update: function(entries, errors){
        errors = errors || 0
        var that = this

        // end conditions
        if (!entries.biblio.length) return this.done(entries)
        if (errors > 3) return this.failure()

        for (k in entries.biblio){
            entries.aliases[k] = ["biblio", entries.biblio[k]]
        }

        that.updateProgressbar.call(
                            that,
                            entries.total,
                            entries.biblio.length
                        )
        this.done(entries)        
    },
    done: function(entries){
        console.log("we're done!")
        changeControlGroupState(this.elem$, "success")
        this.aliases.add(entries.aliases)
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(this.aliases.numAddedLast)
    },
    failure: function() {
        changeControlGroupState(this.elem$, "failure")
    },
    updateProgressbar: function(total, remaining) {
        var done = total - remaining
        percentDone = Math.round(done / total * 100)
        this.elem$
            .parents(".control-group")
            .find("span.working span.value")
            .html(percentDone)
    }
}
