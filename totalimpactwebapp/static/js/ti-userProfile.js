var UserProfile = function(options) {
    this.options = options
    this.init()
}

UserProfile.prototype = {
    init: function(){
        if (!$("body").hasClass("user-profile")) return false
        console.log("userprofile is running!")
    }
    , clickNameToModify: function(){
    }



}

