angular.module('services.pinboardService', [
  'resources.users'
])
  .factory("PinboardService", function(ProfilePinboard, security){


    return {}

    var cols = {
      one: [],
      two: []
    }

    function selectCol(id){
      if (id[0] == "product") {
        return cols.one
      }
      else {
        return cols.two
      }
    }

    function pin(id){
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
      var col = selectCol(id)
      col = _.without(col, id)

      // needs to update db here

    }

    function isPinned(id){
      _.contains(selectCol(id), id)

    }


    return {
      cols: cols,
      pin: pin,
      unPin: unPin,
      isPinned: isPinned
    }


  })