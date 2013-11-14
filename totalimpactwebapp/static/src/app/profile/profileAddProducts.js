angular.module('profile.addProducts', [
  'importers.allTheImporters',
  'services.page',
  'importers.importer'
])
angular.module('profile.addProducts')

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when("/:url_slug/products/add", {
        templateUrl: 'profile/profile-add-products.tpl.html',
        controller: 'addProductsCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          }
        }
      })

  }])
  .controller("addProductsCtrl", function($scope, Page, $routeParams, AllTheImporters){
    Page.showFrame(true, false) // hide footer
    $scope.redirectAfterImport = true
    $scope.importers = AllTheImporters.get()
  })