var UserAdmin = function(options) {
    this.options = options
    this.init()
}

UserAdmin.prototype = {
    init: function(){
        this.clickNameToModify()
    }
    , clickNameToModify: function(){
        $("body.can-edit h2.page-title span.editable").each(function(){
            console.log("click name to modify")
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
}

