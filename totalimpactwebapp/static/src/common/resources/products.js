angular.module('resources.products', []);
angular.module('resources.products').factory('Products', ['$http', function ($http) {

  var Products = {};

  Products.forUser = function(userId, successcb, errorcb) {
    var url = "/user/"+userId+"/products";
    var scb = successcb || angular.noop;
    var ecb = errorcb || angular.noop;

    return $http.get(url)
      .then(function(response){
        console.log("got some response data back, it seems: ", response);
        scb(response, status)
        return response.data.items

      })
  };

  Products.isProductOwner = function (userId) {
    return this.productOwner === userId;
  };


  return Products;
}]);
