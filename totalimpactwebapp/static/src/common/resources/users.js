angular.module('resources.users',['ngResource'])
  .factory('Users', function ($resource) {

    return $resource(
      "/user/:id?id_type=:idType",
      {idType: "userid"},
      {
        update:{
          method: "PUT"
        }
      }
    )
  });
