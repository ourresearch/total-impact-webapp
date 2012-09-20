
function Genre(name) {
    this.name = name
    this.items = []
    console.log("new genre made. name: " + this.name)

    this.render = function(){


        var genre$ = $(ich.genreTemplate({name:this.name}, true))

        var renderedItems = []
        var itemsWithoutActivity = []
        for (var i=0;i<this.items.length;i++){
            var thisItem = this.items[i]
            if (thisItem.hasAwards()) {
                renderedItems.push(thisItem.render())
            }
            else {
                itemsWithoutActivity.push(thisItem.render())
            }
        }
        genre$.find("ul.items.active").append(renderedItems)
        genre$.find("ul.items.inactive").append(itemsWithoutActivity)
        if (itemsWithoutActivity.length) {
            genre$.find("h4.plus-more span.value")
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
        console.log("rendering genre list")
        console.time("render genre")
        var genres = []
        for (var thisGenreName in this.genres){
            var renderedGenre = this.genres[thisGenreName].render()
            genres.push(renderedGenre)
        }
        $("#metrics div.wrapper").append(genres)
        console.log("done rendering genre list")
        console.timeEnd("render genre")
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
            this.items[tiid] = new Item(newItemDicts[i], new ItemView())
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

    this.get = function(interval) {
        var thisThing = this
        this.views.startUpdating()
        $.ajax({
            url: "http://"+api_root+'/collection/'+thisThing.id,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            statusCode: {
               210: function(data){
                   console.log("still updating")
                   thisThing.addItems(data.items)
                   thisThing.views.render(thisThing.items)
                   setTimeout(function(){
                       thisThing.get(interval)
                   }, 500)
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
        $("h2").before(ajaxLoadImgTransparent)
    }

    this.badgesWeight = function(dict) {
        var weight = 0
        weight += dict.awards.big.length * 10
        weight += dict.awards.any.length * 1
        return weight
    }

    this.finishUpdating = function(items){
        $("#page-header img").remove()

        $("#num-items span.value").text(items.length)
        $("img.loading").remove()
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
    if (typeof collectionId != 'undefined') {
        coll.id = collectionId
        coll.get(1000)
    }


    // the report controls
    $("#update-report-button").click(function(){
        coll.update();
        return false;
    })
    $("div.btn-group.download button").click(function(){
        console.log("click")
        location.href = $(this).val()
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
