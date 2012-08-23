

function Coll(collViews, user){
    this.views = collViews;
    this.user = user
    this.id = null
    this.items = {}

    this.addItems = function(newItemDicts) {
        for (i in newItemDicts) {
            tiid = newItemDicts[i]["_id"]
            this.items[tiid] = new Item(newItemDicts[i], new ItemView())
        }
    }

    this.update = function(interval) {
        thisThing = this
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
                       thisThing.update(interval)
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
    this.startUpdating = function(data){

    }
    this.finishUpdating = function(items){
        $("#page-header img").remove()

        $("#num-items").remove();
        $("<span id='num-items'>"+items.length+" items</span>")
            .hide()
            .insertAfter("#report-button")
            .show();
    }
    this.render = function(itemObjsDict) {
        $("ul#items").empty()
        console.log("looking through the item objects")
        console.log(itemObjsDict)
        for (var tiid in itemObjsDict){
            // make the set of all newly-rendered items
            // this is a very slow way to do this...should bundle together,
            // then make one replace.
            var genre = itemObjsDict[tiid].dict.biblio.genre
            var genreItems = "div." + genre + " ul#items"
            $(genreItems).append(itemObjsDict[tiid].render())
            $("div." + genre).show()  // would ideally only do this once
        }
    }
}


function CollController(coll, collViews) {
    if (typeof collectionId != 'undefined') {
        coll.id = collectionId
        coll.update(1000)
    }
}
