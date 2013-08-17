

$.ajaxSetup ({
    cache: false
});
$.support.cors = true; // makes IE8 and IE9 support CORS
if (!window.console) {
    console = {log: function() {}};
}
var tiLinkColor = "#FF4E00"
var ajaxLoadImg = "<img class='loading' src='../static/img/ajax-loader.gif' alt='loading...' />";


changeElemState = function(elem, newClassName){
    var states = ["inactive", "ready", "working", "success", "error"]
    var controlGroup$
    if ($(elem).hasClass("control-group")) {
        controlGroup$ = $(elem)
    }
    else {
        controlGroup$ = $(elem).parents(".control-group")
    }
    controlGroup$
        .removeClass(states.join(" "))
        .addClass(newClassName)
}

// shim Object.create for inheritance.
// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create#Polyfill
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}
function toTitleCase(str) {
    // from http://stackoverflow.com/a/4878800/226013
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


function homePageInit() {
}

function aboutPageInit() {
    if (location.href.indexOf("#contact") > 0) {
        $("#contact h3").css("color", tiLinkColor)
            .siblings("p").css({backgroundColor: "#ff834c"})
            .animate({backgroundColor: "#ffffff"}, 1000)
    }
}

function createPageInit() {
    if (location.href.indexOf("/create") > 0) {
        window.started_a_profile = false;

        $(".input-append").click(function(e) { 
            if (!window.started_a_profile) {
              window.started_a_profile = true;
              analytics.track("Started a profile")
            }
        });

        $(".import-products").keydown(function(e) {     
            if (!window.started_a_profile) {
              window.started_a_profile = true;
              analytics.track("Started a profile")
            }
        });
    }
}

function decorativeJavascriptInit() {
    // table of contents
    if ($("#toc")[0]) {
        $('#toc').tocBuilder({type: 'headings', startLevel: 3, endLevel: 3, insertBackLinks: 0});
    }

    homePageInit()
    aboutPageInit()
    createPageInit()

    // let people link straight to the item-help modal
    if(window.location.href.indexOf('#context') != -1) {
        $('#context').modal('show');
    }

    // show a warning if it's the staging website
    if (location.hostname == "impactstory.it") {
        $("body").addClass("staging")
    }
    $("div.staging-warning").click(function(){$(this).hide(); return true})


    prettyPrint()
}

function manageBanners() {
    // if the user's on IE, tell 'em we're broken for them
    if ($.browser.msie) {
        $(".ie").show()
        $("#report-meta, #report-button, #metrics").hide()

        if (location.href.indexOf("api-docs") < 0) { // api-docs may work fine on IE
            return false
        }
    }

    // pretty-close for flask's flashed messages
    $("ul.flashed button.close").click(function(){
        $(this).parents("li").slideUp()
    })

}

var Navbar = function(){
    this.init()
}
Navbar.prototype = {
    init: function() {
        $("ul.nav a.given-name").tooltip({
             placement:"left",
             animation: false,
             template: '<div class="tooltip click-to-visit-profile"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'

         })
    }
}

// get the parameters from the page URL and put 'em in the urlParams obj
// from http://stackoverflow.com/a/2880929/226013
var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
})();

ISCookies = {
    lastActionUserDidToCollection: function(action) {
        if (typeof action == "undefined") {
            return $.cookie("last_action_user_did_to_collection")
        }
        else {
            // set the cookie
            return $.cookie("last_action_user_did_to_collection", action)
        }
    }
}




$(document).ready(function(){

    decorativeJavascriptInit()

    $.cookie.defaults = {path: "/", raw: 1}

    collViews = new CollViews()
    coll = new Coll(collViews)
    collController = new CollController(coll, collViews);

    itemController = new ItemController($)

    // report pages
    if (typeof reportIdNamespace == "undefined"){
        // nothing
    }
    else if (reportIdNamespace == "impactstory_collection_id") {
        collController.collReportPageInit()
    }
    else { // looks to be an item report page
        itemController.itemReportPageInit()
    }

    var user = new User()
    new AliasListInputs(user)

    new UserPreferences()
    new UserCreds()
    new UserProfile()

    new Navbar()

    // run analytics stuff
    tiAnalytics = new TiAnalytics(userDict)

    // add the Tweet This button
    $.getScript("//platform.twitter.com/widgets.js")


});
