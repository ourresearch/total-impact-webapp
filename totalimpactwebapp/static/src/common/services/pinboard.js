angular.module('services.pinboard', [
  'resources.users'
])
  .factory("Pinboard", function(security){

    function save(data, resource){
      var current_user_url_slug = security.getCurrentUserSlug()
      if (!current_user_url_slug){
        return false
      }

      resource.save(
        {id: current_user_url_slug},
        {contents: data.list},
        function(resp){
          console.log("successfully saved pinboard data", resp, data)
        },
        function(resp){
          console.log("error saving pinboard data", resp, data)
        }
      )
    }

    function isPinned(thingToTest, data){
      if (thingToTest._tiid){
        return !!_.find(data.list, function(product){
          return product._tiid === thingToTest._tiid
        })
      }
    }

    function pinnedThingsAreEqual(a, b){
      if (a._tiid){
        return a._tiid === b._tiid
      }
      else if (a.genre_card_address){
        return a.genre_card_address === b.genre_card_address
      }
    }



    function makeInterface(data, resource){
      return {
        pin: function(thingToPin){
          console.log("pushing this thing to pin it", thingToPin)
          data.list.push(thingToPin)
          save(data, resource)
        },
        get: function(id){
          console.log("calling Pinboard.get(" + id + ")", data)
          data.url_slug = id
          resource.get(
            {id: id},
            function(resp){
              data.list.length = 0
              Array.prototype.push.apply(data.list, resp)
            },
            function(resp){
              console.log("no pinboard set yet.", resp)
            }
          )
        },
        unpin: function(thingToUnpin){
          console.log("unpinning ", thingToUnpin, data)
          data.list =  _.filter(data.list, function(pinnedThing){
            return !pinnedThingsAreEqual(thingToUnpin, pinnedThing)
          })
          save(data, resource)
        },
        isPinned: function(thingToTest){
          return !!_.find(data.list, function(pinnedThing){
            return pinnedThingsAreEqual(thingToTest, pinnedThing)
          })
        },
        clear: function(){
          data.list.length = 0
        },
        data: data
      }
    }


    return {
      makeInterface: makeInterface
    }


  })