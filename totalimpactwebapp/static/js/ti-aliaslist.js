
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
    changeControlGroupState: function(newClassName){
        var classesToRemove = _.without(this.inputClasses, "ready").join(" ")
        this.elem$
            .parents(".control-group")
            .removeClass(this.inputClasses.join(" "))
            .addClass(newClassName)
    },
    start:function() {
        this.changeControlGroupState("working")
    },
    update: function(){},
    done: function(data){
        this.changeControlGroupState("success")
        this.aliases.add(data.memberitems)
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(this.aliases.numAddedLast)
        $("p#artcounter span").html(this.aliases.count())
    },
    failure: function(request) {
        this.changeControlGroupState("failure")
    }
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
                   success:  function(response,status,xhr){
                       query_hash = response.query_hash
                       console.log("started update request; got this query_hash back: " + query_hash)
//                       update_bibtex_progress(query_hash)
                   },
                   error: function(XMLHttpRequest, textStatus, errorThrown) {
                       console.log("error")
                       return true
                       $("span.loading").remove()
                       $("div.fileupload span.added").remove()
                       $("div.fileupload").append("<span class='added'><span class='sorry'>sorry, there was an error.</span></span>")
                   }
               });

    },
    changeControlGroupState: function(newClassName){
        var classesToRemove = _.without(this.inputClasses, "ready").join(" ")
        this.elem$
            .parents(".control-group")
            .removeClass(this.inputClasses.join(" "))
            .addClass(newClassName)
    },
    start:function() {
        this.changeControlGroupState("working")
    },
    update: function(){},
    done: function(data){
        this.changeControlGroupState("success")
        this.aliases.add(data.memberitems)
        this.elem$
            .parents(".control-group")
            .find("span.success span.value")
            .html(this.aliases.numAddedLast)
        $("p#artcounter span").html(this.aliases.count())
    },
    failure: function(request) {
        this.changeControlGroupState("failure")
    }
}
