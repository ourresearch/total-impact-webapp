
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
    this.getKeyForColl = function(collId) {
        try {
            return this.userdata()["colls"][collId]
        }
        catch(e) {
            return false
        }
    }
    this.popCollId = function() {
        try {
            return _.keys( this.userdata()["colls"]).sort()[0]
        }
        catch(e) {
            return false
        }
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
            if (typeof callbacks.onNoUserId() !== "undefined") callbacks.onNoUserId()
            return false;
        }
        if (typeof callbacks == "undefined") callbacks = {}
        if (method == "push"){
            var httpMethod =  "PUT"
            var url = api_root+"/user"
            u = this.userdata()
            u.key = this.userkey()
            var bodyString = JSON.stringify(u)
        }
        else if (method == "pull"){
            var bodyString = "key="+this.userkey()
            var httpMethod = "GET"
            var url = api_root+"/user/"+this.userdata()._id

        }

        var userViews = this.userViews
        var thisThing = this
        var collId = this.popCollId()

        $.ajax({
            url: url,
            type: httpMethod,
            data: bodyString,
            dataType:"json",
            contentType: "application/json; charset=utf-8",
            statusCode: {
                200: function(data) {
                    userViews.login(data._id, collId)
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
                   url: api_root+"/collections/"+cidsString,
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
            url:api_root+"/user/"+username,
            type:"GET",
            statusCode: {
               403: function(data){ // forbidden, cause no pw. that name is taken!
                   failCallback()
               },
               404: function(data) { // doesn't exist; name is available, yay.
                   successCallback()
               }
            }
               })
    }

    // constructor here, because has to read the rest of function first it seems.
    if (this.hasCreds()) {
        console.log("the user has creds; here they are:", $.cookie("userdata"))
        this.userViews.login(this.userdata()._id)
        this.syncWithServer("pull")
//        this.create()
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
    this.login = function(username, collId) {
        $("#register-link, #login-link").hide()
            .siblings("li#logged-in").show()
            .find("span.username").html(username+"!")
        $("li.loading").remove()
        $("div.inline-register div.email")
            .add("div.inline-register div.password")
            .add("div.inline-register div.submit label")
            .add("#name")
            .hide()
        this.showHideCreate(true, collId)

        console.log("logged in!")
    }

    this.finishRegistration = function(){
        console.log("finished registration")
        _gaq.push(['_trackPageview', '/user/created']);
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
        this.showHideCreate(false)
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
    this.showHideCreate = function(hasCreds, collId) {
        // don't let logged-in users create new collections
        if (hasCreds) {
            $("ul.nav li.create-button").hide()

            if (collId){
                // if user types /create in address bar manually, redirect to index
                var pathname = window.location.pathname
                if (pathname == "/create" || pathname == "/" ) {
                    window.location = "/collection/" + collId;
                }
            }

            // change frontpage "make profile" to "show profile"
            $("#call-to-action span.logged-in").removeClass("inactive")
            $("#call-to-action span.not-logged-in").addClass("inactive")
        }
        else { // not logged in
            $("ul.nav li.create-button").show()
            $("#call-to-action span.logged-in").addClass("inactive")
            $("#call-to-action span.not-logged-in").removeClass("inactive")

        }
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
        // registration
        $("form.register").submit(function(){
            var email = $(this).find("input.username").val()
            var pw = $(this).find("input.pw").val()
            var name = $(this).find("input.name").val() // doing nothing with this now...

            user.setCreds(email, pw)
            user.syncWithServer("push")
            $("div#login-register").modal("hide")
            return false;
        })

        // login; v. similar to registration, can refactor later
        $("form.login").submit(function(){
            var email = $(this).find("input.username").val()
            var pw = $(this).find("input.pw").val()

            user.setCreds(email, pw)
            user.syncWithServer("pull")
            $("div#login-register").modal("hide")
            return false;
        })


        $("#logout-link").click(function(){
            user.deleteLocal();
            return false;
        })

        // register/login
        $("a.login-register-link").click(function(){

            // hide any modals out now, then show the register/login modal
            if ($(".modal.in")[0]) {
                $(".modal.in")
                    .one("hidden", function(){
                        $("#login-register").modal("show")
                    })
                    .modal("hide")
            }
            else {
                $("#login-register").modal("show")
            }
        })

        $("li#logged-in span.username").on("click", function(){
            user.getCollInfo()
            $("#logged-in div.dropdown-menu a#logged-in").attr("data-toggle", "dropdown").click();
        })

        // used for the ti-aliaslist panel
        // TODO make this work for the header login widget, too
        $("input.register.username").blur(function(){
            var that$ = $(this)
            if (!that$.val()) return true
            if (that$.parents(".control-group").hasClass("success")) return true

            changeControlGroupState(that$, "working")
            user.checkUsername(
                that$.val(),
                function(){changeControlGroupState(that$, "success")},
                function(){changeControlGroupState(that$, "failure")}
            )

        })

        this.userViews.showHideCreate(user.hasCreds(), user.popCollId())

    }

}
