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
    ProductList.setQuery("country", CountryNames.codeFromUrl($routeParams.country_name))
    ProductList.startRender($scope)

    $scope.ProductList = ProductList
    $scope.countryName = CountryNames.humanFromUrl($routeParams.country_name)

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
    ProductList.setQuery("genre", myGenreConfig.name)
    ProductList.startRender($scope)


    $scope.ProductList = ProductList
    $scope.myGenreConfig = myGenreConfig

    $scope.$watch('profileAboutService.data', function(newVal, oldVal){
      if (newVal && newVal.full_name) {
        Page.setTitle(newVal.full_name + ": " + myGenreConfig.plural_name)
      }
    }, true);


})






