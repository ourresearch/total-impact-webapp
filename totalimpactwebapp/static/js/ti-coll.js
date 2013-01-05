
function Genre(name) {
    this.name = name
    this.items = []

    this.render = function(){


        var genre$ = $(ich.genreTemplate({name:this.name}, true))

        var renderedItems = []
        var itemsWithoutActivity = []
        for (var i=0;i<this.items.length;i++){
            var thisItem = this.items[i]
            if (thisItem.dict.awards.length) {
                renderedItems.push(thisItem.render())
            }
            else {
                itemsWithoutActivity.push(thisItem.render())
            }
        }
        genre$.find("ul.items.active").append(renderedItems)
        genre$.find("ul.items.inactive").append(itemsWithoutActivity)
        if (itemsWithoutActivity.length) {
            genre$.find("h4.plus-more")
                .toggle(
                    function(){
                        $(this).addClass("showing").siblings("ul.items.inactive").slideDown()
                        $(this).find("span.show-hide").html("(hide)")
                    },
                    function() {
                        $(this).removeClass("showing").siblings("ul.items.inactive").slideUp()
                        $(this).find("span.show-hide").html("(show)")
                    }
                )
                .find("span.value")
                .html(itemsWithoutActivity.length)
        }
        else {
            genre$.find("h4.plus-more").hide()
        }

        return genre$
    }
    return true
}

function GenreList(items) {
    this.genres = {}

    // put the items in the correct genre objects
    for (var i=0; i<items.length; i++){
        var genreName = items[i].dict.biblio.genre
        if (!this.genres[genreName]) {
            this.genres[genreName] = new Genre(genreName)
        }
        this.genres[genreName].items.push(items[i])


    }

    this.render = function(){
        var genres = []
        for (var thisGenreName in this.genres){
            var renderedGenre = this.genres[thisGenreName].render()
            genres.push(renderedGenre)
        }
        $("div.genre").remove()
        $("div.tooltip").remove() // otherwise tooltips from removed badges stick around
        $("#metrics div.wrapper").append(genres)
    }
}

function Coll(collViews, user){
    this.views = collViews;
    this.user = user
    this.id = null
    this.items = {}

    this.addItems = function(newItemDicts) {
        for (var i=0; i<newItemDicts.length; i++) {
            tiid = newItemDicts[i]["_id"]
            this.items[tiid] = new Item(newItemDicts[i], new ItemView($), $)
        }
    }

    this.update = function() {
        var thisThing = this
        this.views.startUpdating()
        $.ajax({
            url: "http://"+api_root+'/collection/'+this.id,
            type: "POST",
            success: function(data){
               console.log("updating.")
               thisThing.get(1000);
            }});
        }

    this.get = function(interval, tries) {
        if (tries === undefined) {
            var tries = 0
        }

        var thisThing = this
        this.views.startUpdating()
        $.ajax({
            url: "http://"+api_root+'/collection/'+thisThing.id+'?api_key='+api_key,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            statusCode: {
               210: function(data){
                   console.log("still updating")
                   thisThing.addItems(data.items)
                   thisThing.views.render(thisThing.items)

                   if (tries > 120) { // give up after 1 minute...
                       thisThing.render(data.items)
                       console.log("failed to finish update; giving up after 1min.")
                   }
                   else {
                       setTimeout(function(){
                           thisThing.get(interval, tries+1)
                       }, 500)
                   }
               },
               200: function(data) {
                   console.log("done with updating")
                   thisThing.addItems(data.items)
                   thisThing.views.render(thisThing.items)
                   thisThing.views.finishUpdating(data.items)

                   return false;
               }
            }
        });
    }
}

function CollViews() {
    this.startUpdating = function(){
        $("img.loading").remove()
        $("h2").before(ajaxLoadImg)
    }

    this.badgesWeight = function(dict) {
        return _.reduce(dict.awards, function(memo, metric){
            return memo + (metric.isHighly) ? 10 : 1
        }, 0)
    }

    this.finishUpdating = function(items){
        // setup page header
        $("#page-header img").remove()
        $("#num-items span.value").text(items.length)

        // setup item-level zooming
        $("ul.active li.item div.item-header").addClass("zoomable")
        $("span.item-expand-button")
            .show()
            .css({color: tiLinkColor})
            .fadeOut(1500, function(){
                $(this).removeAttr("style")
            })
    }

    this.render = function(itemObjsDict) {
        var thisNow = this

        // convert items dict into array and sort it
        var itemObjs = []
        for (tiid in itemObjsDict) {
            itemObjs.push(itemObjsDict[tiid])
        }

        itemObjs.sort(function(a,b) {
            return thisNow.badgesWeight(b.dict) -  thisNow.badgesWeight(a.dict)
        })

        var genreList = new GenreList(itemObjs)
        genreList.render()

    }
}


function CollController(coll, collViews) {

    this.collReportPageInit = function() {
        coll.id = reportId
        coll.get(1000)
    }


    // the report controls
    $("#update-report-button").click(function(){
        coll.update();
        return false;
    })

    $("div#num-items a").toggle(
        function(){
            $(this).html("(collapse all)")
            $("li.item").addClass("zoomed").find("div.zoom").show()
        },
        function(){
            $(this).html("(expand all)")
            $("li.item").removeClass("zoomed").find("div.zoom").hide()
        }
    )


}
