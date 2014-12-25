angular.module("productListPage", [
  'resources.users',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.productList'
])

.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/products/:genre_name", {
    templateUrl:'product-list-page/genre-page.tpl.html',
    controller:'GenrePageCtrl',
    reloadOnSearch: false
  })

}])


.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/country/:country_name", {
    templateUrl:'product-list-page/country-page.tpl.html',
    controller:'CountryPageCtrl',
    reloadOnSearch: false
  })

}])



.controller('CountryPageCtrl', function (
    $scope,
    $routeParams,
    GenreConfigs,
    ProfileAboutService,
    ProductList,
    CountryNames,
    Page) {

    var myCountryCode = CountryNames.codeFromUrl($routeParams.country_name)
    Page.setName("map")
    ProductList.startRender($scope)

    $scope.ProductList = ProductList
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
    ProductList.filters.tweets = function(tweet){
      return tweet.country === myCountryCode
    }
    ProductList.filters.products = filterFn

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
    ProductList,
    Page) {

    console.log("loading the genre page controller.")

    var myGenreConfig = GenreConfigs.getConfigFromUrlRepresentation($routeParams.genre_name)
    Page.setName($routeParams.genre_name)
    ProductList.startRender($scope)



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

    )

    var filterFn = function(product){
      if (product.genre == myGenreConfig.name){
        return true
      }
      else {
        return false
      }
    }

    ProductList.filters.products = filterFn
    ProductList.filters.tweets = function(){return true}
    $scope.productsFilter = filterFn


    $scope.ProductList = ProductList
    $scope.myGenreConfig = myGenreConfig

    $scope.$watch('profileAboutService.data', function(newVal, oldVal){
      if (newVal && newVal.full_name) {
        Page.setTitle(newVal.full_name + ": " + myGenreConfig.plural_name)
      }
    }, true);


})






