angular.module("profile", [
  'resources.users',
  'product.product',
  'security'
])



.config(['$routeProvider', function ($routeProvider) {

  $routeProvider.when("/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl'
  });

  $routeProvider.when("/foo", {
    template:'<h1>I am the foo page. Groovy!</h1>'
  });


}])





.controller('ProfileCtrl', function ($scope, $routeParams, $http, security, UsersAbout, UsersProducts)
  {
    var userSlug = $routeParams.url_slug;
    $scope.userExists = true;

    console.log(userSlug)

    $scope.user = UsersAbout.get({
      id: userSlug,
      idType: "url_slug"
    },
    function(resp) {}, // success callback
    function(resp) {
      if (resp.status == 404) {
        $scope.userExists = false;
        $scope.slug = userSlug;
      }
    }
    )

    $scope.products = UsersProducts.query({
      id: userSlug,
      idType: "url_slug"
    })

    $scope.currentUserIsProfileOwner = function(){
      if (!security.currentUser) return false
      return (security.currentUser.url_slug == userSlug)
    }

})


