angular.module('profileLinkedAccounts', [
  'accounts.allTheAccounts',
  'services.page',
  'accounts.account',
  'resources.users'
])

  .config(['$routeProvider', function($routeProvider, UserAbout) {

    $routeProvider
      .when("/:url_slug/accounts", {
        templateUrl: 'profile-linked-accounts/profile-linked-accounts.tpl.html',
        controller: 'profileLinkedAccountsCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          },
          currentUser: function(security){
            return security.requestCurrentUser()
          }
        }
      })

  }])
  .controller("profileLinkedAccountsCtrl", function($scope,
                                                    Page,
                                                    $routeParams,
                                                    AllTheAccounts,
                                                    ProfileService,
                                                    ProfileAboutService,
                                                    currentUser){


    ProfileAboutService.get($routeParams.url_slug)
    ProfileService.get($routeParams.url_slug)
    $scope.url_slug = $routeParams.url_slug


    console.log("linked accounts page. current user: ", currentUser)
    $scope.accounts = AllTheAccounts.get(currentUser)
    $scope.returnLink = "/"+$routeParams.url_slug



  })