var UserCreds= function(options) {
    this.options = options
    this.init()
}



UserCreds.prototype = {
    init: function(){
        var that = this
        $("form.reset-password").submit(that.onPasswordResetFormSubmit)
        $("form.change-password")
            .keyup(that.checkPasswordMatch)
            .submit(that.onPasswordChangeFormSubmit)

        if (that.userNeedsToResetPw()) {
            $("body").addClass("needs-to-reset-pw")
            if ($("body").hasClass("login")) {
                window.location = "/reset-password"
            }
        }
    }
    ,onPasswordResetFormSubmit: function() {
        var this$ = $(this)
        var feedback$ = this$.find("div.control-group")
        var alertWarning$ = $("div.alert.email")
        var email = this$.find("input#email").val()
        if (!email) return false

        changeControlGroupState(feedback$, "working")

        $.ajax({
            url: webapp_root_pretty+'/user/' + email +'/password',
            type: "GET",
            success: function(data){
                changeControlGroupState(feedback$, "success")
                alertWarning$.slideUp()
                return false
            },
            error: function(e, textStatus, errorThrown) {
               if (e.status === 404) {
                   alertWarning$.slideDown()
                   changeControlGroupState(feedback$, "ready")
                   return false
               }
            }

        })
        return false;
    }
    ,checkPasswordMatch: function() {
        var this$ = $(this)
        var feedback$ = this$.find("div.control-group.input")
        var deactivate = function() {
            this$.find("button.submit").attr("disabled", "disabled")
        }
        var activate = function() {
            this$.find("button.submit").removeAttr("disabled")
        }

        var pw = this$.find("input#new-pw").val()
        var pwConfirm = this$.find("input#confirm-new-pw").val()

        if (!pw && !pwConfirm) {
            changeControlGroupState(feedback$, "ready")
            activate()
            return
        }
        else if (pw && !pwConfirm) {
            changeControlGroupState(feedback$, "ready")
            deactivate()
        }
        else if (pwConfirm !== pw) {
            changeControlGroupState(feedback$,"error")
            deactivate()
        }
        else {
            changeControlGroupState(feedback$, "success")
            activate()
        }
        return false
    }
    ,userNeedsToResetPw: function() {
        if ($.cookie("userdata")) {
            return true
        }
        else {
            return false
        }
    }
    ,onPasswordChangeFormSubmit: function() {
        console.log("removing cookie")
        $.removeCookie("userdata")
        return true
    }

}