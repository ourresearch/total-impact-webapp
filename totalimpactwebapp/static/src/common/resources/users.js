angular.module('resources.users',['ngResource'])

  .factory('Users', function ($resource) {

    return $resource(
      "/user/:id",
      {},
      {
        query:{
          method: "GET",
          cache: true,
          params: {hide: "metrics,awards,aliases", include_headings: true, embedded: "@embedded"}
        }
      }
    )
  })



  .factory('UserProduct', function ($resource) {

    return $resource(
     "/user/:id/product/:tiid",
     {}
    )
  })


  .factory('UsersProducts', function ($resource) {

    return $resource(
      "/user/:id/products",
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
          params: {hide: "metrics,awards,aliases", include_headings: true, embedded: "@embedded"}
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
      "/user/:id/product/:tiid?id_type=:idType",
      {
        idType: "url_slug"
      },
      {
        update:{
          method: "PUT"
        }
      }
    )
  })

  .factory('UsersUpdateStatus', function ($resource) {
    return $resource(
      "/user/:id/update_status",
      {}, // default params
      {}  // method definitions
    )
  })

  .factory('UsersAbout', function ($resource) {

    return $resource(
      "/user/:id/about?id_type=:idType",
      {idType: "url_slug"},
      {
        patch:{
          method: "POST",
          headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'},
          params:{id:"@about.id"} // use the 'id' property of submitted data obj
        }
      }
    )
  })

  .factory('UsersLinkedAccounts', function($resource){

    return $resource(
      "/user/:id/linked-accounts/:account",
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
      "/user/:id/password?id_type=:idType",
      {idType: "url_slug"}
    )
  })

  .factory("UsersProductsCache", function(UsersProducts){
      var cache = []
      return {
        query: function(){}
      }
    })


  .factory("UsersCreditCard", function($resource){
    return $resource(
      "/user/:id/credit_card/:stripeToken",
      {},
      {}
    )
  })


  .factory("UsersSubscription", function($resource){
    return $resource(
      "/user/:id/subscription",
      {},
      {
        delete: {
          method: "DELETE",
          headers: {'Content-Type': 'application/json'}
        }
      }
    )
  })


