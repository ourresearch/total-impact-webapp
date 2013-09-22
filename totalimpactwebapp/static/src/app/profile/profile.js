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





.controller('ProfileCtrl', function ($scope, $location, $http, security, UsersAbout, UsersProducts)
  {
    var userSlug = $location.path().substring(1)

    $scope.user = UsersAbout.get({
      id: userSlug,
      idType: "url_slug"
    })

    $scope.products = UsersProducts.query({
      id: userSlug,
      idType: "url_slug"
    })

    $scope.currentUserIsProfileOwner = function(){
      if (!security.currentUser) return false
      return (security.currentUser.url_slug == userSlug)
    }

})


