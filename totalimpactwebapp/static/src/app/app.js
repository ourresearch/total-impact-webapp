angular.module('app', [
  'services.loading',
  'services.i18nNotifications',
  'services.uservoiceWidget',
  'services.routeChangeErrorHandler',
  'security',
  'directives.crud',
  'templates.app',
  'templates.common',
  'signup',
  'infopages', // comes before profile, so '/about' isn't routed as a user named About.
  'profileProduct',
  'profile',
  'settings'
]);

angular.module('app').constant('TEST', {
  baseUrl: 'http://localhost:5000/',
  otherKey: 'value'
});


angular.module('app').config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider.otherwise({
    template:'<div class="no-page"><h2>Whoops!</h2><p>Sorry, this page doesn\'t exist. Perhaps the URL is mistyped?</p></div>'
  });
}]);


angular.module('app').run(['security', function(security) {
  // Get the current user when the application starts
  // (in case they are still logged in from a previous session)
  security.requestCurrentUser();
}]);


angular.module('app').controller('AppCtrl', function($scope,
                                                     i18nNotifications,
                                                     localizedMessages,
                                                     $rootScope,
                                                     UservoiceWidget,
                                                     $location,
                                                     Loading,
                                                     RouteChangeErrorHandler) {

  $scope.notifications = i18nNotifications;
  $scope.loading = Loading;
  $rootScope.showHeaderAndFooter = true;

  $scope.removeNotification = function (notification) {
    i18nNotifications.remove(notification);
  };

  $scope.$on('$routeChangeError', function(event, current, previous, rejection){
    RouteChangeErrorHandler.handle(event, current, previous, rejection)
  });

  $scope.$on('$routeChangeSuccess', function(next, current){
    UservoiceWidget.updateTabPosition($location.path())
    $rootScope.showHeaderAndFooter = true;
  })

});


angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'security', 'httpRequestTracker',
  function ($scope, $location, $route, security, httpRequestTracker) {

  $scope.location = $location;
  $scope.isAuthenticated = security.isAuthenticated;

  $scope.home = function () {
    console.log("home!")
    if (security.isAuthenticated()) {
      $location.path('/' + security.requestCurrentUser().url_slug);
    } else {
      $location.path('/');
    }
  };

  $scope.hasPendingRequests = function () {
    return httpRequestTracker.hasPendingRequests();
  };
}]);
