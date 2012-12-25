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


generateApiKeyInit = function(){

    // creating a collection by submitting the object IDs from the homepage
    $("#api-form").submit(function(){
        console.log("in submit form")

        // make sure the user input something at all
        if ($('#prefix').val().length == 0) {
            alert("Looks like you haven't added a prefix yet.")
            return false;

        } else {
            console.log("going to get api key")

            $("#get-api-button").replaceWith("<span class='loading'>"+ajaxLoadImg+"<span>")

            var requestObj = {
                password: $('#password').val(),
                api_key_owner: $('#api-key-owner').val(),
                email: $('#email').val(),
                prefix: $('#prefix').val(),
                api_limit: $('#api-limit').val(),
                usage: $('#usage').val(),
                example_page: $('#example_page').val(),
                notes: $('#notes').val()
            }

            $.ajax({
                url: "http://" + api_root + "/v1/key?key=WEBAPP",
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data:  JSON.stringify(requestObj),
                success: function(ret){
                    console.log("in success")
                    var api_key = ret.api_key
                    console.log(api_key)
                    $("#api-form").replaceWith("<span>api key is " +api_key+ "</span")
                },
                error: function(ret){
                    console.log("error")
                    $("#api-form").replaceWith("<span>api key not returned, status code " +ret.status+ " " +ret.statusText+ "</span>")
                }
            });
            return false;
        }
    });
}



$(document).ready(function(){
    generateApiKeyInit();
    prettyPrint()
});
