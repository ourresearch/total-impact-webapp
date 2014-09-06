angular.module('services.profileService', [
  'resources.users'
])
  .factory("ProfileService", function(){

    var products
    var about


    return {
      products: products,
      about: about
    }


  })