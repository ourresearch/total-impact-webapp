angular.module('services.profileAboutService', [
  'resources.users'
])
  .factory("ProfileAboutService", function($q, $timeout, Update, Page, Users, ProfileAbout){

    var loading = true
    var data = {}


    function get(url_slug, getFromServer){
      console.log("calling ProfileAboutService.get() with ", url_slug)
      if (data && !getFromServer && !loading){
        return $q.when(data)
      }


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

    function upload(){
      console.log("calling ProfileAboutService.upload() with ", data.url_slug)

      Users.patch(
        {id: data.url_slug},
        {about: data},
        function(resp){
          console.log("ProfileAboutService.upload() returned success", resp)
        },
        function(resp){
          console.log("ProfileAboutService.upload() returned failure", resp)
        }
      )

    }


    return {
      get: get,
      upload: upload,
      data: data
    }

  })