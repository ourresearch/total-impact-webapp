angular.module('settings', [
    'resources.users',
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
          }
        }
      }
    )
  })

  .controller('settingsCtrl', function ($scope, $location, authenticatedUser, SettingsPageDescriptions, $routeParams) {

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

    $scope.setLoading = function(formName, loading){
      $scope.loading[formName] = loading
    }

    var currentPageDescr = SettingsPageDescriptions.getDescrFromPath($location.path());
                console.log(currentPageDescr)

    $scope.resetUser()
    $scope.loading = {};
    $scope.include =  currentPageDescr.templatePath;
    $scope.authenticatedUser = authenticatedUser;
    $scope.pageDescriptions = SettingsPageDescriptions.get();

  })

  .controller('profileSettingsCtrl', function ($scope, UsersAbout, security, i18nNotifications) {
    $scope.onSave = function() {
      $scope.setLoading("userProfileForm", true)
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
      $scope.setLoading("userPasswordForm", true)

      UsersPassword.save(
        {id: $scope.user.id},
        $scope.user,
        function(resp) {
          i18nNotifications.pushForNextRoute('settings.password.change.success', 'success');
          $scope.home()
        },
        function(resp) {
          i18nNotifications.pushForCurrentRoute('settings.password.change.error.unauthenticated', 'danger');
          $scope.setLoading("userPasswordForm", false)
          $scope.resetUser();  // reset the form
          $scope.wrongPassword = true;
          scroll(0,0)
        }
      )
    };
  })



  .controller('urlSettingsCtrl', function ($scope, UsersAbout, security, $location, i18nNotifications) {

     $scope.onSave = function() {
      $scope.setLoading("userUrlForm", true)
      UsersAbout.patch(
        $scope.user.id,
        {about: $scope.user},
        function(resp) {
          security.currentUser = resp.about; // update the current authenticated user.
          i18nNotifications.pushForNextRoute('settings.url.change.success', 'success');
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })



  .controller('emailSettingsCtrl', function ($scope, UsersAbout, security, $location, i18nNotifications) {

     $scope.onSave = function() {
      $scope.setLoading("userEmailForm", true)
      UsersAbout.patch(
        $scope.user.id,
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
