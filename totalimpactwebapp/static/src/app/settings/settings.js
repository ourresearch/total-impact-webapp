angular.module('settings', [
    'resources.users',
    'services.i18nNotifications',
    'security',
    'directives.forms'])

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

    $scope.resetUser = function(){
      $scope.user = angular.copy(authenticatedUser)
    }
    $scope.resetUser()




    $scope.inputTemplateUrl =  'settings/' + $route.current.section + '-settings.tpl.html'
    $scope.currentSection =  $route.current.section;
    $scope.sections = ['profile', 'password', 'account']

    $scope.home = function(){
      $location.path('/' + authenticatedUser.url_slug);
    }

    $scope.onCancel = function(){
      $scope.resetUser();
      $scope.home();
    }


  })

  .controller('profileSettingsCtrl', function ($scope, UsersAbout, security, i18nNotifications) {
    $scope.onSave = function() {
      $scope.loading = true;
      UsersAbout.patch(
        $scope.user.id,
        {about: $scope.user},
        function(resp) {
          security.currentUser = resp.about; // update the current authenticated user.
          i18nNotifications.pushForNextRoute('settings.profile.change.success', 'success');
          $scope.home();
        }
      )
    };
  })

  .controller('passwordSettingsCtrl', function ($scope, UsersPassword, security, i18nNotifications) {

    $scope.showPassword = false;

    $scope.onSave = function() {
      $scope.loading = true;

      UsersPassword.save(
        {id: $scope.user.id},
        $scope.user,
        function(resp) {
          i18nNotifications.pushForNextRoute('settings.password.change.success', 'success');
          $scope.home()
        },
        function(resp) {
          i18nNotifications.pushForCurrentRoute('settings.password.change.error.unauthenticated', 'danger');
          $scope.loading = false;
          $scope.resetUser();  // reset the form
          $scope.wrongPassword = true;
          scroll(0,0)
        }
      )
    };
  })
