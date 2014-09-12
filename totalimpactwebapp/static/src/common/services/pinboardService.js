angular.module('services.pinboardService', [
  'resources.users'
])
  .factory("PinboardService", function(ProfilePinboard, security){
    var pins = []

    function pin(type, id){
      console.log("pin this here thing:", type, id)
      var myPin = {
        type: type,
        id: id,
        timestamp: moment.utc().toISOString()
      }
      pins.push(myPin)

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
      console.log("unpin this ID: ", id)
      var indexToRemove = -1
      for (var i=0; i<pins.length; i++){
        if (_.isEqual(pins[i].id, id)) {
          indexToRemove = i
        }
      }
      if (indexToRemove > -1){
        pins.splice(indexToRemove, 1)
        return true
      }
      else {
        return false
      }
    }

    function idIsPinned(pinId){
      return !!_.find(pins, function(myPin){
        return _.isEqual(myPin.id, pinId)
      })
    }


    return {
      pins: pins,
      pin: pin,
      unPin: unPin,
      idIsPinned: idIsPinned
    }


  })