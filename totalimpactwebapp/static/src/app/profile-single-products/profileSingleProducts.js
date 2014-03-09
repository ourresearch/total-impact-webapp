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
    $scope.onCancel = function(){
      security.redirectToProfile()
    }


    $scope.onSubmit = function(){
      Loading.start("saveButton")

      var productIds = _.compact($scope.newlineDelimitedProductIds.split("\n"))

      UsersProducts.patch(
        {id: $routeParams.url_slug},
        {product_id_strings: productIds},
        function(resp){
          console.log("saved some single products!", resp)
          Loading.finish("saveButton")
          security.redirectToProfile()

        },
        function(resp){
          console.log("failed to save new products :(", resp)
          Loading.finish("saveButton")
          alert("Oops! Looks like there was an error importing your products! " +
            "We've logged the error, but please feel free to open a support " +
            "ticket, too (click the orange tab on the right of the screen).")

        }
      )


    }

  })