angular.module("services.collection", [])

.factory("Collection", function(
    $location,
    $timeout,
    $window,
    $rootScope,
    SelectedProducts,
    GenreConfigs,
    PinboardService,
    KeyMetrics,
    KeyProducts,
    Loading,
    Timer,
    OurSortService,
    Page,
    ProfileProducts){

  var ui = {}
  var filterFn

  var filters = {
    products: function(product){
      return true
    },

    // this is meant to be overriden by the country collection ctrl,
    // or anyone else who only wants to count/display particular
    // tweets from each product.
    tweets: function (tweet) {
      return true
    }
  }


  $rootScope.$watch(function(){
    return ui.showTweets
  }, function(newVal, oldVal){
    if (newVal){
      $location.search("show_tweets", "true")
    }
    else {
      $location.search("show_tweets", null)
    }
  })



  var startRender = function($scope){
    if (!ProfileProducts.hasFullProducts()){
      Loading.startPage()
    }
    ui.showTweets = !!$location.search().show_tweets

    Timer.start("collectionRender")
    SelectedProducts.removeAll()


    $scope.KeyMetrics = KeyMetrics
    $scope.KeyProducts = KeyProducts


    OurSortService.setChoices([
      {
        key: ["-awardedness_score", '-metric_raw_sum', 'title'],
        name: "default",
        urlName: "default"
      } ,
      {
        key: ["title", "-awardedness_score", '-metric_raw_sum'],
        name: "title",
        urlName: "title"
      },
      {
        key: ["-year", "-awardedness_score", '-metric_raw_sum', 'title'],
        name: "year",
        urlName: "year"
      },
      {
        key: ["authors", "-awardedness_score", '-metric_raw_sum', 'title'],
        name: "first author",
        urlName: "first_author"
      }
    ])


    // i think this stuff is not supposed to be here. not sure how else to re-use, though.
    $scope.pinboardService = PinboardService
    $scope.SelectedProducts = SelectedProducts
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
    console.log("finished rendering collection in " + Timer.elapsed("collectionRender") + "ms"
    )
  }


  var changeProductsGenre = function(newGenre){
    ProfileProducts.changeProductsGenre(SelectedProducts.get(), newGenre)
    SelectedProducts.removeAll()


    // handle moving the last product in our current genre
    if (!len()){
      var newGenreUrlRepresentation = GenreConfigs.get(newGenre, "url_representation")
      var currentProfileSlug = ProfileProducts.getUrlSlug()
      $location.path(currentProfileSlug + "/products/" + newGenreUrlRepresentation)
    }
  }


  var removeSelectedProducts = function(){
    console.log("removing products: ", SelectedProducts.get())
    ProfileProducts.removeProducts(SelectedProducts.get())
    SelectedProducts.removeAll()

    // handle removing the last product in this particular product list
    if (len() === 0){
      $location.path(ProfileProducts.getUrlSlug())
    }
  }

  var productsInThisCollection = function(){
    return _.filter(ProfileProducts.data.products, filters.products)

  }

  var len = function(){
    return productsInThisCollection().length
  }

  var selectEverything = function(){
    SelectedProducts.addFromObjects(productsInThisCollection())
  }

  var numTweets = function(){
    var count = 0
    _.each(productsInThisCollection(), function(product){
      if (product.tweets) {
        var filteredTweets = _.filter(
          product.tweets,
          filters.tweets
        )

        count += filteredTweets.length
      }
    })
    return count
  }



  return {
    changeProductsGenre: changeProductsGenre,
    removeSelectedProducts: removeSelectedProducts,
    startRender: startRender,
    finishRender: finishRender,
    numTweets: numTweets,
    ui: ui,
    setFilterFn: function(fn){
      filterFn = fn
    },
    setTweetsFilterFn: function(fn){
      filters.tweets = fn
    },
    len: len,
    selectEverything: selectEverything,
    filters: filters

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



