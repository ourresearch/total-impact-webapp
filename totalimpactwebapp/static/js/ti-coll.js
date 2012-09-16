

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
        weight += dict.awards.cells.length * 10
        weight += dict.awards.audiences.length * 1
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

        console.log(itemObjs)

        $("ul#items").empty()
        console.log("looking through the item objects")
        for (var i=0; i<itemObjs.length; i++){
            // make the set of all newly-rendered items
            // this is a very slow way to do this...should bundle together,
            // then make one replace.
            var genre = itemObjs[i].dict.biblio.genre
            var genreItems = "div." + genre + " ul#items"
            $(genreItems).append(itemObjs[i].render())
            $("#metrics div." + genre).show()  // would ideally only do this once
        }
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
