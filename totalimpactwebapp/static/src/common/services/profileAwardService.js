angular.module('services.profileAwardService', [
  'resources.users'
])
.factory("ProfileAwardService", function($q,
                                         $timeout,
                                         Update,
                                         Users,
                                         ProfileAwards){

  var awards = {}
  var loading = true


  function get(url_slug){
    console.log("calling ProfileAwardService.get() with ", url_slug)

    loading = true
    return ProfileAwards.get(
      {id: url_slug},
      function(resp){
        console.log("ProfileAwards got a response", resp)
        awards.oa = _.findWhere(resp, {name: "Open Access"})
        console.log("awards.oa", awards.oa)
        awards.globalReach = _.findWhere(resp, {name: "Global Reach"})
        console.log("awards.globalReach", awards.globalReach)
        loading = false
      },

      function(resp){
        console.log("ProfileAwards got a failure response", resp)
        if (resp.status == 404){
          // do something? i dunno
        }
        loading = false
      }
    ).$promise
  }

  return {
    get: get,
    awards: awards,
    loading: loading
  }

})