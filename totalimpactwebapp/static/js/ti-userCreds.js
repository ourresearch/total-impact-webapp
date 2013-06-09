var UserCreds= function(options) {
    this.options = options
    this.init()
}



UserCreds.prototype = {
    init: function(){
        console.log("init!")
        var that = this
        $("form.reset-password").submit(that.onPasswordResetFormSubmit)
        $("form.change-password").keyup(that.checkPasswordMatch)
    }
    ,onPasswordResetFormSubmit: function() {
        var this$ = $(this)
        var feedback$ = this$.find("div.control-group")
        var alertWarning$ = $("div.alert.email")
        var email = this$.find("input#email").val()
        if (!email) return false

        changeElemState(feedback$, "working")

        $.ajax({
            url: webapp_root_pretty+'/user/' + email +'/password',
            type: "GET",
            success: function(data){
                changeElemState(feedback$, "success")
                alertWarning$.slideUp()
                return false
            },
            error: function(e, textStatus, errorThrown) {
               if (e.status === 404) {
                   alertWarning$.slideDown()
                   changeElemState(feedback$, "ready")
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
            changeElemState(feedback$, "ready")
            activate()
            return
        }
        else if (pw && !pwConfirm) {
            changeElemState(feedback$, "ready")
            deactivate()
        }
        else if (pwConfirm !== pw) {
            changeElemState(feedback$,"error")
            deactivate()
        }
        else {
            changeElemState(feedback$, "success")
            activate()
        }
        return false
    }

}