angular.module('resources.user', ['resources.products']);
angular.module('resources.user').factory('User', ['$http', 'Products', function ($http, Products) {

  var User = {};

  User.getById = function(userId, successcb, errorcb) {
    var url = "/user/"+userId;
    var scb = successcb || angular.noop;
    var ecb = errorcb || angular.noop;

    return $http.get(url)
      .then(function(response){
              console.log("got some response data back, it seems: ", response);
              scb(response, status)
              return response.data.items

            })
  };

  return User;
}]);
