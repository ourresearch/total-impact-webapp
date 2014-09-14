angular.module('services.pinboardService', [
  'resources.users'
])
  .factory("PinboardService", function(ProfilePinboard, security){


    var cols = {
      one: [],
      two: []
    }

    function selectCol(id){
      return cols[getColName(id)]
    }

    function getColName(id){
      if (id[0] == "product") {
        return "one"
      }
      else {
        return "two"
      }
    }

    function pin(id){
      console.log("pinning this id: ", id)
      selectCol(id).push(id)

      // every time we change the pins arr, we save.

//      ProfilePinboard.save(
//        {id: "HeatherPiwowar"},
//        {pins: pins},
//        function(resp){
//          console.log("success pushing pins", resp)
//        },
//        function(resp){
//          console.log("failure pushing pins", resp)
//        }
//
//      )
    }

    function unPin(id){
      console.log("unpin this!", id)
      cols[getColName(id)] = _.filter(selectCol(id), function(myPinId){
        return !_.isEqual(id, myPinId)
      })
      return true


      // needs to update db here

    }

    function isPinned(id){
      return !!_.find(selectCol(id), function(myPinId){
        return _.isEqual(id, myPinId)
      })
    }


    return {
      cols: cols,
      pin: pin,
      unPin: unPin,
      isPinned: isPinned
    }


  })