angular.module('services.profileAboutService', [
  'resources.users'
])
  .factory("ProfileAboutService", function($q, $timeout, Update, Page, ProfileAbout){

    var loading = true
    var data = {}


    function get(url_slug){
      console.log("calling ProfileAboutService.get()")

      loading = true
      return ProfileAbout.get(
        {id: url_slug},
        function(resp){
          console.log("ProfileAbout got a response", resp)
          _.each(data, function(v, k){delete data[k]})
          angular.extend(data, resp)
          loading = false
        },

        function(resp){
          console.log("ProfileService got a failure response", resp)
          loading = false
        }
      ).$promise
    }


    return {
      get: get,
      data: data
    }

  })