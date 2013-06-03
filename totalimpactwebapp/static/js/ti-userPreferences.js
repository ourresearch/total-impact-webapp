var UserPreferences = function(options) {
    this.options = options
    this.init()
}

UserPreferences.prototype = {
    init: function(){
        this.clickNameToModify()
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
}

