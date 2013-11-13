angular.module('settings', [
    'resources.users',
    'services.loading',
    'directives.spinner',
    'settings.pageDescriptions',
    'services.i18nNotifications',
    'security',
    'directives.forms'])

  .config(function ($routeProvider) {

    $routeProvider.when('/settings/:page',
      {
        templateUrl:'settings/settings.tpl.html',
        controller: "settingsCtrl",
        resolve:{
          authenticatedUser:function (security) {
            return security.requestCurrentUser();
          },
          allowed: function(security){
            return security.testUserAuthenticationLevel("loggedIn")
          }
        }
      }
    )
  })

  .controller('settingsCtrl', function ($scope, $location, authenticatedUser, SettingsPageDescriptions, $routeParams, Loading) {

    $scope.resetUser = function(){
      $scope.user = angular.copy(authenticatedUser)
    }
    $scope.home = function(){
      $location.path('/' + authenticatedUser.url_slug);
    }
    $scope.isCurrentPath = function(path) {
      return path == $location.path();
    }

    $scope.onCancel = function(){
      $scope.resetUser();
      $scope.home();
    }

    $scope.testClick = function(formCtrl){
      formCtrl.$setPristine()
    }

    var currentPageDescr = SettingsPageDescriptions.getDescrFromPath($location.path());
    console.log(currentPageDescr)

    $scope.resetUser()
    Loading.finish()
    $scope.include =  currentPageDescr.templatePath;
    $scope.authenticatedUser = authenticatedUser;
    $scope.pageDescriptions = SettingsPageDescriptions.get();

  })

  .controller('profileSettingsCtrl', function ($scope, UsersAbout, security, i18nNotifications, Loading) {
    $scope.onSave = function() {
      Loading.start('saveButton')
      UsersAbout.patch(
        {id: $scope.user.url_slug},
        {about: $scope.user},
        function(resp) {
          security.currentUser = resp.about; // update the current authenticated user.
          i18nNotifications.pushForNextRoute('settings.profile.change.success', 'success');
          $scope.home();
        }
      )
    };
  })

  .controller('passwordSettingsCtrl', function ($scope, UsersPassword, security, i18nNotifications, Loading) {

    $scope.showPassword = false;

    $scope.onSave = function() {
      Loading.start('saveButton')

      UsersPassword.save(
        {id: $scope.user.url_slug},
        $scope.user,
        function(resp) {
          i18nNotifications.pushForNextRoute('settings.password.change.success', 'success');
          $scope.home()
        },
        function(resp) {
          i18nNotifications.pushForCurrentRoute('settings.password.change.error.unauthenticated', 'danger');
          Loading.finish('saveButton')
          $scope.resetUser();  // reset the form
          $scope.wrongPassword = true;
          scroll(0,0)
        }
      )
    };
  })



  .controller('urlSettingsCtrl', function ($scope, UsersAbout, security, $location, i18nNotifications, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      UsersAbout.patch(
        {id: $scope.user.id, idType:"userid"},
        {about: $scope.user},
        function(resp) {
          security.currentUser = resp.about; // update the current authenticated user.
          i18nNotifications.pushForNextRoute('settings.url.change.success', 'success');
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })



  .controller('emailSettingsCtrl', function ($scope, UsersAbout, security, $location, i18nNotifications, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      UsersAbout.patch(
        {id: $scope.user.url_slug},
        {about: $scope.user},
        function(resp) {
          security.currentUser = resp.about; // update the current authenticated user.
          i18nNotifications.pushForNextRoute(
            'settings.email.change.success',
            'success',
            {email: resp.about.email}
          );
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })
