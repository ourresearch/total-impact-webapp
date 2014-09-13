angular.module("genrePage", [
  'resources.users',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.loading',
  'services.timer',
  'services.userMessage'
])

.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/products/:genre_name", {
    templateUrl:'genre-page/genre-page.tpl.html',
    controller:'GenrePageCtrl'
  })

}])

.factory("GenrePage", function(){
  var cacheProductsSetting = false

  return {
    useCache: function(cacheProductsArg){  // setter or getter
      if (typeof cacheProductsArg !== "undefined"){
        cacheProductsSetting = !!cacheProductsArg
      }
      return cacheProductsSetting
    }
  }
})




.controller('GenrePageCtrl', function (
    $scope,
    $rootScope,
    $location,
    $routeParams,
    $modal,
    $timeout,
    $http,
    $anchorScroll,
    $cacheFactory,
    $window,
    $sce,
    Users,
    Product,
    TiMixpanel,
    UserProfile,
    UserMessage,
    Update,
    Loading,
    Tour,
    Timer,
    security,
    ProfileService,
    PinboardService,
    Page) {

    $scope.pinboardService = PinboardService


    Timer.start("genreViewRender")
    Timer.start("genreViewRender.load")
    Page.setName($routeParams.genre_name)
    $scope.url_slug = $routeParams.url_slug
    $scope.genre_name = $routeParams.genre_name

    var rendering = true

    $scope.isRendering = function(){
      return rendering
    }

    ProfileService.get($routeParams.url_slug).then(
      function(resp){
        console.log("genre page loaded products", resp)
        Page.setTitle(resp.about.full_name + "'s " + $routeParams.genre_name)

        $scope.about = resp.about
        $scope.products = ProfileService.productsByGenre($routeParams.genre_name)
        $scope.genre = ProfileService.genreLookup($routeParams.genre_name)

        // scroll to the last place we were on this page. in a timeout because
        // must happen after page is totally rendered.
        $timeout(function(){
          var lastScrollPos = Page.getLastScrollPosition($location.path())
          $window.scrollTo(0, lastScrollPos)
        }, 0)
      },
      function(resp){
        console.log("ProfileService failed in genrePage.js...", resp)
      }
    )




    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.
      rendering = false
      console.log("finished rendering genre products in " + Timer.elapsed("genreViewRender") + "ms"
      )
    });

    $scope.sliceSortedCards = function(cards, startIndex, endIndex){
      var genreAccumulationCards = _.where(cards, {card_type: "GenreAccumulationCard"}) // temp hack?
      var sorted = _.sortBy(genreAccumulationCards, "sort_by")
      var reversed = sorted.concat([]).reverse()
      return reversed.slice(startIndex, endIndex)
    }

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




})






