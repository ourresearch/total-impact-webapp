angular.module('security.login.toolbar', [
  'ui.bootstrap',
  'services.page',
  'security',
  'resources.users'
  ])

// The loginToolbar directive is a reusable widget that can show login or logout buttons
// and information the current authenticated user
.directive('loginToolbar', function($http, Page, UsersAbout, security) {
  var directive = {
    templateUrl: 'security/login/toolbar.tpl.html',
    restrict: 'E',
    replace: true,
    scope: true,
    link: function($scope, $element, $attrs, $controller) {
      $scope.login = security.showLogin;
      $scope.logout = security.logout;
      $scope.page = Page  // so toolbar can change when you're on  landing page.

      $scope.illuminateNotificationIcon = function(){
        var user = security.getCurrentUser()
        if (user){
          var dismissed = user.new_metrics_notification_dismissed
          var latestMetrics = user.latest_diff_timestamp
          return latestMetrics > dismissed
        }
        else {
          return false
        }

      }

      $scope.dismissProfileNewProductsNotification = function(){

        $http.get("/user/current/notifications/new_metrics_notification_dismissed?action=dismiss").success(function(data, status){
          console.log("new metrics notification dismissed", data.user)
          security.setCurrentUser(data.user)
        })

      }

      $scope.$watch(function() {
        return security.getCurrentUser();
      }, function(currentUser) {
        $scope.currentUser = currentUser;
      });
    }
  };
  return directive;
});