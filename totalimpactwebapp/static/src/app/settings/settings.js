angular.module('settings', ['resources.users', 'security', 'directives.pwMatch'])

  .config(function ($routeProvider) {


    var routeParams = function(section){
      return {
        templateUrl:'settings/settings.tpl.html',
        section: section,
        controller: "settingsCtrl",
        resolve:{
          authenticatedUser:function (security) {
            return security.requestCurrentUser();
          }
        }
      }
    }

    $routeProvider
      .when('/settings/profile', routeParams("profile"))
      .when('/settings/password', routeParams('password'))
      .when('/settings/account', routeParams('account'))
  })

  .controller('settingsCtrl', function ($scope, $location, authenticatedUser, UsersAbout, $route) {
    $scope.authenticatedUser = authenticatedUser;
    $scope.user = angular.copy(authenticatedUser)



    $scope.inputTemplateUrl =  'settings/' + $route.current.section + '-settings.tpl.html'
    $scope.currentSection =  $route.current.section;
    $scope.sections = ['profile', 'password', 'account']

    $scope.home = function(){
      $location.path('/' + authenticatedUser.url_slug);
    }

  })

  .controller('profileSettingsCtrl', function ($scope, UsersAbout, security) {
    $scope.onSave = function() {
//      i18nNotifications.pushForNextRoute('crud.project.save.success', 'success', {id : project.$id()});
      $scope.home();
      UsersAbout.patch(
        $scope.user.id,
        {about: $scope.user},
        function(resp) {
          security.currentUser = resp.about; // update the current authenticated user.
        }
      )
    };
  })

  .controller('passwordSettingsCtrl', function ($scope, UsersPassword, security) {
    $scope.onSave = function() {
      UsersPassword.save(
        {id: $scope.user.id},
        $scope.user,
        function(resp) {
//        i18nNotifications.pushForNextRoute('crud.project.save.success', 'success', {id : project.$id()});
          console.log("password changed!")
//          $scope.home()
        },
        function(resp) {
          console.log("crap, something done broke.")
        }

      )


    };
  })
