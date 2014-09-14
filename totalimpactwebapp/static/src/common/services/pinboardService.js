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
      saveState()
    }

    function saveState(saveOnlyIfNotEmpty) {
      if (saveOnlyIfNotEmpty && isEmpty()){
        return false
      }

      ProfilePinboard.save(
        {id: security.getCurrentUserSlug()},
        {contents: cols},
        function(resp){
          console.log("success pushing cols", resp)
        },
        function(resp){
          console.log("failure pushing cols", resp)
        }
      )
    }

    function get(id){
      ProfilePinboard.get(
        {id: id},
        function(resp){
          console.log("got a response back from cols GET", resp)
          cols.one = resp.one
          cols.two = resp.two
        },
        function(resp){
          console.log("no pinboard set yet.")
          cols.one.length = 0
          cols.two.length = 0
        }
      )
    }

    function isEmpty(){
      return !cols.one.length && !cols.two.length
    }


    function unPin(id){
      console.log("unpin this!", id)
      cols[getColName(id)] = _.filter(selectCol(id), function(myPinId){
        return !_.isEqual(id, myPinId)
      })
      saveState()
      return true
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
      isPinned: isPinned,
      get: get,
      saveState: saveState
    }


  })