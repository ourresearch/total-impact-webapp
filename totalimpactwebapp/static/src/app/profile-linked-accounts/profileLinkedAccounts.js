angular.module('profileLinkedAccounts', [
  'importers.allTheImporters',
  'services.page',
  'importers.importer'
])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when("/:url_slug/accounts", {
        templateUrl: 'profile-linked-accounts/profile-linked-accounts.tpl.html',
        controller: 'profileLinkedAccountsCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          }
        }
      })

  }])
  .controller("profileLinkedAccountsCtrl", function($scope, Page, $routeParams, AllTheImporters){

    console.log("controller done ran!")

    Page.showHeader(false)
    Page.showFooter(false)
    $scope.importers = AllTheImporters.get()
  })