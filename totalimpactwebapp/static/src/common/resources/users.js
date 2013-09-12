angular.module('resources.users',['ngResource'])
  .factory('Users', function ($resource) {

    return $resource(
      "/user/:id/:property?id_type=:idType",
      {
        idType: "userid",
        property: "about" // can be "about" or "products"
      },
      {
        update:{
          method: "PUT"
        }
      }
    )
  });
