angular.module('services.pinboardService', [
  'resources.users'
])
  .factory("PinboardService", function(ProfilePinboard, security){



    var data = {}
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
      var current_user_url_slug = security.getCurrentUserSlug()

      if (!current_user_url_slug){
        return false
      }
      if (saveOnlyIfNotEmpty && isEmpty()){
        return false
      }

      ProfilePinboard.save(
        {id: current_user_url_slug},
        {contents: cols},
        function(resp){
        },
        function(resp){
        }
      )
    }

    function get(id){
      console.log("calling ProfilePinboard.get(" + id + ")", cols, data)
      data.url_slug = id
      ProfilePinboard.get(
        {id: id},
        function(resp){
          cols.one = resp.one
          cols.two = resp.two
        },
        function(resp){
          console.log("no pinboard set yet.")
          clear()
        }
      )
    }

    function clear(){
      cols.one = []
      cols.two = []

      for (var prop in data) { if (data.hasOwnProperty(prop)) { delete data[prop]; } }
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
      saveState: saveState,
      getUrlSlug: function(){
        return data.url_slug
      },
      clear: clear
    }


  })
