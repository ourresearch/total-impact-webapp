$.ajaxSetup ({
    cache: false
});
$.support.cors = true; // makes IE8 and IE9 support CORS
if (!window.console) {
    console = {log: function() {}};
}

console.log("loading")

/*****************************************************************************
 * generate api page
 ****************************************************************************/


generateApiInit = function(){

    // creating a collection by submitting the object IDs from the homepage
    $("#api-form").submit(function(){
        console.log("in submit form")

        // make sure the user input something at all
        if (collectionAliases.length == 0) {
            alert("Looks like you haven't added any research objects to the collection yet.")
            return false;

        // create a collection with these aliases
        } else {
            console.log("adding collection with new items.")

            $("#go-button").replaceWith("<span class='loading'>"+ajaxLoadImg+"<span>")

            var requestObj = {
                title: $('#name').val(),
                aliases: collectionAliases
            }

            $.ajax({
                url: "http://"+api_root+'/collection',
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data:  JSON.stringify(requestObj),
                success: function(ret){
                    returnedCollection=ret.collection

                    // add the id of the newly-created coll to the user's coll list
                    user.addColl(returnedCollection._id, ret.key)

                    var email = $("#inline-register-email").val()
                    var pw = $("#inline-register-pw").val()
                    if (email && pw){
                        user.setCreds(email, pw)
                    }

                    var success = function(){
                        _gaq.push(['_trackPageview', '/user/created']);
                        location.href = "/collection/" +returnedCollection._id
                    }

                    if (user.hasCreds()){
                        user.syncWithServer("push", {on200: success})
                    }
                    else {
                        success()
                    }
                }
            });
            return false;
        }
    });
}



$(document).ready(function(){
    generateApiInit();
    prettyPrint()
});
