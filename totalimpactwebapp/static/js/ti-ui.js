$.ajaxSetup ({
    cache: false
});
if (!window.console) {
    console = {log: function() {}};
}


function showNameChangeBanner(){
    if ($.cookie("hasDismissedNamechange")){
        return false
    }
    else {
        $("<div id='namechange'>We've got a new focus and a new name: total-impact is now <strong>ImpactStory!</strong><a class='dismiss'>dismiss &times;</a></div>")
            .prependTo("body")
            .find("a.dismiss")
            .click(function(){
                           $(this).parent().slideUp()
                           $.cookie("hasDismissedNamechange", true)
                       })
    }

}

function homePageInit() {
    $('.carousel').carousel()
    $('.carousel').carousel("cycle")
}






$(document).ready(function(){
    $.cookie.defaults = {path: "/", raw: 1}

    showNameChangeBanner()

    userViews = new UserViews()
    user = new User(userViews)
    userController = new UserController(user, userViews);
    userController.init()

    collViews = new CollViews()
    coll = new Coll(collViews)
    collController = new CollController(coll, collViews);

    itemController = new ItemController()


    // table of contents
    if ($("#toc")[0]) {
        $('#toc').tocBuilder({type: 'headings', startLevel: 3, endLevel: 3, insertBackLinks: 0});

    }

    createCollectionInit();
    homePageInit()



});
