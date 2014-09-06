angular.module('resources.users',['ngResource'])

  .factory('Users', function ($resource) {

    return $resource(
      "/profile/:id",
      {},
      {
        query:{
          method: "GET",
          params: {embedded: "@embedded"}
        },
        patch:{
          method: "POST",
          headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'},
          params:{id:"@about.id"} // use the 'id' property of submitted data obj
        }
      }
    )
  })



  .factory("ProfileWithoutProducts", function($resource){
    return $resource(
      "/profile-without-products/:profile_id"
    )
  })



  .factory('UserProduct', function ($resource) {

    return $resource(
     "/profile/:id/product/:tiid",
     {
          cache: false      
     }
    )
  })


  .factory('UsersProducts', function ($resource) {

    return $resource(
      "/profile/:id/products",
      {
        // default params go here
      },
      {
        update:{
          method: "PUT"
        },
        patch: {
          method: "POST",
          headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'}

        },
        delete: {
          method: "DELETE",
          headers: {'Content-Type': 'application/json'}
        },
        query:{
          method: "GET",
          isArray: true,
          cache: true,
          params: {hide: "metrics,awards,aliases", embedded: "@embedded"}
        },
        poll:{
          method: "GET",
          isArray: true,
          cache: false
        },
        refresh: {
          method: "POST"
        },
        dedup: {
          method: "POST",
          params: {action: "deduplicate"}
        }
      }
    )
  })
  .factory('UsersProduct', function ($resource) {

    return $resource(
      "/profile/:id/product/:tiid",
      {},  // defaults go here
      {
        update:{
          method: "PUT"
        }
      }
    )
  })

  .factory('UsersUpdateStatus', function ($resource) {
    return $resource(
      "/profile/:id/refresh_status",
      {}, // default params
      {}  // method definitions
    )
  })


  .factory('UsersLinkedAccounts', function($resource){

    return $resource(
      "/profile/:id/linked-accounts/:account",
      {},
      {
        update:{
          method: "POST",
          params: {action: "update"}
        }
      }

    )


  })

  .factory('UsersPassword', function ($resource) {

    return $resource(
      "/profile/:id/password",
      {} // defaults
    )
  })

  .factory("UsersProductsCache", function(UsersProducts){
      var cache = []
      return {
        query: function(){}
      }
    })


  .factory("UsersSubscription", function($resource){
    return $resource(
      "/profile/:id/subscription",
      {
        token: null,
        coupon: null,
        plan: "base-yearly"
      },
      {
        delete: {
          method: "DELETE",
          headers: {'Content-Type': 'application/json'}
        }
      }
    )
  })


