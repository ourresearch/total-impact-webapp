

/*****************************************************************************
 * account management
 ****************************************************************************/

function User(userViews) {
    this.userViews = userViews;

    this.addColl = function(cid) {
        userCols = JSON.parse($.cookie("usercols"))
        userData.colls.push(cid)
        userData.colls = userData.colls.unique()
        $.cookie("userdata", JSON.stringify(userdata))
        return true
    }

    this.removeColl = function(cid) {
        userData = JSON.parse($.cookie("userdata"))
        index = userdata.colls.indexOf("cid")
        if (index > -1) {
            userdata.colls.splice(index, 1)
        }
        $.cookie("userdata", JSON.stringify(userdata))
        return true
    }

    this.getColls = function(){
        userData = JSON.parse($.cookie("userdata"))
        return userData["colls"]
    }

    this.getCollsWithTitles = function() {
        thisThing = this
        colls = JSON.parse($.cookie("userdata"))["colls"]
        collsStr = colls.join(",")
        $.ajax({
                   url: "http://"+api_root+"/collections/"+colls,
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



    this.updateServer = function() {

    }

    this.loginFromCookie = function() {
        userdata = JSON.parse($.cookie("userdata"))
        userkey = $.cookie("userkey")
        if (userkey && userdata) {
            if (typeof userdata._id != "undefined"){
                this.login(userdata._id, userkey)
            }
        }
    }

    this.createAnonUser = function(){
        userdata = {colls: []}
        $.cookie("userdata", JSON.stringify(userdata))
    }


    this.login = function(userid, key) {
        var userViews = this.userViews
        $.ajax({
                   url: "http://"+api_root+"/user/"+userid+"?key="+key,
                   type: "GET",
                   dataType:"json",
                   contentType: "application/json; charset=utf-8",
                   statusCode: {
                       404: function(data){
                           userViews.loginFail(data)
                       },
                       200: function(data) {
                           $.cookie("userkey", key)
                           $.cookie("userdata", JSON.stringify(data))
                           userViews.login(data._id)
                       }
                   }
               })
    }

    this.logout = function() {
        $.removeCookie("userdata")
        this.userViews.logout()
    }

    this.register = function(userid, key) {
        var userViews = this.userViews
        var thisThing = this
        var anonUserColls = JSON.parse($.cookie("userdata"))["colls"]
        var queryString = JSON.stringify({key: key, colls: anonUserColls})
        $.ajax({
            url: "http://"+api_root+"/user/"+userid,
            type: "POST",
            data: queryString,
            dataType:"json",
            contentType: "application/json; charset=utf-8",
            statusCode: {
               400: function(data){
                   userViews.registerFail(data)
               },
               404: function(data){
                   userViews.registerFail(data)
               },
               409: function(data) {
                   userViews.registerFail(data)
               },
               500: function(data){console.log("wo, server error.")},
               200: function(data) {
                   $.cookie("userdata", JSON.stringify(data))
                   $.cookie("userkey", key)

                   userViews.register(data)
                   thisThing.login(userid, key)
               }
            }
            })
    }
    return true
}

function UserViews() {
    this.loginFail = function(data) {
        console.log("login fail!")
    }
    this.login = function(username) {
        $("#register-link, #log-in-link").hide()
            .siblings("li#logged-in").show()
            .find("span.username").html(username+"!")
        console.log("logged in!")
    }
    this.register = function(data) {
        console.log("account created!")
    }
    this.registerFormStart = function(loginOrRegister) {
        if (loginOrRegister == "register") {
            $("div#register-login").slideDown().removeClass("log-in").addClass("register")
        }
        else {
            $("div#register-login").slideDown().removeClass("register").addClass("log-in")
        }
    }
    this.registerFormFinished = function(){
        $("div#register-login").slideUp();
    }
    this.registerFail = function(data) {
        console.log("oh noes, registration fail!")
    }
    this.logout = function(){
        $("#register-link, #log-in-link").show()
            .siblings("li#logged-in").hide()
        console.log("logged out.")
    }

    this.showColls = function(colls) {
        console.log(colls)
    }
    return true
}

function UserController(user, userViews) {
    this.user = user;
    this.userViews = userViews;

    this.init = function() {

        user = this.user
        userViews = this.userViews

        user.createAnonUser()
        user.loginFromCookie() // if we can login, Anon's data is overwritten.


        // registration
        $("#register-link a").click(function(){
            userViews.registerFormStart("register");
            return false;
        })
        $("#register-login form").submit(function(){

            var email = $("#email").val()
            var pw = $("#pw").val()
            var isRegisterForm = $(this).parent().hasClass("register")

            if (isRegisterForm) {
                user.register(email, pw)
            }
            else  {
                user.login(email, pw)
            }
            userViews.registerFormFinished();
            return false;
        })


        // login
        $("#log-in-link").click(function(){
            userViews.registerFormStart("login");
            return false;
        })
        $("#register-login.log-in form").submit(function(){
            console.log("submitting login form.")
            user.login(
                $("#email").val(),
                $("#pw").val()
            )
            userViews.registerFormFinished();
            return false;
        })


        // log out
        $("#logout-link").click(function(){
            user.logout();
            return false;
        })

    }

    return true
}
