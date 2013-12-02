angular.module('resources.users',['ngResource'])

  .factory('Users', function ($resource) {

    return $resource(
      "/user/:id?id_type=:idType",
      {idType: "userid"}
    )
  })

  .factory('UsersProducts', function ($resource) {

    return $resource(
      "/user/:id/products?id_type=:idType&include_heading_products=:includeHeadingProducts",
      {
        idType: "url_slug",
        includeHeadingProducts: false
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