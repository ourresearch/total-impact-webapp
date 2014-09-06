angular.module('services.profileService', [
  'resources.users'
])
  .factory("ProfileService", function(){

    var products
    var about
    var genres


    return {
      products: products,
      genres: genres,
      about: about
    }


  })