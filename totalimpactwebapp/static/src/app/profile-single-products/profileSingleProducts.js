angular.module('profileSingleProducts', [
  'services.page',
  'resources.users',
  'services.loading'

])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when("/:url_slug/products/add", {
        templateUrl: 'profile-single-products/profile-single-products.tpl.html',
        controller: 'addSingleProductsCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          }
        }
      })

  }])
  .controller("addSingleProductsCtrl", function($scope, Page, $routeParams){
    Page.showHeader(false)
    Page.showFooter(false)

  })
  .controller("ImportSingleProductsFormCtrl", function($scope, $location, $routeParams, $cacheFactory, Loading, UsersProducts, security){

    $scope.newlineDelimitedProductIds = ""
    var $httpDefaultCache = $cacheFactory.get('$http')


    $scope.onSubmit = function(){
      Loading.start("saveButton")

      var productIds = _.compact($scope.newlineDelimitedProductIds.split("\n"))

      UsersProducts.patch(
        {id: $routeParams.url_slug},
        {product_id_strings: productIds},
        function(resp){

          // clear the cache. right now wiping out *everything*. be smart later.
          $httpDefaultCache.removeAll()
          console.log("clearing the cache")
          security.redirectToProfile()

        },
        function(resp){
          console.log("failed to save new products!", resp)

        }
      )


    }

  })