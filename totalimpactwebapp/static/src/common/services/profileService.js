angular.module('services.profileService', [
  'resources.users'
])
  .factory("ProfileService", function($q, $timeout, Update, Page, Users){

    var profileObj
    var loading = true

    function get(url_slug){

      if (profileObj){
        return $q.when(profileObj)
      }

      // we're gonna refresh our profile data
      else {
        loading = true
        return Users.get(
          {id: url_slug, embedded: Page.isEmbedded()},
          function(resp){
            console.log("ProfileService got a response", resp)
            profileObj = resp  // cache for future use
            loading = false

            // got the new stuff. but does the server say it's
            // actually still updating there? if so, show
            // updating modal
            Update.showUpdateModal(url_slug, resp.is_refreshing).then(
              function(msg){
                console.log("updater (resolved):", msg)
                get(url_slug)
              },
              function(msg){
                // great, everything's all up-to-date.
              }
            )
          },

          function(resp){
            console.log("ProfileService got a failure response", resp)
            profileObj = null
            loading = false
          }
        ).$promise
      }
    }


    function getCached(){
      return $timeout(function(){
        if (loading){
          return getCached()
        }
        else {
          return profileObj
        }
      })
    }

    function isLoading(){
      return loading
    }

    function getGenreProperty(genreName, genreProperty){
      if (typeof profileObj.genres == "undefined"){
        return undefined
      }
      var genreObj = _.find(profileObj.genres, function(genre){
        return genre[name] == genreName
      })
      return genreObj[genreProperty]
    }

    return {
      profile: profileObj,
      loading: loading,
      isLoading: isLoading,
      get: get,
      getCached: getCached,
      getGenreProperty: getGenreProperty
    }


  })