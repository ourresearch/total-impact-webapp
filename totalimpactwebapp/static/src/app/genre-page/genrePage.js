angular.module("genrePage", [
  'resources.users',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.loading',
  'services.timer',
  'services.selectedProducts',
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



.factory("GenreSort", function($location){

  var configs = [
    {
      keys: ["-awardedness_score", '-metric_raw_sum', 'biblio.title'],
      name: "default",
      urlName: "default"
    } ,
    {
      keys: ["biblio.title", "-awardedness_score", '-metric_raw_sum'],
      name: "title",
      urlName: "title"
    },
    {
      keys: ["-year", "-awardedness_score", '-metric_raw_sum', 'biblio.title'],
      name: "year",
      urlName: "year"
    },
    {
      keys: ["biblio.authors", "-awardedness_score", '-metric_raw_sum', 'biblio.title'],
      name: "first author",
      urlName: "first_author"
    }
  ]

  function getCurrentConfig(){
    var ret
    ret = _.findWhere(configs, {urlName: $location.search().sort_by})
    if (!ret){
      ret = _.findWhere(configs, {urlName: "default"})
    }
    return ret
  }


  return {
    get: getCurrentConfig,
    set: function(name){
      var myConfig = _.findWhere(configs, {name: name})
      if (myConfig.name == "default"){
        $location.search("sort_by", null)
      }
      else {
        $location.search("sort_by", myConfig.urlName)
      }
    },
    options: function(){
      var currentName = getCurrentConfig().name
      return _.filter(configs, function(config){
        return config.name !== currentName
      })
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
    GenreSort,
    PinboardService,
    Page) {

    $scope.pinboardService = PinboardService

    SelectedProducts.removeAll()
    $scope.SelectedProducts = SelectedProducts
    if (!ProfileService.hasFullProducts()){
      Loading.startPage()
    }

    $scope.sortBy = "default"
    $scope.GenreSort = GenreSort


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
      console.log("profileService.data watch triggered!", newVal, oldVal)
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






