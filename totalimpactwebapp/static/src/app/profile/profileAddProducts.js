angular.module('profile.addProducts', [
  'importers.allTheImporters',
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
            return security.currentUserOwnsThisProfile()
          }
        }
      })

  }])
  .controller("addProductsCtrl", function($scope, $routeParams, AllTheImporters){
    $scope.redirectAfterImport = true
    $scope.importers = AllTheImporters.get()
  })