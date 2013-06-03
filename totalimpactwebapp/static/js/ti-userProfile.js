var UserProfile = function(options) {
    this.options = options
    this.init()
}

UserProfile.prototype = {
    init: function(){
        if (!$("body").hasClass("user-profile")) return false
        this.functionsLikeThis()
    }
    , functionsLikeThis: function(){
        // hey i can do stuff!
    }



}

