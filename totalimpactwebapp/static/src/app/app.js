// setup libs outside angular-land. this may break some unit tests at some point...#problemForLater
// Underscore string functions: https://github.com/epeli/underscore.string
_.mixin(_.str.exports());


angular.module('app', [
  'placeholderShim',
  'ngCookies',
  'ngRoute',
  'ngSanitize',
  'ngAnimate',
  'emguo.poller',
  'services.loading',
  'services.userMessage',
  'services.routeChangeErrorHandler',
  'services.page',
  'services.breadcrumbs',
  'services.tiMixpanel',
  'security',
  'directives.crud',
  'directives.jQueryTools',
  'directives.tweetThis',
  'directives.ourSort',
  'directives.authorList',
  'angularUtils.directives.dirPagination',
  'templates.app',
  'templates.common',
  'infopages',
  'signup',
  'passwordReset',
  'profileMap',
  'fansPage',
  'giftSubscriptionPage',
  'productPage',
  'collectionPage',
  'services.genreConfigs',
  'accountPage',
  'services.profileProducts',
  'services.profileAboutService',
  'profileSidebar',
  'ui.sortable',
  'deadProfile',
  'services.pinboardService',
  'services.profileAwardService',
  'services.countryNames',
  'services.keyProducts',
  'services.keyMetrics',
  'services.cardService',
  'services.map',
  'services.fansService',
  'services.ourSortService',
  'settings',
  'xeditable',
  'ngProgress'
]);

angular.module('app').constant('TEST', {
  baseUrl: 'http://localhost:5000/',
  otherKey: 'value'
});


angular.module('app').config(function ($routeProvider,
                                       $sceDelegateProvider,
                                       paginationTemplateProvider,
                                       $locationProvider) {
  $locationProvider.html5Mode(true);
  paginationTemplateProvider.setPath('directives/pagination.tpl.html')
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


angular.module('app').run(function($route,
                                   $rootScope,
                                   $window,
                                   $timeout,
                                   security,
                                   Page,
                                   $location,
                                   editableOptions) {
  // Get the current user when the application starts
  // (in case they are still logged in from a previous session)
  security.requestCurrentUser();

  // from https://github.com/angular/angular.js/issues/1699#issuecomment-59283973
  // and http://joelsaupe.com/programming/angularjs-change-path-without-reloading/
  // and https://github.com/angular/angular.js/issues/1699#issuecomment-60532290
  var original = $location.path;
  $location.path = function (path, reload) {
      if (reload === false) {
          var lastRoute = $route.current;
          var un = $rootScope.$on('$locationChangeSuccess', function () {
              $route.current = lastRoute;
              un();
          });
        $timeout(un, 500)
      }
      return original.apply($location, [path]);
  };




  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

  angular.element($window).bind("scroll", function(event) {
    Page.setLastScrollPosition($(window).scrollTop(), $location.path())
  })

});


angular.module('app').controller('AppCtrl', function($scope,
                                                     $window,
                                                     $http,
                                                     $route,
                                                     $sce,
                                                     UserMessage,
                                                     $location,
                                                     Loading,
                                                     Page,
                                                     Breadcrumbs,
                                                     GenreConfigs,
                                                     security,
                                                     $rootScope,
                                                     TiMixpanel,
                                                     ProfileProducts,
                                                     ProfileAboutService,
                                                     OurSortService,
                                                     ProductPage,
                                                     RouteChangeErrorHandler) {

  $scope.userMessage = UserMessage
  $rootScope.security = security
  $scope.profileService = ProfileProducts
  $scope.profileAboutService = ProfileAboutService

  $rootScope.adminMode = $location.search().admin == 42

  $rootScope.isOnMobile = function() {
      return $(window).width() <= responsiveDesignBreakpoints.tablet[1]
  }


  // init the genre configs service
  $scope.GenreConfigs = GenreConfigs

  security.requestCurrentUser().then(function(currentUser){

    if (!currentUser){
      // ain't no one logged in.
    }
    else if (!currentUser.is_live){
    }
    else if (currentUser.is_trialing){
//      UserMessage.set(
//        'subscription.trialing',
//        true,
//        {daysLeft: currentUser.days_left_in_trial}
//      );
    }

  })

  $scope.moment = moment
  $scope.page = Page;
  $scope.breadcrumbs = Breadcrumbs;
  $scope.OurSortService = OurSortService;
  $scope.loading = Loading;
  $scope.isAuthenticated =  security.isAuthenticated
  $scope.tiMixpanel = TiMixpanel
  $scope.modalOpen = function(){
    return $rootScope.modalOpen
  }

  $scope.trustHtml = function(str){
    return $sce.trustAsHtml(str)
  }

  $scope.footer = {}

  $scope.nFormat = function(num) {
    // from http://stackoverflow.com/a/14994860/226013
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
  }

  $scope.nFormatCommas = function(num){
    if (num === null){
      return ""
    }

    // from http://stackoverflow.com/a/2901298
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    ProductPage.loadingBar(next, current)
    Page.setProfileUrl(false)
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
