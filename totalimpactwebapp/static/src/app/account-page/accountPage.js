angular.module('accountPage', [
  'services.page',
  'resources.users',
  'services.loading'

])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when("/:url_slug/account/:account_index_name", {
        templateUrl: 'account-page/account-page.tpl.html',
        controller: 'AccountPageCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          }
        }
      })

  }])

  .controller("AccountPageCtrl", function($scope, $routeParams, userOwnsThisProfile, ProfileService, ProfileAboutService, Page){
    Page.setName($routeParams.account_index_name)

    $scope.templatePath = "account-page/"+ $routeParams.account_index_name  +"-account-page.tpl.html"
    $scope.accountName =  $routeParams.account_index_name
    $scope.account = function(){
      return ProfileService.account_products
    }


  })