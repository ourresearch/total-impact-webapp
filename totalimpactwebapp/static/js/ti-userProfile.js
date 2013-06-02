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
        $("h2.page-title span").each(function(){
            var title = "Edit " + (this.className.replace("-", " "))
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



}

