var UserProfile = function(options) {
    this.options = options
    this.init()
}

UserProfile.prototype = {
    init: function(){
        if (!$("body").hasClass("user-profile")) return false
        this.functionsLikeThis()

        $("img.gravatar").tooltip({
            placement:"bottom",
            animation: false,
            template: '<div class="tooltip gravatar"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'

    })

    }
    , functionsLikeThis: function(){
        // hey i can do stuff!
    }



}

