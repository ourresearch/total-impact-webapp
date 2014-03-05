angular.module('profileSingleProducts', [
  'services.page'
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
  .controller("ImportSingleProductsFormCtrl", function($scope, Page, $routeParams){
    $scope.onSubmit = function(){
      console.log("form submitted, yo; we'll send it to ", $routeParams.url_slug)
    }

  })