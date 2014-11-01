angular.module('security.login.toolbar', [
  'ui.bootstrap',
  'services.page',
  'security',
  'resources.users'
  ])

// The loginToolbar directive is a reusable widget that can show login or logout buttons
// and information the current authenticated user
.directive('loginToolbar', function($http, Page, security) {
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
          if (!dismissed && latestMetrics) {
            return true // never hit dismissed before
          }
          else if (dismissed && latestMetrics && latestMetrics > dismissed) {
            return true // new stuff since they last dismissed
          }
          else {
            return false // brand new profile, or no new metrics since dismissal
          }

        }
        else {
          return false
        }

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