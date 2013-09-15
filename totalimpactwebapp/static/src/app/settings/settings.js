angular.module('settings', ['resources.users', 'security'])

  .config(function ($routeProvider) {


    var routeParams = function(section){
      return {
        templateUrl:'settings/settings.tpl.html',
        section: section,
        controller: "settingsCtrl",
        resolve:{
          currentUser:function (security) {
            return security.requestCurrentUser()
          }
        }
      }
    }

    $routeProvider
      .when('/settings/profile', routeParams("profile"))
      .when('.settings/password', routeParams('password'))
      .when('.settings/account', routeParams('account'))
  })

  .controller('settingsCtrl', function ($scope, $location, currentUser, $route, security) {
    $scope.currentUser = currentUser;
    $scope.inputTemplateUrl =  'settings/' + $route.current.section + '-settings.tpl.html'
    $scope.currentSection =  $route.current.section;
    $scope.sections = ['profile', 'password', 'account']

    var home = function(){
      $location.path('/' + security.currentUser.url_slug);

    }

    $scope.onCancel = function(){home()}

    $scope.onSave = function(user) {
//      i18nNotifications.pushForNextRoute('crud.project.save.success', 'success', {id : project.$id()});
      home();
    };
  });
