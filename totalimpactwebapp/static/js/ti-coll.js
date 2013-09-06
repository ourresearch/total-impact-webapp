
function Genre(name) {
    this.name = name
    this.items = []

    this.sortItems = function(items) {
        return _.sortBy(items, function(item){
            var badgesSortFactor = _.reduce(item.dict.awards, function(memo, award){
                return memo + ((award.isHighly) ? 10 : 1)
            }, 0)
            return badgesSortFactor
        }).reverse()
    }

    this.render = function(){
        this.items = this.sortItems(this.items)

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
    var itemGroupsByGenre = _.groupBy(items, function(item) {
        return item.dict.biblio.genre
    })
    this.genres = _.map(itemGroupsByGenre, function(items, genreName){
        var genre = new Genre(genreName)
        genre.items = items
        return genre
    })

    this.render = function(){

        var renderedGenres = _.chain(this.genres)
            .sortBy("name")
            .map(function(genre){
                return genre.render()
            })
            .value()

        $("div.genre").remove()
        $("div.tooltip").remove() // otherwise tooltips from removed badges stick around
        $("#metrics div.wrapper").append(renderedGenres)
    }
}

function Coll(collViews){
    this.views = collViews;
    this.id = null
    this.items = {}

    this.addItemsFromDicts = function(newItemDicts) {
        for (var i=0; i<newItemDicts.length; i++) {
            var tiid = newItemDicts[i]["_id"]
            this.items[tiid] = new Item(newItemDicts[i], new ItemView($), $)
        }
    }


    this.read = function(interval, lastCollAction, startTime) {
        console.log("reading collection")
        var startTime = startTime || new Date()

        var thisThing = this
        this.views.startUpdating()

        var incompleteAnswerCallback = function(data){
            console.log("still updating")
            thisThing.title = data.title
            thisThing.alias_tiids = data.alias_tiids
            thisThing.addItemsFromDicts(data.items)

            thisThing.render.call(thisThing)

            var elapsedSeconds = (new Date() - startTime)/1000
            if (elapsedSeconds > 60) { // give up after 1 minute...
                console.log("failed to finish update; giving up after 1 minute")

                analytics.track("Timed out profile load", {
                    "seconds": elapsedSeconds,
                    "collection id": thisThing.id,
                    "number products": data.items.length,
                    "prev collection action": lastCollAction
                })

                thisThing.views.finishUpdating(thisThing.items, "error")

            }
            else {
                console.log("trying again, so far " + elapsedSeconds + " seconds")
                setTimeout(function(){
                    thisThing.read(interval, lastCollAction, startTime)
                }, interval)
            }
        }

        $.ajax({
            url: webapp_root+'/user/'+impactstoryUserId+'/products',
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            statusCode: {
               210: function(data){
                    incompleteAnswerCallback(data)
               },
               200: function(data) {
                   console.log("collection done updating")
                   console.log("sending the last collection action to analytics: ", lastCollAction)


                   var elapsedSeconds = (new Date() - startTime)/1000
                   analytics.track("Completed profile load", {
                        "seconds": elapsedSeconds,
                        "collection id": thisThing.id,
                        "number products": data.items.length,
                        "prev collection action": lastCollAction

                    })

                   thisThing.alias_tiids = data.alias_tiids
                   thisThing.title = data.title
                   thisThing.addItemsFromDicts(data.items)

                   thisThing.render.call(thisThing)
                   thisThing.views.finishUpdating(thisThing.items, "ready")


                   return false;
               },
               404: function(){
                   // add this later when the collection create call is asynch on the server.
                   console.log("got a 404; the collection hasn't been created yet. That's ok, trying again.")
               }
            }
        });
    }


    this.updateTitle = function(newTitle){
        // implement later.
    }

    this.deleteItem = function(tiidToDelete, callbacks) {
        callbacks.start()
        this.update({"tiids": [tiidToDelete]}, "DELETE", callbacks.success)
        return false
    }

    this.addItems = function(itemsToAdd, callbacks) {
        if (!this.userCanEdit(callbacks)) return false
        ISCookies.lastActionUserDidToCollection("add_products")

        this.update({"aliases": itemsToAdd}, "PUT", callbacks.onSuccess)
    }

    this.update = function(payload, httpType, onSuccess){
        /* note this is NOT the same as refreshing metrics on items; it's just
        updating things about the collection itself, like number of items or title.
        See this.refreshItemData() for the former case.
         */

        var url = webapp_root+'/user/'+impactstoryUserId+'/products?'
            + 'api_admin_key='+api_key

        $.ajax({
                   url: url,
                   type: httpType,
                   dataType: "json",
                   contentType: "application/json; charset=utf-8",
                   data:  JSON.stringify(payload),
                   success: function(data){
                       console.log("finished updating the collection!")
                       onSuccess(data)
                   }
               })
    }

    this.refreshItemData = function() {
        var thisThing = this
        this.views.startUpdating()
        $.ajax({
            url: webapp_root+'/user/'+impactstoryUserId+'/products',
            type: "POST",
            data: JSON.stringify({}),
            success: function(data){
               console.log("refreshing collection.")
               thisThing.read(1000, "refresh");
            }});
        }

    this.userCanEdit = function(callbacks){
        // @todo make it so this figures out  status based on vars loaded server-side

        if (!$("body").hasClass("logged-in")) {
            callbacks.onNotLoggedIn()
            return false
        }

        if (!$("body").hasClass("can-edit")) {
            callbacks.onNotOwner()
            return false
        }
        return true
    }



    this.render = function(){
        this.views.renderItems(this.items)
//        this.views.renderTitle(this.title)

    }
}

function CollViews() {
    this.startUpdating = function(){
        $("img.loading").remove()

        $("body.report h2").before(ajaxLoadImg)
        changeControlGroupState(
            $("body.user-profile #num-items"),
            "working"
        )
    }

    this.badgesWeight = function(dict) {
        return _.reduce(dict.awards, function(memo, metric){
            return memo + (metric.isHighly) ? 10 : 1
        }, 0)
    }

    // state is "ready" or "error"  (error if timed out while still loading)
    this.finishUpdating = function(items, state){
        // setup page header
        $("#page-header img").remove()
        changeControlGroupState(
            $("body.user-profile #num-items"),
            state
        )

        console.log("number of items in collection:", _.size(items))
        $("#num-items span.value").text(_.size(items))

        // setup item-level zooming
        $("ul.active li.item div.item-header").addClass("zoomable")
        $("a.item-expand-button")
            .show()
            .css({color: tiLinkColor})
            .fadeOut(1500, function(){
                $(this).removeAttr("style")
            })
    }

    this.renderItems = function(itemObjsDict) {
        var itemObjs = _.values(itemObjsDict)
        var genreList = new GenreList(itemObjs)
        genreList.render()

    }

    this.renderIsEditable = function(isEditable) {
        if (isEditable){
            $("div#report").addClass("editable")
        }
    }

    this.onEditNotOwner = function(){
        $("#edit-not-owner").modal("show")
    }

    this.onEditNotLoggedIn = function() {
        $("#edit-not-logged-in").modal("show")
    }
}


function CollController(coll, collViews) {
    this.coll = coll
    this.collViews = collViews

    this.collReportPageInit = function() {
        this.coll.id = reportId // global loaded by the server
        this.coll.render()

        this.coll.read(1000, ISCookies.lastActionUserDidToCollection()+"")
        ISCookies.lastActionUserDidToCollection(null)
        var that = this


        // refresh all the items
        $("#update-report-button").click(function(){
            analytics.track("Clicked refresh button")
            coll.refreshItemData();
            return false;
        })


        // show/hide all zoom divs
        $("div#num-items a").toggle(
            function(){
                $(this).html("(collapse all)")
                $("li.item").not(".no-data").addClass("zoomed").find("div.zoom").show()
            },
            function(){
                $(this).html("(expand all)")
                $("li.item").not(".no-data").removeClass("zoomed").find("div.zoom").hide()
            }
        )

        // show the import-products dialog when you ask for it
        $("#import-products-button").click(function(){
            var callbacks = {
                onNotLoggedIn: that.collViews.onEditNotLoggedIn,
                onNotOwner: that.collViews.onEditNotOwner
            }
            if (!that.coll.userCanEdit(callbacks)) return false
            $("#import-products-modal").modal("show")
            return false
        })


        // delete items
        $("a.item-delete-button").live("click", function(){
            var item$ = $(this).parents("li.item")

            var callbacks = {
                onNotLoggedIn: that.collViews.onEditNotLoggedIn,
                onNotOwner: that.collViews.onEditNotOwner
            }

            if (!that.coll.userCanEdit(callbacks)) return false

            var callbacks2 = {
                start: function() {item$.slideUp();},
                success: function(data){
                    console.log("deleted, done. blam.", data)
                    $("#num-items span.value").text(_.size(data.alias_tiids))
                },
                onNotLoggedIn: that.collViews.onEditNotLoggedIn,
                onNotOwner: that.collViews.onEditNotOwner
            }

            that.coll.deleteItem( item$.attr("id"), callbacks2)
            return false;
        })
    }

}
