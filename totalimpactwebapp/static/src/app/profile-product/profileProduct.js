angular.module("profileProduct", [
    'resources.users',
    'resources.products',
    'services.page',
    'product.product',
    'services.loading',
    'ui.bootstrap',
    'security'
  ])



  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider.when("/:url_slug/product/:tiid", {
      templateUrl:'profile-product/profile-product-page.tpl.html',
      controller:'ProfileProductPageCtrl'
    });

  }])

  .controller('ProfileProductPageCtrl', function (
    $scope,
    $routeParams,
    $location,
    $modal,
    $cacheFactory,
    security,
    UsersProduct,
    UsersProducts,
    Product,
    Loading,
    Page) {

    var slug = $routeParams.url_slug
    var $httpDefaultCache = $cacheFactory.get('$http')

    Loading.start('profileProduct')

    $scope.userSlug = slug
    $scope.loading = Loading
    $scope.userOwnsThisProfile = security.testUserAuthenticationLevel("ownsThisProfile")

    $scope.openInfoModal = function(){
      $modal.open({templateUrl: "profile-product/percentilesInfoModal.tpl.html"})
    }
    $scope.openFulltextLocationModal = function(){
      $modal.open({templateUrl: "profile-product/fulltext-location-modal.tpl.html"})
    }
    $scope.deleteProduct = function(){

      Loading.start("deleteProduct")

      // do the deletion in the background, without a progress spinner...
      UsersProducts.delete(
        {id: slug, idType:"url_slug"},  // the url
        {"tiids": [$routeParams.tiid]},  // the body data
        function(){
          console.log("finished deleting", $routeParams.tiid)
          $httpDefaultCache.removeAll()
          security.redirectToProfile()
        }
      )
    }


    $scope.product = UsersProduct.get({
      id: slug,
      tiid: $routeParams.tiid
    },
    function(data){
      Loading.finish('profileProduct')
      Page.setTitle(data.biblio.title)

    },
    function(data){
      $location.path("/"+slug) // replace this with "product not found" message...
    }
    )
  })


.controller("fulltextLocationModalCtrl", function(){
  })


.controller("freeFulltextUrlFormCtrl", function($scope, $location, Loading, ProductBiblio){
  var tiid = $location.path().match(/\/product\/(.+)$/)[1]

  $scope.free_fulltext_url = ""
  $scope.onSave = function() {
    Loading.start("saveButton")
    console.log("saving...", tiid)
    ProductBiblio.patch(
      {'tiid': tiid},
      {free_fulltext_url: $scope.free_fulltext_url},
      function(resp){
        console.log("we got back this resp: ", resp)
        Loading.finish("saveButton")
      }
    )




  }
})



















