var UserProfile = function(options) {
    this.options = options
    this.init()
}

UserProfile.prototype = {
    init: function(){
        if (!$("body").hasClass("user-profile")) return false
        console.log("userprofile is running!")
        this.clickNameToModify()
    }
    , clickNameToModify: function(){
        var name = {
            given: $("h2.page-title span.given-name").text(),
            surname: $("h2.page-title span.surname").text()
        }

        $("h2.page-title span.given-name").editable({
            type: "text",
            pk: impactstoryUserId,
            url: "/user/"+impactstoryUserId,
            title: "Given name",
            ajaxOptions: {
                type: 'PUT'
            }
        })
    }



}

