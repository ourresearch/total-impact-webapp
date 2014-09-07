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

    function genreLookup(url_representation){
      if (typeof profileObj.genres == "undefined"){
        return undefined
      }
      else {
        var res = _.findWhere(profileObj.genres, {url_representation: url_representation})
        return res
      }
    }

    function productsByGenre(url_representation){
      if (typeof profileObj.products == "undefined"){
        return undefined
      }
      else {
        var genreCanonicalName = genreLookup(url_representation).name
        var res = _.where(profileObj.products, {genre: genreCanonicalName})
        return res
      }
    }


    return {
      profile: profileObj,
      loading: loading,
      isLoading: isLoading,
      get: get,
      getCached: getCached,
      productsByGenre: productsByGenre,
      genreLookup: genreLookup
    }


  })