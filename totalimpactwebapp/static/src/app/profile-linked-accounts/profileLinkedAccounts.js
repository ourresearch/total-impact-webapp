angular.module('profileLinkedAccounts', [
  'accounts.allTheAccounts',
  'services.page',
  'accounts.account'
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
  .controller("profileLinkedAccountsCtrl", function($scope, Page, $routeParams, AllTheAccounts){


    Page.showHeader(false)
    Page.showFooter(false)
    $scope.accounts = AllTheAccounts.get()
    $scope.returnLink = "/"+$routeParams.url_slug



  })