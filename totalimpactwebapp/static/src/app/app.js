// setup libs outside angular-land. this may break some unit tests at some point...#problemForLater
// Underscore string functions: https://github.com/epeli/underscore.string
_.mixin(_.str.exports());


angular.module('app', [
  'placeholderShim',
  'ngCookies',
  'ngRoute',
  'ngSanitize',
  'ngEmbedApp',
  'ngAnimate',
  'emguo.poller',
  'services.loading',
  'services.userMessage',
  'services.uservoiceWidget',
  'services.routeChangeErrorHandler',
  'services.page',
  'services.tiMixpanel',
  'security',
  'directives.crud',
  'directives.jQueryTools',
  'templates.app',
  'templates.common',
  'infopages',
  'signup',
  'passwordReset',
  'productPage',
  'profile',
  'settings',
  'xeditable'
]);

angular.module('app').constant('TEST', {
  baseUrl: 'http://localhost:5000/',
  otherKey: 'value'
});


angular.module('app').config(function ($routeProvider,
                                       $sceDelegateProvider,
                                       $locationProvider) {
  $locationProvider.html5Mode(true);

  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow google docs embedding.  Notice the difference between * and **.
    'http://docs.google.com/**',
    'http://www.slideshare.net/**'

  ]);



  // want to make sure the user profile route loads last, because it's super greedy.
  $routeProvider.when("/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl',
    reloadOnSearch: false
  })
  $routeProvider.otherwise({
    template:'<div class="no-page"><h2>Whoops!</h2><p>Sorry, this page doesn\'t exist. Perhaps the URL is mistyped?</p></div>'
  });



});


angular.module('app').run(function(security, $window, Page, $location, editableOptions) {
  // Get the current user when the application starts
  // (in case they are still logged in from a previous session)
  security.requestCurrentUser();

  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

  angular.element($window).bind("scroll", function(event) {
    Page.setLastScrollPosition($(window).scrollTop(), $location.path())
  })

});


angular.module('app').controller('AppCtrl', function($scope,
                                                     $window,
                                                     $route,
                                                     $sce,
                                                     UserMessage,
                                                     UservoiceWidget,
                                                     $location,
                                                     Loading,
                                                     Page,
                                                     security,
                                                     $rootScope,
                                                     TiMixpanel,
                                                     RouteChangeErrorHandler) {


  $scope.userMessage = UserMessage
  $rootScope.security = security

  security.requestCurrentUser().then(function(currentUser){

    console.log("got the current user: ", currentUser)

    if (!currentUser){
      // ain't no one logged in.
    }
    else if (!currentUser.is_live){
      console.log("deadbeat!")
    }
    else if (currentUser.is_trialing){
      UserMessage.set(
        'subscription.trialing',
        true,
        {daysLeft: currentUser.days_left_in_trial}
      );
    }

  })

  $scope.page = Page;
  $scope.loading = Loading;
  UservoiceWidget.insertTabs()
  $scope.isAuthenticated =  security.isAuthenticated
  $scope.tiMixpanel = TiMixpanel
  $scope.modalOpen = function(){
    return $rootScope.modalOpen
  }

  $scope.trustHtml = function(str){
    return $sce.trustAsHtml(str)
  }


  $scope.$on('$routeChangeError', function(event, current, previous, rejection){
    RouteChangeErrorHandler.handle(event, current, previous, rejection)
  });

  $scope.$on('$routeChangeSuccess', function(next, current){
    security.requestCurrentUser().then(function(currentUser){
      Page.sendPageloadToSegmentio()
    })

  })

  $scope.$on('$locationChangeStart', function(event, next, current){
    Page.showHeader(true)
    Page.showFooter(true)
    Page.setProfileUrl(false)
    Page.setHeaderFullName(false)
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
