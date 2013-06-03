var UserPreferences = function(options) {
    this.options = options
    this.init()
}

UserPreferences.prototype = {
    init: function(){
        this.clickNameToModify()
        this.clickUrlSlugToModify()
        this.changePassword()
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
    , changePassword: function(){
        $("#change-pw").submit(function(){
            var this$ = $(this)
            var requestObj = {
                current_password: $("#current-pw").val(),
                new_password: $("#new-pw").val()
            }

            changeControlGroupState(
                this$.find("div.control-group"),
                "working"
            )

            $.ajax({
                url: webapp_root_pretty+'/user/' + impactstoryUserId + '/password',
                type: "PUT",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data:  JSON.stringify(requestObj),
                success: function(data){
                    window.location = webapp_root_pretty + "/logout?next=login"
                },
                error: function(e, textStatus, errorThrown) {
                    if (e.status === 403) {
                        changeControlGroupState(
                            $("div.control-group.enter-current-pw"),
                            "failure"
                        )
                        changeControlGroupState(
                            $("div.control-group.enter-new-pw"),
                            "ready"
                        )
                    }
                }

            })





            return false;
        })
    }
}

