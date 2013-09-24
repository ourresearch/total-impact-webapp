angular.module("profile", [
  'resources.users',
  'product.product',
  'ui.bootstrap',
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
    $scope.showProductsWithoutMetrics = false;

    $scope.getProducts = function(type) {

      var productsWithMetrics = _.filter($scope.products, function(x){return _.size(x.metrics) })
      var productsWitoutMetrics = _.filter($scope.products, function(x){return x.metrics && _.size(x.metrics)==0 })
      var pseudoProducts = _.filter($scope.products, function(x){return !x.metrics })

      if (type == "withMetrics") {
        return productsWithMetrics
      }
      else if (type === "withoutMetrics") {
        return productsWitoutMetrics
      }
      else {
        return productsWithMetrics.concat(productsWitoutMetrics);
      }
    }


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


