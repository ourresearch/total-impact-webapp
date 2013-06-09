
/*****************************************************************************
 * account management
 ****************************************************************************/

function User() {

    this.checkUsername = function(email, successCallback, failCallback){
        $.ajax({
            url:webapp_root+"/user?email="+email,
            type:"GET",
            statusCode: {
               200: function(data){ // forbidden, cause no pw. that name is taken!
                   failCallback()
               },
               404: function(data) { // doesn't exist; name is available, yay.
                   successCallback()
               }
            }
               })
    }

}




function UserViews() {
}




function UserController() {
    this.user = new User();
    this.userViews = new UserViews();

    this.init = function() {

        var user = this.user
        var userViews = this.userViews


        /* registration and login
         ******************************************/

        // used for the ti-aliaslist panel
        $("input.register.username").blur(function(){
            var that$ = $(this)
            if (!that$.val()) return true
            if (that$.parents(".control-group").hasClass("success")) return true

            changeElemState(that$, "working")
            user.checkUsername(
                that$.val(),
                function(){changeElemState(that$, "success")},
                function(){changeElemState(that$, "error")}
            )

        })
    }

}
