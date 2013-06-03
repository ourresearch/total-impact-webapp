var UserPreferences = function(options) {
    this.options = options
    this.init()
}

UserPreferences.prototype = {
    init: function(){
        this.clickNameToModify()
        this.clickUrlSlugToModify()
    }
    , clickNameToModify: function(){
        $("body.can-edit h2.page-title span.editable").each(function(){
            var title = "Edit " + ($(this).attr("data-name").replace("_", " "))
            $(this).editable({
                                 type: "text",
                                 pk: impactstoryUserId,
                                 url: "/user/"+impactstoryUserId,
                                 title: title,
                                 ajaxOptions: {
                                     type: 'PUT'
                                 }
                             })
        })
    }
    , clickUrlSlugToModify: function() {
        $("span.slug.editable").editable({
            type: "text",
            name: "slug",
            pk: impactstoryUserId,
            url: "/user/"+impactstoryUserId+"?fail_on_duplicate=true",
            mode: "inline",
//            onblur:"ignore",
            ajaxOptions: {
                type: 'PUT'
            },
            success: function(response, newValue){
                window.location = webapp_root_pretty + "/" + newValue + "/preferences"
            },
            error: function(response, newValue){
                if (response.status === 409) {
                    return "Whoops, looks like someone else is already using that URL..."
                }
                else {
                    response.responseText
                }
            }
        })
//            .editable("show", false)
//        $("input").blur()
    }
}

