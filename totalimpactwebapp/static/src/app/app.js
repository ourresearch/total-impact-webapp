// setup libs outside angular-land. this may break some unit tests at some point...#problemForLater
// Underscore string functions: https://github.com/epeli/underscore.string
_.mixin(_.str.exports());


angular.module('app', [
  'placeholderShim',
  'services.loading',
  'services.i18nNotifications',
  'services.uservoiceWidget',
  'services.routeChangeErrorHandler',
  'services.page',
  'security',
  'directives.crud',
  'templates.app',
  'templates.common',
  'infopages',
  'signup',
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

  // want to make sure the user profile route loads last, because it's super greedy.
  $routeProvider.when("/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl'
  })
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
                                                     UservoiceWidget,
                                                     $location,
                                                     Loading,
                                                     Page,
                                                     security,
                                                     RouteChangeErrorHandler) {

  $scope.notifications = i18nNotifications;
  $scope.loading = Loading;
  $scope.getPageTitle = Page.getTitle


  $scope.removeNotification = function (notification) {
    i18nNotifications.remove(notification);
  };

  $scope.$on('$routeChangeError', function(event, current, previous, rejection){
    RouteChangeErrorHandler.handle(event, current, previous, rejection)
  });

  $scope.$on('$routeChangeSuccess', function(next, current){ // hacky...
    UservoiceWidget.updateTabPosition($location.path())
  })

  $scope.$on('$locationChangeStart', function(event, next, current){
    Page.showFrame(true, true)
    security.loginFromUrl(next)
    $scope.footer = Page.footer
    $scope.header = Page.header
    $scope.loading.clear()
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
