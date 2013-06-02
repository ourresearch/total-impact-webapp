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
        var name = $("h2.page-title").text().split(" ")
        var data = {
            given: name[0],
            surname: name[1]
        }
        $("h2.page-title").editable({
            type: "text",
            pk: impactstoryUserId,
            url: "/user/"+impactstoryUserId+"/name",
            title: "first name, last name",
            ajaxOptions: {
                type: 'PUT',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data:  JSON.stringify(data)
            }
        })
    }



}

