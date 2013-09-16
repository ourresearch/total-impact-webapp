angular.module('settings', ['resources.users', 'security'])

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
      .when('.settings/password', routeParams('password'))
      .when('.settings/account', routeParams('account'))
  })

  .controller('settingsCtrl', function ($scope, $location, authenticatedUser, UsersAbout, $route, security) {
    $scope.authenticatedUser = authenticatedUser;
    $scope.user = angular.copy(authenticatedUser)



    $scope.inputTemplateUrl =  'settings/' + $route.current.section + '-settings.tpl.html'
    $scope.currentSection =  $route.current.section;
    $scope.sections = ['profile', 'password', 'account']

    var home = function(){
      $location.path('/' + authenticatedUser.url_slug);

    }

    $scope.onCancel = function(){home()}

    $scope.onSave = function() {
//      i18nNotifications.pushForNextRoute('crud.project.save.success', 'success', {id : project.$id()});
      home();
      UsersAbout.patch(
        $scope.user.id,
        {about: $scope.user},
        function(resp) {
          console.log("got this back: ", resp.about)
          security.currentUser = resp.about; // update the current authenticated user.
        }
      )


    };
  });
