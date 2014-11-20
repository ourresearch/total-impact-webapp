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
    controller:'GenrePageCtrl'
  })

}])


.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/country/:country_name", {
    templateUrl:'product-list-page/country-page.tpl.html',
    controller:'CountryPageCtrl'
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

    Page.setName("map")
    ProductList.startRender($scope)

    $scope.ProductList = ProductList
    $scope.countryName = CountryNames.humanFromUrl($routeParams.country_name)

    var myCountryCode = CountryNames.codeFromUrl($routeParams.country_name)
    var filterFn = function(product){
      if (product.countries_str && product.countries_str.indexOf(myCountryCode) > -1){
        return true
      }
      else {
        return false
      }
    }
    ProductList.setFilterFn(filterFn)

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
    ProductList,
    Page) {

    var myGenreConfig = GenreConfigs.getConfigFromUrlRepresentation($routeParams.genre_name)
    Page.setName($routeParams.genre_name)
    ProductList.startRender($scope)

    var filterFn = function(product){
      if (product.genre == myGenreConfig.name){
        return true
      }
      else {
        return false
      }
    }

    $scope.productsFilter = filterFn
    ProductList.setFilterFn(filterFn)


    $scope.ProductList = ProductList
    $scope.myGenreConfig = myGenreConfig

    $scope.$watch('profileAboutService.data', function(newVal, oldVal){
      if (newVal && newVal.full_name) {
        Page.setTitle(newVal.full_name + ": " + myGenreConfig.plural_name)
      }
    }, true);


})






