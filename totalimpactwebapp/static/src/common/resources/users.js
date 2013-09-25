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
        idType: "userid",
        includeHeadingProducts: false
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
      {idType: "userid"},
      {
        patch:{
          method: "PATCH",
          params:{id:"@about.id"}
        }
      }
    )
  })

  .factory('UsersPassword', function ($resource) {

    return $resource(
      "/user/:id/password?id_type=:idType",
      {idType: "userid"}
    )
  })
