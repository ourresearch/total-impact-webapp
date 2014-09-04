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
    Page) {

    var $httpDefaultCache = $cacheFactory.get('$http')

    $scope.doneLoading = false
    $scope.doneRendering = false

    Timer.start("genreViewRender")
    Timer.start("genreViewRender.load")

    if (UserProfile.useCache() === false){
      // generally this will happen, since the default is false
      // and we set it back to false either way once this function
      // has run once.
      $httpDefaultCache.removeAll()
    }
    var url_slug = $routeParams.url_slug;
    var loadingProducts = true
    $scope.url_slug = url_slug



    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.
      $scope.doneRendering = true
      console.log(
        "finished rendering genre products in "
          + Timer.elapsed("genreViewRender.render")
          + "ms"
      )
    });

    $scope.loadingProducts = function(){
      return loadingProducts
    }
//    $scope.filterProducts =  UserProfile.filterProducts;



    $scope.removeProduct = function(product){
//      alert("Sorry! Product deletion is temporarily disabled. It'll be back soon.")
      console.log("removing product: ", product)
      $scope.products.splice($scope.products.indexOf(product),1)
      UserMessage.set(
        "profile.removeProduct.success",
        false,
        {title: product.display_title}
      )

      // do the deletion in the background, without a progress spinner...
      Product.delete(
        {user_id: url_slug, tiid: product._tiid},
        function(){
          console.log("finished deleting", product.display_title)
          TiMixpanel.track("delete product", {
            tiid: product._tiid,
            title: product.display_title
          })
        }
      )
    }

    var renderProducts = function(){
      console.log("rendering products")
      Users.query({
        id: url_slug,
        embedded: false
      },
        function(resp){
          console.log("got /profile resp back in "
            + Timer.elapsed("profileViewRender.load")
            + "ms: ", resp)

          // we only cache things one time
          UserProfile.useCache(false)

          // put our stuff in the scope
          Page.setTitle(resp.about.full_name + "'s " + $routeParams.genre_name)
          $scope.products = _.filter(resp.products, function(product){
            return product.genre == $routeParams.genre_name
          })
          $scope.doneLoading = true


          Timer.start("genreViewRender.render")

          // scroll to the last place we were on this page. in a timeout because
          // must happen after page is totally rendered.
          $timeout(function(){
            var lastScrollPos = Page.getLastScrollPosition($location.path())
            $window.scrollTo(0, lastScrollPos)
          }, 0)

        },
        function(resp){
          console.log("problem loading the genre products!", resp)
        }
      );
    }

    renderProducts()
})






