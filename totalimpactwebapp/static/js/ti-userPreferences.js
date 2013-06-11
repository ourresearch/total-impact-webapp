var UserPreferences = function(options) {
    this.options = options
    if (typeof impactStoryUserId == "undefined") return false
    this.init()
}

UserPreferences.prototype = {
    init: function(){
        this.clickNameToModify()
        this.clickUrlSlugToModify()
        this.changePassword()
    }
    , clickNameToModify: function(){
        $("body.can-edit .editable-name span.editable").each(function(){
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
            pk: impactStoryUserId,
            url: "/user/"+impactStoryUserId+"?fail_on_duplicate=true",
            mode: "inline",
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
                else if (response.status === 400) {
                    return "Only letters, numbers, apostrophes, and dashes are allowed."
                }
                else {
                    response.responseText
                }
            }
        })
    }
    , changePassword: function(){
        $("#change-pw").submit(function(){
            var this$ = $(this)

            // make sure the new pw was entered correctly twice
            if ($("#new-pw").val() != $("#confirm-new-pw").val()) {
                $("div.control-group.confirm-new-pw").addClass("error")
                return false
            }


            var requestObj = {
                current_password: $("#current-pw").val(),
                new_password: $("#new-pw").val()
            }

            changeElemState(
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
                    changeElemState(
                        $("div.control-group"),
                        "ready"
                    )
                    $("span.pw-changed").show().fadeOut(2000)
                    this$.find("input").val("").blur()

                },
                error: function(e, textStatus, errorThrown) {
                    if (e.status === 403) {
                        changeElemState(
                            $("div.control-group.enter-current-pw"),
                            "error"
                        )
                        // stop the spinner gif, bring back submit button.
                        changeElemState(
                            $("div.control-group.confirm-new-pw"),
                            "ready"
                        )
                    }
                }

            })





            return false;
        })
    }
}

