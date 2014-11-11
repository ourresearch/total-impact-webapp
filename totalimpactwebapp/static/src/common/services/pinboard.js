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
      if (thingToTest){

      }
    }



    function makeInterface(data, resource){
      return {
        pin: function(thingToPin){

          data.list.length = 0

          console.log("pushing this thing to pin it", thingToPin)
          data.list.push(thingToPin)

          console.log("here is the new list", data.list)
          save(data, resource)
        },
        get: function(id){
          console.log("calling Pinboard.get(" + id + ")", data)
          data.url_slug = id
          resource.get(
            {id: id},
            function(resp){
//              data.list = resp
              data.list.length = 0
              Array.prototype.push.apply(data.list, resp)
            },
            function(resp){
              console.log("no pinboard set yet.", resp)
            }
          )
        },
        unpin: function(thingToUnpin){
          data.list =  _.filter(data.list, function(pinnedThing){
            return !_.isEqual(pinnedThing, thingToUnpin)
          })
          save(data, resource)
        },
        isPinned: function(thingToTest) {
          return !!_.find(data.list, function(pinnedThing){
            return _.isEqual(thingToTest, pinnedThing)
          })
        },
        pins: data
      }
    }


    return {
      makeInterface: makeInterface
    }


  })
