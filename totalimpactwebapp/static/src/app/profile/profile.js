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
  '$http',
  'security',
  'Users',
  function ($scope, $location, $http, security, Users)
  {
    console.log("profile controller")
    var userSlug = $location.path().substring(1)
    console.log("path is: ", $location.path())
    console.log("user slug is: ", userSlug)


    $scope.aboutUser = Users.get({
      id: userSlug,
      idType: "slug",
      property: "about"
    })

    $scope.products = Users.query({
      id: userSlug,
      idType: "slug",
      property: "products"
    })

    $scope.currentUserIsProfileOwner = function(){
      if (!security.currentUser) return false
      return (security.currentUser.url_slug == userSlug)
    }



}]);

