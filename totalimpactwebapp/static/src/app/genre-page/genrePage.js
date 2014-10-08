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
    removeAll: function(){
      return tiids.length = 0
    },
    contains: function(tiid){
      return _.contains(tiids, tiid)
    },
    containsAny: function(){
      return tiids.length > 0
    },
    get: function(){
      return tiids
    },
    count: function(){
      return tiids.length
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
    GenreConfigs,
    ProfileService,
    ProfileAboutService,
    SelectedProducts,
    PinboardService,
    Page) {

    $scope.pinboardService = PinboardService

    SelectedProducts.removeAll()
    $scope.SelectedProducts = SelectedProducts
    if (!ProfileService.hasFullProducts()){
      Loading.startPage()
    }


    Timer.start("genreViewRender")
    Page.setName($routeParams.genre_name)
    $scope.url_slug = $routeParams.url_slug

    var genreConfig = GenreConfigs.getConfigFromUrlRepresentation($routeParams.genre_name)
    $scope.genre = genreConfig

    $scope.genreChangeDropdown = {}

    var rendering = true

    $scope.isRendering = function(){
      return rendering
    }


    $scope.$watch('profileService.data', function(newVal, oldVal){
      if (newVal.about) {
        Page.setTitle(newVal.about.full_name + "'s " + $routeParams.genre_name)
      }
    }, true);


    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.
      rendering = false
      Loading.finishPage()
      $timeout(function(){
        var lastScrollPos = Page.getLastScrollPosition($location.path())
        $window.scrollTo(0, lastScrollPos)
      }, 0)
      console.log("finished rendering genre products in " + Timer.elapsed("genreViewRender") + "ms"
      )
    });


    $scope.removeSelectedProducts = function(){
      console.log("removing products: ", SelectedProducts.get())
      ProfileService.removeProducts(SelectedProducts.get())
      SelectedProducts.removeAll()

      // handle removing the last product in our current genre
      var productsInCurrentGenre = ProfileService.productsByGenre(genreConfig.name)
      if (!productsInCurrentGenre.length){
        $location.path($routeParams.url_slug)
      }
    }

    $scope.changeProductsGenre = function(newGenre){
      console.log("changing products genres: ", SelectedProducts.get())
      $scope.genreChangeDropdown.isOpen = false

      ProfileService.changeProductsGenre(SelectedProducts.get(), newGenre)
      SelectedProducts.removeAll()

      // handle moving the last product in our current genre
      var productsInCurrentGenre = ProfileService.productsByGenre(genreConfig.name)
      if (!productsInCurrentGenre.length){
        var newGenreUrlRepresentation = GenreConfigs.get(newGenre, "url_representation")
        $location.path($routeParams.url_slug + "/products/" + newGenreUrlRepresentation)
      }
    }




})






