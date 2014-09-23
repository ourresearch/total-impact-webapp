angular.module('services.profileAboutService', [
  'resources.users'
])
  .factory("ProfileAboutService", function($q, $timeout, Update, Users, ProfileAbout){

    var loading = true
    var data = {}


    function get(url_slug, getFromServer){
      if (data && !getFromServer && !loading){
        return $q.when(data)
      }


      loading = true
      return ProfileAbout.get(
        {id: url_slug},
        function(resp){
          console.log("ProfileAbout got a response", resp)
          _.each(data, function(v, k){delete data[k]})
          angular.extend(data, resp)  // this sets the url_slug too
          loading = false
        },

        function(resp){
          console.log("ProfileService got a failure response", resp)
          loading = false
        }
      ).$promise
    }

    function clear(){
      // from http://stackoverflow.com/questions/684575/how-to-quickly-clear-a-javascript-object
      for (var prop in data) { if (data.hasOwnProperty(prop)) { delete data[prop]; } }
    }


    function upload(){
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

    function slugIsNew(slug){
        return slug && data.url_slug !== slug
    }


    return {
      get: get,
      upload: upload,
      data: data,
      clear: clear,
      getUrlSlug: function(){
        return data.url_slug
      },
      slugIsNew: slugIsNew
    }

  })