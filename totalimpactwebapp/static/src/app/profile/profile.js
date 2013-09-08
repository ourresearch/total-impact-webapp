angular.module("profile", [
  'resources.products',
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
  function ($scope, $location, security, Products)
  {
  console.log("security: ", security)
  console.log("products:", Products)

  console.log("ProfileCtrl running!")
}]);

