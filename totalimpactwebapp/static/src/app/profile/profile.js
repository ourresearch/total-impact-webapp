angular.module("profile", [
  'resources.products',
  'product.product',
  'security'
])



.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.otherwise({
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl'
  });
}])





.controller('ProfileCtrl', [
  '$scope',
  '$location',
  'security',
  'Products',
  'Product',
  function ($scope, $location, security, Products)
  {
    console.log("security: ", security)
    console.log("products:", Products)

    Products.forUser(1).then(function(response){
      $scope.products = response;
    })

    console.log("ProfileCtrl running!")
}]);

