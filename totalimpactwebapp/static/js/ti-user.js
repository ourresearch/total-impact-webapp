
var ajaxLoadImg = "<img class='loading' src='../static/img/ajax-loader.gif' alt='loading...' />";


/*****************************************************************************
 * account management
 ****************************************************************************/

function User(userViews) {
    this.userViews = userViews;

    // (for constructor stuff, see bottom of this function.)

    /*  Handling data (CRUD) locally
     ************************/


    // Create
    this.create = function(){
        this.userdata({colls: {}})
    }


    // Read
    this.userdata = function(toSave) {
        if (toSave) {
            return $.cookie("userdata", JSON.stringify(toSave))
        }
        else {
            return JSON.parse($.cookie("userdata"))
        }
    }
    this.userkey = function(toSave) {
        if (toSave) {
            return $.cookie("userkey", JSON.stringify(toSave))
        }
        else {
            return JSON.parse($.cookie("userkey"))
        }
    }
    this.hasCreds = function() {
        if (this.userdata()){
            if (this.userdata()._id != "undefined" && this.userkey() != null){
                return true
            }
        }
        return false
    }


    // Update
    this.addColl = function(cid, updateKey) {
        u = this.userdata()
        u.colls[cid] = updateKey
        return this.userdata(u)
    }

    this.clearCreds = function(){
        u = this.userdata()
        delete u._id
        this.userdata(u)
        $.removeCookie("userkey")
    }

    this.setCreds = function(username, pw) {
        u = this.userdata()
        u._id = username
        this.userdata(u)

        // this doesn't provide any extra security, since anyone with access
        // to this machine can still use this key to login to this user's ti
        // acct. but it keep us from storing users' passwords, which may be
        // also used elsewhere, in plaintext.
        this.userkey(CryptoJS.HmacSHA1(pw, "a8d9e12a2903eecf554").toString())
    }

    this.removeColl = function(cid) {
        u = this.userdata()
        delete u.colls[cid]
        return true
    }


    // Delete
    this.deleteLocal = function() {
        $.removeCookie("userdata")
        $.removeCookie("userkey")
        this.create()
        this.userViews.logout()
    }



    /*  Persisting state with the server.
     ************************/
    this.syncWithServer = function(method, callbacks) {
        if (!this.hasCreds()) {
            return false;
        }
        if (typeof callbacks == "undefined") callbacks = {}
        if (method == "push"){
            var httpMethod =  "PUT"
            var url = "http://"+api_root+"/user"
            u = this.userdata()
            u.key = this.userkey()
            var bodyString = JSON.stringify(u)
        }
        else if (method == "pull"){
            var bodyString = "key="+this.userkey()
            var httpMethod = "GET"
            var url = "http://"+api_root+"/user/"+this.userdata()._id

        }

        var userViews = this.userViews
        var thisThing = this

        $.ajax({
            url: url,
            type: httpMethod,
            data: bodyString,
            dataType:"json",
            contentType: "application/json; charset=utf-8",
            statusCode: {
                200: function(data) {
                    userViews.login(data._id)
                    thisThing.userdata(data)
                    if (typeof callbacks.on200 !== "undefined") callbacks.on200()
                },
                403: function(data){
                    userViews.registerFail(data)
                    thisThing.clearCreds()
                    if (typeof callbacks.on403!== "undefined") callbacks.on403()
                },
                404: function(data) {
                   thisThing.clearCreds()
                   userViews.registerFail(data)
                    if (typeof callbacks.on404!== "undefined") callbacks.on404()
                },
                500: function(data){console.log("wo, server error.")}
            }
        })
    }

    /*  odds and ends.
     ************************/
    this.getCollInfo = function() {

        var cids = []
        for (cid in this.userdata()["colls"]) {
            cids.push(cid)
        }

        if (cids.length)  {
            this.userViews.startShowColls()
        }

        var cidsString = cids.join(",")
        var thisThing = this
        $.ajax({
                   url: "http://"+api_root+"/collections/"+cidsString,
                   type: "GET",
                   dataType:"json",
                   contentType: "application/json; charset=utf-8",
                   statusCode: {
                       404: function(data){
                           console.log("that broke. probably oughta have some error handling.")
                       },
                       200: function(data) {
                           thisThing.userViews.showColls(data)
                       }
                   }
               })

    }

    this.checkUsername = function(username, successCallback, failCallback){
        $.ajax({
            url:"http://"+api_root+"/user/"+username,
            type:"GET",
            statusCode: {
               403: function(data){ // forbidden, cause no pw. but the name is right!
                   failCallback()
               },
               404: function(data) { // doesn't exist.
                   successCallback()
               }
            }
               })
    }

    // constructor here, because has to read the rest of function first it seems.
    if (this.hasCreds()) {
        this.userViews.login(this.userdata()._id)
        this.syncWithServer("pull")
        this.create()
    }
    else if (this.userdata()) {
        // nothing, we'll keep storing events and wait for the user to login
    }
    else {
        this.create()
    }

    return true
}







