angular.module('profileLinkedAccounts', [
  'importers.allTheImporters',
  'services.page',
  'importers.importer'
])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when("/:url_slug/accounts", {
        templateUrl: 'profile/profile-add-products.tpl.html',
        controller: 'addProductsCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          }
        }
      })

  }])
//  .controller("addProductsCtrl", function($scope, Page, $routeParams, AllTheImporters){
//    Page.showHeader(false)
//    $scope.redirectAfterImport = true
//    $scope.importers = AllTheImporters.get()
//  })