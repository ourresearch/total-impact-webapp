angular.module("services.productList", [])

.factory("ProductList", function(
    $location,
    $timeout,
    $window,
    SelectedProducts,
    GenreConfigs,
    PinboardService,
    ProductListSort,
    KeyMetrics,
    KeyProducts,
    Loading,
    Timer,
    Page,
    ProfileService){

  var genreChangeDropdown = {}
  var queryDimension
  var queryValue

  var startRender = function($scope){
    if (!ProfileService.hasFullProducts()){
      Loading.startPage()
    }
    Timer.start("productListRender")
    SelectedProducts.removeAll()


    $scope.KeyMetrics = KeyMetrics
    $scope.KeyProducts = KeyProducts


    // i think this stuff is not supposed to be here. not sure how else to re-use, though.
    $scope.pinboardService = PinboardService
    $scope.SelectedProducts = SelectedProducts
    $scope.ProductListSort = ProductListSort
    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.
      finishRender()
    });
  }

  var finishRender = function(){
    Loading.finishPage()
    $timeout(function(){
      var lastScrollPos = Page.getLastScrollPosition($location.path())
      $window.scrollTo(0, lastScrollPos)
    }, 0)
    console.log("finished rendering genre products in " + Timer.elapsed("genreViewRender") + "ms"
    )
  }


  var changeProductsGenre = function(newGenre){
    ProfileService.changeProductsGenre(SelectedProducts.get(), newGenre)
    SelectedProducts.removeAll()
    genreChangeDropdown.isOpen = false

    // handle moving the last product in our current genre
    if (!get().length){
      var newGenreUrlRepresentation = GenreConfigs.get(newGenre, "url_representation")
      var currentProfileSlug = ProfileService.getUrlSlug()
      $location.path(currentProfileSlug + "/products/" + newGenreUrlRepresentation)
    }
  }


  var removeSelectedProducts = function(){
    console.log("removing products: ", SelectedProducts.get())
    ProfileService.removeProducts(SelectedProducts.get())
    SelectedProducts.removeAll()

    // handle removing the last product in this particular product list
    if (!get().length){
      $location.path(ProfileService.getUrlSlug())
    }
  }

  var setQuery = function(dimension, value) {
    queryDimension = dimension
    queryValue = value
  }

  var get = function(){
    if (queryDimension == "genre") {
      return ProfileService.productsByGenre(queryValue)
    }
    else if (queryDimension == "country") {
      return ProfileService.productsByCountry(queryValue)
    }
    else {
      return []
    }
  }


  return {
    changeProductsGenre: changeProductsGenre,
    removeSelectedProducts: removeSelectedProducts,
    setQuery: setQuery,
    get: get,
    startRender: startRender,
    finishRender: finishRender,
    genreChangeDropdown: genreChangeDropdown
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

.factory("ProductListSort", function($location){

  var configs = [
    {
      keys: ["-awardedness_score", '-metric_raw_sum', 'title'],
      name: "default",
      urlName: "default"
    } ,
    {
      keys: ["title", "-awardedness_score", '-metric_raw_sum'],
      name: "title",
      urlName: "title"
    },
    {
      keys: ["-year", "-awardedness_score", '-metric_raw_sum', 'title'],
      name: "year",
      urlName: "year"
    },
    {
      keys: ["authors", "-awardedness_score", '-metric_raw_sum', 'title'],
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
