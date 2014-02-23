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
  'directives.jQueryTools',
  'templates.app',
  'templates.common',
  'infopages',
  'signup',
  'passwordReset',
  'profileProduct',
  'profile',
  'settings'
]);

angular.module('app').constant('TEST', {
  baseUrl: 'http://localhost:5000/',
  otherKey: 'value'
});


angular.module('app').config(function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  // want to make sure the user profile route loads last, because it's super greedy.
  $routeProvider.when("/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl'
  })
  $routeProvider.otherwise({
    template:'<div class="no-page"><h2>Whoops!</h2><p>Sorry, this page doesn\'t exist. Perhaps the URL is mistyped?</p></div>'
  });



});


angular.module('app').run(function(security, $window, Page, $location) {
  // Get the current user when the application starts
  // (in case they are still logged in from a previous session)
  security.requestCurrentUser();

  angular.element($window).bind("scroll", function(event) {
    Page.setLastScrollPosition($(window).scrollTop(), $location.path())
  })


});


angular.module('app').controller('AppCtrl', function($scope,
                                                     $window,
                                                     $route,
                                                     i18nNotifications,
                                                     localizedMessages,
                                                     UservoiceWidget,
                                                     $location,
                                                     Loading,
                                                     Page,
                                                     security,
                                                     RouteChangeErrorHandler) {

  $scope.notifications = i18nNotifications;
  $scope.page = Page;
  $scope.loading = Loading;
  UservoiceWidget.insertTabs()
  $scope.isAuthenticated =  security.isAuthenticated



  $scope.removeNotification = function (notification) {
    i18nNotifications.remove(notification);
  };

  $scope.$on('$routeChangeError', function(event, current, previous, rejection){
    RouteChangeErrorHandler.handle(event, current, previous, rejection)
  });

  $scope.$on('$routeChangeSuccess', function(next, current){
    security.requestCurrentUser().then(function(currentUser){
      if (currentUser){
        analytics.identify(currentUser.id, currentUser);
        if (currentUser.url_slug){

        }
      }
      Page.sendPageloadToSegmentio()
    })

  })

  $scope.$on('$locationChangeStart', function(event, next, current){
    Page.showHeader()
    Page.showFooter()
    Page.setUservoiceTabLoc("right")
    Loading.clear()
  })

});


angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'security', 'httpRequestTracker',
  function ($scope, $location, $route, security, httpRequestTracker) {

  $scope.location = $location;


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
