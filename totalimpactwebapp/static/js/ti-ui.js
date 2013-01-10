$.ajaxSetup ({
    cache: false
});
$.support.cors = true; // makes IE8 and IE9 support CORS
if (!window.console) {
    console = {log: function() {}};
}


function homePageInit() {
    $('.carousel').carousel()
    $('.carousel').carousel("cycle")
}

function aboutPageInit() {
    if (location.href.indexOf("#contact") > 0) {
        $("#contact h3").css("color", tiLinkColor)
            .siblings("p").css({backgroundColor: "#ff834c"})
            .animate({backgroundColor: "#ffffff"}, 1000)
    }
}
function createPageInit() {
    // do create page stuff
}






$(document).ready(function(){
    $.cookie.defaults = {path: "/", raw: 1}

    userViews = new UserViews()
    user = new User(userViews)
    userController = new UserController(user, userViews);
    userController.init()

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
    else { // must be an item report page
        itemController.itemReportPageInit()
    }

    var aliasListController = new AliasListController()
    aliasListController.init()



    // table of contents
    if ($("#toc")[0]) {
        $('#toc').tocBuilder({type: 'headings', startLevel: 3, endLevel: 3, insertBackLinks: 0});

    }

    createCollectionInit();
    homePageInit()
    aboutPageInit()

    // let people link straight to the item-help modal
    if(window.location.href.indexOf('#context') != -1) {
        $('#context').modal('show');
    }


    prettyPrint()



});