function UserViews() {
    this.loginFail = function(data) {
        console.log("login fail!")
    }
    this.login = function(username) {
        $("#register-link, #login-link").hide()
            .siblings("li#logged-in").show()
            .find("span.username").html(username+"!")
        $("li.loading").remove()
        $("#inline-register").remove()

        console.log("logged in!")
    }


    this.finishRegistration = function(){
    }
    this.startRegistration = function() {
        $("#register-link, #login-link").hide()
        $("li#acct-mgt ul").append("<li class='loading'>"+ajaxLoadImg+"</li>")
    }
    this.registerFail = function(data) {
        console.log("oh noes, registration fail!")
    }
    this.logout = function(){
        $("#register-link, #login-link").show()
            .siblings("li#logged-in").hide()
        console.log("logged out.")
    }

    this.startShowColls = function() {
        $("#logged-in div.dropdown-menu")
            .empty()
            .append("<h3>Collections:</h3>").append(ajaxLoadImg)
    }

    this.showColls = function(titles) {
        $("div.dropdown-menu img.loading").remove()
        var collsList$ = $("<ul></ul>")
        var hasColls = false
        for (cid in titles) {
            var collLink = '<a href="/collection/'+ cid +'">'+ titles[cid] +'</a>'
            collsList$.append("<li>"+collLink+"</li>")
            hasColls = true
        }
        if (hasColls) {
            $("#logged-in div.dropdown-menu").append(collsList$)
        }
    }

    this.userNameExists = function() {
        $("input.username.register")
            .parents("div.control-group")
            .addClass("error")
            .removeClass("success")
            .find("span.help-inline")
            .html("sorry, that email's taken.")
    }
    this.userNameValid = function() {
        $("input.username.register")
            .parents("div.control-group")
            .addClass("success")
            .removeClass("error")
            .find("span.help-inline")
            .html("looks good!")
    }


    return true
}







function UserController(user, userViews) {
    this.user = user;
    this.userViews = userViews;

    this.init = function() {

        user = this.user
        userViews = this.userViews


        /* registration and login
         ******************************************/

        // works for both the registration and login forms.
        $(".acct-mgt form").submit(function(){

            userViews.startRegistration()

            var email = $(this).find("input.username").val()
            var pw = $(this).find("input.pw").val()
            user.setCreds(email, pw)
            var method = $(this).hasClass("register") ? "push" : "pull"
            user.syncWithServer(method)

            userViews.finishRegistration();
            return false;
        })

        $("#logout-link").click(function(){
            user.deleteLocal();
            return false;
        })

        $("li#logged-in span.username").on("click", function(){
            user.getCollInfo()
            $("#logged-in div.dropdown-menu a#logged-in").attr("data-toggle", "dropdown").click();
        })

        $("input.username.register").blur(function(){
            if (!$(this).val()) return true
            $(this).siblings("span.help-inline").empty().append(ajaxLoadImg)
            user.checkUsername(
                $(this).val(),
                userViews.userNameValid,
                userViews.userNameExists
            )
        })


    }

    return true
}
