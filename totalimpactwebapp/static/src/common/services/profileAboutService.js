angular.module('services.profileAboutService', [
  'resources.users'
])
  .factory("ProfileAboutService", function($q, $timeout, $location, Update, Users, ProfileAbout){

    var loading = true
    var data = {}


    function get(url_slug){
      console.log("calling ProfileAboutService.get() with ", url_slug)

      loading = true
      return ProfileAbout.get(
        {id: url_slug},
        function(resp){
          console.log("ProfileAbout got a response", resp)

          if (url_slug.toLowerCase() == resp.url_slug.toLowerCase() && url_slug !== resp.url_slug
            ){
            var currentPath = $location.path()
            var redirectTo = currentPath.replace(url_slug, resp.url_slug)
            $location.path(redirectTo)
          }

          _.each(data, function(v, k){delete data[k]})
          angular.extend(data, resp)  // this sets the url_slug too
          loading = false
        },

        function(resp){
          console.log("ProfileAboutService got a failure response", resp)
          if (resp.status == 404){
            data.is404 = true
          }
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
      if (!data || !data.url_slug){
        return true
      }
      return data.url_slug.toLocaleLowerCase() !== slug.toLocaleLowerCase()
    }

    function handleSlug(profileServices, newSlug){
      console.log("refreshing the profile with new slug", newSlug)

      // handle new slugs; we need to load a whole new profile
      if (slugIsNew(newSlug)){
        _.each(profileServices, function(service){
          service.clear()
          if (!service.handleSlug){ // don't run the ProfileAboutService here, we need to return it.
            service.get(newSlug)
          }
        })
        return get(newSlug)
      }

      // this is the same profile; don't nothin' change.
      else {
       return $q.when(data)
      }


    }


    return {
      get: get,
      upload: upload,
      data: data,
      clear: clear,
      getUrlSlug: function(){
        return data.url_slug
      },
      slugIsNew: slugIsNew,
      handleSlug: handleSlug
    }

  })