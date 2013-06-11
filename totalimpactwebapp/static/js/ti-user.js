
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