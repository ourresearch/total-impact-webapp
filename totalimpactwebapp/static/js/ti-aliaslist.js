
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
    aliases: new AliasList(),
    email: "",
    emailIsValid: false,
    ExternalProfileIds:  ExternalProfileIds, // someday this'll probably be an obj
    init: function() {
        var that = this

        this.textareaPlaceholders()
        this.initHelpModals()

        // import orcid, github, and slideshare from usernames
        $(".control-group.username input")
            .each(function(){
                $(this).blur(function(){
                    if (!$(this).val()) return false
                    var importer = new UsernameImporter(
                        that.aliases,
                        that.ExternalProfileIds,
                        this
                    )
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
            var action = "update"

            // fetch ids from the textareas first
            $("textarea.ids").not(".default").each(function(){
                var importer = new TextareaImporter(that.aliases, this)
                importer.pull()
            })
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
    validateEmail: function(input) {

        console.log("here's what's in the email box: ", $(input).val())

//        if (this.email == $(input).val()) return true // no change
        if (!$(input).val()) {
            changeElemState($(input), "ready")
            return true
        }

        var that = this
        that.email = $(input).val()
        changeElemState($(input), "working")
        $("#go-button").attr("disabled", "true")


        this.user.checkUsername(
            that.email,
            function(){
                changeElemState($(input), "success")
                that.emailIsValid = true
                that.validateRegistrationForm()
            },
            function(){
                changeElemState($(input), "error")
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
            changeElemState(email$, "ready")
        }
        if (!this.emailIsValid) {
            valid = false
        }

        // password
        var pw$ = $("input.password")
        if (pw$.val().length > 3) {
            changeElemState(pw$,  "success" )
        }
        else {
            valid = false
            changeElemState(pw$, "ready" )
        }

        // names
        given$ = $("input.name.given")
        surname$ = $("input.name.surname")
        if (given$.val() && surname$.val()){
            changeElemState(given$, "success")
        }
        else {
            valid = false
            changeElemState(given$, "ready")
        }


        if (valid) { // there's still a missing val
            $("#go-button").removeAttr("disabled")
        }
        else {
            $("#go-button").attr("disabled", "disabled")
        }
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
            changeElemState(this, "ready")
        })
        $(".import-products input").val("")
        $(".import-products textarea").val("")
        this.textareaPlaceholders()
    }
}

var SubmitButton = function(aliases, ExternalProfileIds,  elem){
    this.aliases = aliases
    this.ExternalProfileIds = ExternalProfileIds
    this.elem$ = $(elem)
}
SubmitButton.prototype = {

    make: function() {
        if (!this.start()) return false

        var givenName = $("div.inline-register input.given").val() || "Anonymous"
        var surname = $("div.inline-register input.surname").val() || "User"

        var requestObj = {
            alias_tiids: this.aliases.forApi(),
            external_profile_ids: this.ExternalProfileIds,
            email: $("div.inline-register input.email").val(),
            password: $("div.inline-register input.password").val(),
            given_name: givenName,
            surname: surname
        }

        $.ajax({
           url: webapp_root+'/user',
           type: "POST",
           dataType: "json",
           contentType: "application/json; charset=utf-8",
           data:  JSON.stringify(requestObj),
           success: function(data){
               console.log("finished creating the user!")
               mixpanel.people.set({"$created": new Date()})

               location.href = "/" + data.url_slug
           }
        })
        return false
    },
    update: function(coll){
        if (!this.start()) return false
        this.addItemsToCollection(coll, this.aliases.forApi())
        return false
    },
    start:function(){
        if (!this.aliases.forApi().length) {
            alert("You haven't added any products.")
            return false
        }
        else if ($("div.inline-register .email").hasClass("error")) {
            alert("please enter an email that's not already in use.")
            return false
        }
        else {
            changeElemState(this.elem$, "working")
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
var UsernameImporter = function(aliases, ExternalProfileIds, elem) {
    this.aliases = aliases
    this.ExternalProfileIds = ExternalProfileIds
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
        changeElemState(this.elem$, "working")
    },
    update: function(){},
    done: function(data, providerName, queryStr){
        changeElemState(this.elem$, "success")
        this.ExternalProfileIds[providerName] = queryStr

        this.aliases.add(data.memberitems)
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(this.aliases.numAddedLast)
    },
    failure: function(request) {
        changeElemState(this.elem$, "error")
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
                beforeColon = thisId.split(':')[0]; // namespace
                afterColon = thisId.substr(beforeColon.length + 1) // id

                // handle urls:
                if (beforeColon == "http" || beforeColon == "https"){
                    if (afterColon.indexOf("//dx.doi.org/10.") == 0) {
                        namespace = "doi"
                        thisId = afterColon.replace("//dx.doi.org/", "")
                    } else {
                        namespace = "url";
                        // keep thisId as whole id including the http prefix so it looks like a url
                    }
                } else if (beforeColon == "doi" || beforeColon = "pmid") {
                        namespace = beforeColon
                        thisId = afterColon
                }
                // otherwise ignore because namespace content before colon not recognized
            }
            else {
                if (thisId.length > 0) {
                    var isnum_with_possible_period = /^[\d\.]+$/.test(thisId)
                    // handle dois entered without the doi prefix
                    if (thisId.substring(0,3) == "10.") {
                        namespace = "doi"
                    } else if (isnum_with_possible_period && (thisId.length > 5) && (thisId.length <= 8)) {
                        // definition of pmid from http://www.nlm.nih.gov/bsd/mms/medlineelements.html#pmid
                        // this doesn't catch short PMIDs, but that's ok
                        namespace = "pmid"
                    } else {
                        namespace = "unknown"
                    }
                }
            }
            if (typeof thisId != "undefined") {
                artifact[0] = namespace
                artifact[1] = thisId
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
        changeElemState(this.elem$, "working")
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
        changeElemState(this.elem$, "success")
        this.aliases.add(entries.aliases)
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(this.aliases.numAddedLast)
    },
    failure: function() {
        changeElemState(this.elem$, "error")
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
