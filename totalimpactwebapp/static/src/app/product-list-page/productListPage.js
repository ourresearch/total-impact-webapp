angular.module("productListPage", [
  'resources.users',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.loading',
  'services.timer',
  'services.productList',
  'services.userMessage'
])

.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/products/:genre_name", {
    templateUrl:'product-list-page/product-list-page-genre.tpl.html',
    controller:'GenrePageCtrl'
  })

}])




.controller('GenrePageCtrl', function (
    $scope,
    $rootScope,
    $location,
    $routeParams,
    $modal,
    $timeout,
    $http,
    $anchorScroll,
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
    ProductListSort,
    ProductList,
    PinboardService,
    Page) {

    if (!ProfileService.hasFullProducts()){
      Loading.startPage()
    }
    Timer.start("genreViewRender")
    Page.setName($routeParams.genre_name)
    SelectedProducts.removeAll()
    var myGenreConfig = GenreConfigs.getConfigFromUrlRepresentation($routeParams.genre_name)




    ProductList.setQuery("genre", myGenreConfig.name)
    $scope.ProductList = ProductList





    $scope.pinboardService = PinboardService
    $scope.SelectedProducts = SelectedProducts
    $scope.sortBy = "default"
    $scope.ProductListSort = ProductListSort
    $scope.url_slug = $routeParams.url_slug
    $scope.genre = myGenreConfig


    $scope.$watch('profileService.data', function(newVal, oldVal){
      if (newVal.about) {
        Page.setTitle(newVal.about.full_name + "'s " + $routeParams.genre_name)
      }
    }, true);


    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.
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
      var productsInCurrentGenre = ProfileService.productsByGenre(myGenreConfig.name)
      if (!productsInCurrentGenre.length){
        $location.path($routeParams.url_slug)
      }
    }
})






