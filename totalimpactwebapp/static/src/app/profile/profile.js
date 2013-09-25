angular.module("profile", [
  'resources.users',
  'product.product',
  'ui.bootstrap',
  'security'
])


.factory('UserProfile', function(UsersAbout, security){
  return {
    filterProducts: function(products, filterBy) {
      var productsWithMetrics = _.filter(products, function(x){return _.size(x.metrics); });
      var productsWitoutMetrics = _.filter(products, function(x){return x.metrics && _.size(x.metrics)==0; });
      var pseudoProducts = _.filter(products, function(x){return !x.metrics; });

      if (filterBy == "withMetrics") {
        return productsWithMetrics;
      }
      else if (filterBy === "withoutMetrics") {
        return productsWitoutMetrics;
      }
      else {
        return productsWithMetrics.concat(productsWitoutMetrics);
      }
    },
    getUser: function($scope, slug) {
      console.log("getUser")
      return UsersAbout.get(
        {
          id: slug,
          idType: "url_slug"
        },
        function(resp) {}, // success callback
        function(resp) {
          if (resp.status == 404) {
            $scope.userExists = false;
            $scope.slug = slug;
          }
        }
      );
    },
    slugIsCurrentUser: function(slug){
      if (!security.currentUser) return false;
      return (security.currentUser.url_slug == slug);
    }
  }
})



.config(['$routeProvider', function ($routeProvider) {

  $routeProvider.when("/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl'
  });

}])





.controller('ProfileCtrl', function ($scope, $routeParams, $http, UsersProducts, Product, UserProfile)
  {
    var userSlug = $routeParams.url_slug;
    $scope.userExists = true;
    $scope.showProductsWithoutMetrics = false;
    $scope.filterProducts =  UserProfile.filterProducts;
    $scope.user = UserProfile.getUser($scope, userSlug);
    $scope.currentUserIsProfileOwner = UserProfile.slugIsCurrentUser(userSlug);



    $scope.getBadgeCount = function(product) {
      return Product.getBadgeCount(product) * -1;
    }

    $scope.getGenre = function(product) {
      return Product.getGenre(product);
    }

    $scope.products = UsersProducts.query({
      id: userSlug,
      includeHeadingProducts: true,
      idType: "url_slug"
    });

});


