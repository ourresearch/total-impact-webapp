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
    ProfileService,
    Page) {


    Timer.start("genreViewRender")
    Timer.start("genreViewRender.load")
    $scope.url_slug = $routeParams.url_slug
    var rendering = true

    $scope.isRendering = function(){
      return rendering
    }

    ProfileService.get($routeParams.url_slug).then(
      function(resp){
        console.log("genre page loaded products", resp)
        Page.setTitle(resp.about.full_name + "'s " + $routeParams.genre_name)

        $scope.about = resp.about
        $scope.products = _.filter(resp.products, function(product){
          return product.genre == $routeParams.genre_name
        })

//        $scope.genreNamePlural = ProfileService.getGenreProperty($routeParams.genre_name, "plural_name")
        $scope.genreNamePlural = "stuffs"

        // scroll to the last place we were on this page. in a timeout because
        // must happen after page is totally rendered.
        $timeout(function(){
          var lastScrollPos = Page.getLastScrollPosition($location.path())
          $window.scrollTo(0, lastScrollPos)
        }, 0)
      },
      function(resp){
        console.log("ProfileService failed in genrePage.js...", resp)
      }
    )




    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.
      rendering = false
      console.log("finished rendering genre products in " + Timer.elapsed("genreViewRender") + "ms"
      )
    });



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
        {user_id: $routeParams.url_slug, tiid: product._tiid},
        function(){
          console.log("finished deleting", product.display_title)
          TiMixpanel.track("delete product", {
            tiid: product._tiid,
            title: product.display_title
          })
        }
      )
    }

})






