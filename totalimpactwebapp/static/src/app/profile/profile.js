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


    $scope.aboutUser = Users.get({
      id: $location.path().substring(1),
      idType: "slug",
      property: "about"
    })

    $scope.products = Users.query({
      id: $location.path().substring(1),
      idType: "slug",
      property: "products"
    })

    console.log("ProfileCtrl running!")
}]);

