angular.module('services.pinboardService', [
  'resources.users'
])
  .factory("PinboardService", function(ProfilePinboard, security){
    var cols = [[], []]

    function pin(type, id){
      console.log("pin this here thing:", type, id)
      var myPin = {
        type: type,
        id: id,
        timestamp: moment.utc().toISOString()
      }
      cols[0].push(myPin)

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

    function removeIdFromList(id, list){
      console.log("unpin this ID: ", id)
      var indexToRemove = -1
      for (var i=0; i<list.length; i++){
        if (_.isEqual(list[i].id, id)) {
          indexToRemove = i
        }
      }
      if (indexToRemove > -1){
        list.splice(indexToRemove, 1)
        return true
      }
      else {
        return false
      }
    }

    function idIsInList(pinId, list){
      return !!_.find(list, function(myPin){
        return _.isEqual(myPin.id, pinId)
      })
    }

    function unPin(pinId){
      _.each(cols, function(colList){
        removeIdFromList(pinId, colList)
      })
    }

    function idIsPinned(pinId){
      var isInCols = false
      _.each(cols, function(colList){
        if (idIsInList(pinId, colList)){
          isInCols = true
        }
      })
      return isInCols
    }


    return {
      cols: cols,
      pin: pin,
      unPin: unPin,
      idIsPinned: idIsPinned
    }


  })