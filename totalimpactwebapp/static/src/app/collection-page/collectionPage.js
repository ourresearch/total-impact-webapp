angular.module("collectionPage", [
  'resources.users',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.collection'
])

.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/products/:genre_name", {
    templateUrl:'collection-page/genre-page.tpl.html',
    controller:'GenrePageCtrl',
    reloadOnSearch: false
  })

}])


.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/country/:country_name", {
    templateUrl:'collection-page/country-page.tpl.html',
    controller:'CountryPageCtrl',
    reloadOnSearch: false
  })

}])



.controller('CountryPageCtrl', function (
    $scope,
    $routeParams,
    GenreConfigs,
    ProfileAboutService,
    Collection,
    CountryNames,
    Page) {

    var myCountryCode = CountryNames.codeFromUrl($routeParams.country_name)
    Page.setName("map")
    Collection.startRender($scope)

    $scope.Collection = Collection
    $scope.countryName = CountryNames.humanFromUrl($routeParams.country_name)
    $scope.countryCode = myCountryCode

    var filterFn = function(product){
      if (product.countries_str && product.countries_str.indexOf(myCountryCode) > -1){
        return true
      }
      else {
        return false
      }
    }

    // only show tweets if they are for sure from this country
    Collection.filters.tweets = function(tweet){
      return tweet.country === myCountryCode
    }
    Collection.filters.products = filterFn

    $scope.productsFilter = filterFn



    $scope.$watch('profileAboutService.data', function(newVal, oldVal){
      if (newVal && newVal.full_name) {
        Page.setTitle(newVal.full_name + ": " + $routeParams.country_name)
      }
    }, true);


})


.controller('GenrePageCtrl', function (
    $scope,
    $routeParams,
    GenreConfigs,
    ProfileAboutService,
    SummaryCards,
    Loading,
    Collection,
    Page) {

    console.log("loading the genre page controller.")

    var myGenreConfig = GenreConfigs.getConfigFromUrlRepresentation($routeParams.genre_name)
    Page.setName($routeParams.genre_name)
    Collection.startRender($scope)



    Loading.start("genreCards")
    SummaryCards.query(
      {
        id: $routeParams.url_slug,
        namespace: "genre",
        tag: myGenreConfig.name
      },
      function(resp){
        console.log("got some cards back!", resp)
        var sortedCards = _.sortBy(resp, function(card){
          return card.sort_by * -1
        })

        $scope.genreCards = sortedCards.slice(0, 3).reverse()
      },
      function(resp){
        console.log("problem with the cards call. #sadface.", resp)
      }
    ).$promise.then(function(resp){
        Loading.finish("genreCards")
      })

    var filterFn = function(product){
      if (product.genre == myGenreConfig.name){
        return true
      }
      else {
        return false
      }
    }

    Collection.filters.products = filterFn
    Collection.filters.tweets = function(){return true}
    $scope.productsFilter = filterFn


    $scope.Collection = Collection
    $scope.myGenreConfig = myGenreConfig

    $scope.$watch('profileAboutService.data', function(newVal, oldVal){
      if (newVal && newVal.full_name) {
        Page.setTitle(newVal.full_name + ": " + myGenreConfig.plural_name)
      }
    }, true);


})






