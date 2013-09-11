angular.module("profile", [
  'resources.users',
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
  'Users',
  function ($scope, $location, security, Users)
  {

    $scope.user = Users.get({id: "JasonPriem", idType: "slug"})

    console.log("ProfileCtrl running!")
}]);

