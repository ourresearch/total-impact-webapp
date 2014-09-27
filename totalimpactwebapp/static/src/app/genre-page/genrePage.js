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

.factory("SelectedProducts", function(){
  var tiids = []

  return {
    add: function(tiid){
      return tiids.push(tiid)
    },
    addFromObjects: function(objects){
      return tiids = _.pluck(objects, "tiid")
    },
    remove: function(tiid){
      tiids = _.without(tiids, tiid)
    },
    empty: function(){
      return tiids.length = 0
    },
    contains: function(tiid){
      return _.contains(tiids, tiid)
    },
    get: function(){
      return tiids
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
    ProfileAboutService,
    SelectedProducts,
    PinboardService,
    Page) {

    $scope.pinboardService = PinboardService

    $scope.SelectedProducts = SelectedProducts


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
      // var GenreMetricSumCards = _.where(cards, {card_type: "GenreMetricSumCards"}) // temp hack?
      var sorted = _.sortBy(cards, "sort_by")
      var reversed = sorted.concat([]).reverse()
      return reversed.slice(startIndex, endIndex)
    }




})






