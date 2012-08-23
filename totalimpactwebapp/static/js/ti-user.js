

/*****************************************************************************
 * account management
 ****************************************************************************/

function User(userViews) {
    this.userViews = userViews;

    this.loginFromCookie = function() {
        userdata = JSON.parse($.cookie("userdata"))
        userkey = $.cookie("userkey")
        if (userkey && userdata) {
            this.login(userdata._id, userkey)
        }
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
        thisThing = this
        $.ajax({
                   url: "http://"+api_root+"/user/"+userid+"?key="+key,
                   type: "POST",
                   dataType:"json",
                   contentType: "application/json; charset=utf-8",
                   statusCode: {
                       404: function(data){
                           userViews.registerFail(data)
                       },
                       409: function(data) {
                           userViews.registerFail(data)
                       },
                       200: function(data) {
                           $.cookie("userkey", key)
                           $.cookie("userdata", JSON.stringify(data))
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
    return true
}

function UserController(user, userViews) {
    this.user = user;
    this.userViews = userViews;

    this.init = function() {

        user = this.user
        userViews = this.userViews

        user.loginFromCookie()


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
