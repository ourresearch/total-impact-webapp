var UserCreds= function(options) {
    this.options = options
    this.init()
}



UserCreds.prototype = {
    init: function(){
        console.log("init!")
        var that = this
        $("form.reset-password").submit(
            that.onPasswordResetFormSubmit
        )
    },
    requestResetPasswordEmail: function(){
    },
    onPasswordResetFormSubmit: function() {
        var this$ = $(this)
        var feedback$ = this$.find("div.control-group.feedback")

        var email = this$.find("input#email").val()

        if (!email) return false

        changeElemState(feedback$, "working")

        $.ajax({
            url: webapp_root_pretty+'/user/' + email +'/password',
            type: "GET",
            success: function(data){
                changeElemState(feedback$, "success")
                return false
            },
            error: function(e, textStatus, errorThrown) {
               if (e.status === 404) {
                   changeElemState(feedback$, "error")
                   return false
               }
            }

        })

        return false;
    }
}