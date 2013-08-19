
var AliasList = function(){}
AliasList.prototype = {
    aliasesByImporter: {},
    numAddedLast: 0,
    add: function(aliases, importerName, callbacks) {
        var oldLen = this.count()
        this.aliasesByImporter[importerName] = aliases
        this.numAddedLast = this.count() - oldLen
        this.onChange()
        if (this.count()){
            callbacks("ready")
        }
        else {
            callbacks("inactive")
        }
        return this.numAddedLast
    },
    count: function() {
        return this.forApi().length
    },
    forApi: function() {
        return _.flatten(this.aliasesByImporter, true)
    },
    clear: function() {
        this.aliasesByImporter = {}
        this.onChange()
        return true
    },
    onChange: function() {
        // this should be passed in as callback...
        $("p#artcounter span").html(this.count()) // getting rid of this soon
        $("button#go-button span.value").text(this.count())
    }
}
var aliasList = new AliasList()
var registrationFormIsValid = false


var ExternalProfileIds = {
    github: null,
    slideshare: null,
    orcid: null
}


var AliasListInputs = function(user) {
    this.user = user
    this.init()
}
AliasListInputs.prototype = {
    email: "",
    ExternalProfileIds:  ExternalProfileIds, // someday this'll probably be an obj
    init: function() {
        var that = this

        this.textareaPlaceholders()
        this.initHelpModals()

        if (!$("form.register").length){
            registrationFormIsValid = true
        }

        // import orcid, github, and slideshare from usernames
        $(".control-group.username input").each(function(){
            $(this).blur(function(){
                if (!$(this).val()) return false
                var importer = new UsernameImporter(
                    that.aliases,
                    that.ExternalProfileIds,
                    that.importerCallbacks,
                    this
                )
                importer.pull()
            })
        })

        $("textarea.ids").each(function(){
            $(this).keyup(function(){
                if (!$(this).val()) return false

                var importer = new TextareaImporter(
                    that.aliases,
                    that.importerCallbacks,
                    this
                )
                importer.pull()
            })
        })

        // import from bibtex
        $("input#input_bibtex").change(function(){
            var importer = new BibtexImporter(
                that.aliases,
                that.importerCallbacks,
                this
            )
            importer.pull()
        })

        // set up the submit button
        $("#go-button").click(function(){
            var action = "update"

            var button = new SubmitButton(that.aliases, that.ExternalProfileIds, this)

            if ($(this).hasClass(("update"))) {
                console.log("update!")
                return button.update(coll)
            }
            else if ($(this).hasClass(("create"))) {
                console.log("create!")
                return button.make()
            }

        })

        // clear the aliases when input modals are dismissed
        $("#import-products-modal").on("hide", function(){
            that.resetList.call(that)
        })

        // you can't submit the form until the required stuff all has a value.
        $("form.register").keyup( function(){
            that.validateRegistrationForm.call(that, this)
        })

        $("form.register input.email").blur(function(){
            that.validateEmail.call(that, this)
        })


    },
    importerCallbacks: function(state) {
        // these are callbacks that affect the whole input form.

        if (state == "ready") {
            if (!registrationFormIsValid || !aliasList.count()){
                console.log("changing state to inactive")
                state = "inactive"
            }
        }


        ret =function() {
            console.log("firing the importer callback, changing state to ", state)
            changeElemState($("div.control-group.submit"), state)
        }
        return ret()

    },
    validateEmail: function(input) {

        console.log("here's what's in the email box: ", $(input).val())

//        if (this.email == $(input).val()) return true // no change
        if (!$(input).val()) {
            changeControlGroupState($(input), "ready")
            return true
        }

        var that = this
        that.email = $(input).val()
        changeControlGroupState($(input), "working")
        this.importerCallbacks("inactive")



        this.user.checkUsername(
            that.email,
            function(){
                changeControlGroupState($(input), "success")
                that.emailIsValid = true
                that.validateRegistrationForm()
            },
            function(){
                changeControlGroupState($(input), "error")
                that.emailIsValid = false
                that.validateRegistrationForm()
            }
        )
    },
    validateRegistrationForm: function() {
        var valid = true

        // email
        email$ = $("input.register.email")
        console.log("email is valid: ", this.emailIsValid)

        if (this.email != email$.val()) {
            valid = false
            changeControlGroupState(email$, "ready")
        }
        if (!this.emailIsValid) {
            valid = false
        }

        // password
        var pw$ = $("input.password")
        if (pw$.val().length > 3) {
            changeControlGroupState(pw$,  "success" )
        }
        else {
            valid = false
            changeControlGroupState(pw$, "ready" )
        }

        // names
        given$ = $("input.name.given")
        surname$ = $("input.name.surname")
        if (given$.val() && surname$.val()){
            changeControlGroupState(given$, "success")
        }
        else {
            valid = false
            changeControlGroupState(given$, "ready")
        }


        if (valid) { // there's still a missing val
            registrationFormIsValid = true
            this.importerCallbacks("ready")
        }
        else {
            registrationFormIsValid = false
            this.importerCallbacks("inactive")

        }
    },
    textareaPlaceholders: function() {
        // placeholder replacement
        var that = this
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
    onTextareaKeyup: function(thisTextarea$){
        var that = this
        if (thisTextarea$.val()){
            that.onHavingSomeAliases()
        }
        else {
            that.onHavingNoAliases()
        }
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
        aliasList.clear()
        $(".import-products .control-group").each(function(){
            changeControlGroupState(this, "ready")
        })
        $(".import-products input").val("")
        $(".import-products textarea").val("")
        this.textareaPlaceholders()
    }
}

var SubmitButton = function(aliases, ExternalProfileIds,  elem){
    this.ExternalProfileIds = ExternalProfileIds
    this.elem$ = $(elem)
}
SubmitButton.prototype = {

    make: function() {
        if (!this.start()) return false
        ISCookies.lastActionUserDidToCollection("create")

        var givenName = $("div.inline-register input.given").val() || "Anonymous"
        var surname = $("div.inline-register input.surname").val() || "User"

        var requestObj = {
            alias_tiids: aliasList.forApi(),
            external_profile_ids: this.ExternalProfileIds,
            email: $("div.inline-register input.email").val(),
            password: $("div.inline-register input.password").val(),
            given_name: givenName,
            surname: surname
        }

        analytics.track('Created a profile')
        $("#user-dict-json").val(
            JSON.stringify(requestObj)
        )

        return true
    },
    update: function(coll){
        if (!this.start()) return false
        this.addItemsToCollection(coll, aliasList.forApi())
        return false
    },
    start:function(){
        if (!aliasList.forApi().length) {
            alert("You haven't added any products.")
            return false
        }
        else if ($("div.inline-register .email").hasClass("error")) {
            alert("please enter an email that's not already in use.")
            return false
        }
        else {
            changeControlGroupState(this.elem$, "working")
            console.log(this.elem$)
            return true
        }
    },
    failure: function() {
    },
    addItemsToCollection: function(coll, aliases) {
        var callbacks = {
            onSuccess: function(){location.reload()}
        }
        coll.addItems(aliases, callbacks)

    }
}




// Import aliases from external services that want a username
var UsernameImporter = function(aliases, ExternalProfileIds, callbacks, elem) {
    this.ExternalProfileIds = ExternalProfileIds
    this.callbacks = callbacks
    this.elem$ = $(elem)
}
UsernameImporter.prototype = {

    pull: function() {
        var that = this
        this.start()
        var providerName = this.elem$.attr("id").replace("input_", "")
        var queryStr = this.elem$.val()
        if (providerName == "orcid") {
            // remove the leading url characters if they were included
            queryStr = queryStr.replace("http://orcid.org/", "")
        }

        $.ajax({
            url: api_root+"/provider/"+providerName+"/memberitems/"+queryStr+"?method=sync",
            type: "GET",
            dataType: "json",
            success: function(data){that.done.call(that, data, providerName, queryStr)},
            error: function(request){that.failure.call(that, request)}
        });

    },
    start:function() {
        changeControlGroupState(this.elem$, "working")
        this.callbacks("working")
    },
    update: function(){},
    done: function(data, providerName, queryStr){
        changeControlGroupState(this.elem$, "success")
        console.log("finished adding for ", providerName)

        analytics.track("Imported products", {
            "import source": providerName,
            "number products imported": data.memberitems.length
        })

        this.ExternalProfileIds[providerName] = queryStr

        aliasList.add(
            data.memberitems,
            providerName,
            this.callbacks
        )
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(aliasList.numAddedLast)
    },
    failure: function(request) {
        changeControlGroupState(this.elem$, "error")
    }
}





// Import aliases from external services that want a username
var TextareaImporter = function(aliases, callbacks, elem) {
    this.callbacks = callbacks
    this.elem$ = $(elem)
}
TextareaImporter.prototype = {
    pull: function(){
        var newAliases = this.parseTextareaArtifacts(this.elem$.val())
        var textareaName = this.elem$.attr("id")

        aliasList.add(
            newAliases,
            textareaName,
            this.callbacks
        )
    }
    ,parseTextareaArtifacts: function(str) {
        var ids = str.trim().split("\n");
        var ret = [];
        for (i=0; i<ids.length; i++){
            var thisId = ids[i];
            if (!thisId) continue

            // stacked in order of preference for selection
            var namespaceIdPairs = [
                ["doi", this.getDoi(thisId)],
                ["pmid", this.getPMID(thisId)],
                ["url", this.getUrl(thisId)],
                ["unknown", thisId]
            ]

            // pick the first pair that has a truthy id
            var bestNamespaceIdPair = _.find(namespaceIdPairs, function(pair){
                return !!pair[1]
            })

            ret.push(bestNamespaceIdPair);
        }
        console.log("returning this aliaslist: ", ret)
        return ret;
    }
    ,getDoi:function(aliasStr){
        /* works for these patterns:

            "http://dx.doi.org/10.<str>",
            "https://dx.doi.org/10.<str>",
            "http://doi.org/10.<str>",
            "https://doi.org/10.<str>",
            "doi:10.<str>"
        */

        var regex = new RegExp("^https*://(dx\.)*doi.org/(10\..+)")
        urlMatch = regex.exec(aliasStr)

        if (urlMatch) {
            return urlMatch[2]  // just the 10.<str> part
        }
        else if (aliasStr.indexOf("10.") === 0) {
            return aliasStr
        }
        else if (aliasStr.indexOf("doi:10.") === 0){
            return aliasStr.slice(4)
        }
        else return null
    }
    ,getPMID: function(aliasStr){
        var isnum_with_possible_period = /^[\d\.]+$/.test(aliasStr)

        if (aliasStr.indexOf("pmid:") === 0){
            return aliasStr.slice(5)
        }
        else if (isnum_with_possible_period && (aliasStr.length > 5) && (aliasStr.length <= 8)) {
            return aliasStr
        }
        else {
            return null
        }
    }
    ,getUrl: function(aliasStr) {
        var regex = new RegExp("^https*://.+")
        var matches = aliasStr.match(regex)
        if (matches) {
            return matches[0]
        }
        else {
            return null
        }
    }
    ,start:function(){}
    ,update:function(){}
    ,done:function(){}
    ,failure:function(){}

}








// upload bibtex from google scholar
var BibtexImporter = function(aliases, callbacks, elem) {
    this.callbacks = callbacks
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
        this.callbacks("working")
    },
    update: function(entries, errors){
        errors = errors || 0
        var that = this

        analytics.track("Imported products", {
            "import source": "bibtex",
            "number products imported": entries.biblio.length
        })

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
        aliasList.add(
            entries.aliases,
            "bibtex", // will break if we have multiple bibtex importers...
            this.callbacks
        )
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(aliasList.numAddedLast)
    },
    failure: function() {
        changeControlGroupState(this.elem$, "error")
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
