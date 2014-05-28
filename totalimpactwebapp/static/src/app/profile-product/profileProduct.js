angular.module("profileProduct", [
    'resources.users',
    'resources.products',
    'profileAward.profileAward',
    'services.page',
    'profile',
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
    $compile,
    security,
    UsersProduct,
    UsersProducts,
    ProfileAwards,
    UserProfile,
    Product,
    Loading,
    Page) {

    var slug = $routeParams.url_slug

    Loading.start('profileProduct')
    UserProfile.useCache(true)

    $scope.userSlug = slug
    $scope.loading = Loading
    $scope.userOwnsThisProfile = security.testUserAuthenticationLevel("ownsThisProfile")

    $scope.openInfoModal = function(){
      $modal.open({templateUrl: "profile-product/percentilesInfoModal.tpl.html"})
    }
    $scope.openFulltextLocationModal = function(){
      $modal.open({templateUrl: "profile-product/fulltext-location-modal.tpl.html"})
    }


    $scope.profileAwards = ProfileAwards.query(
      {id:slug},
      function(resp){
      }
    )

    $scope.deleteProduct = function(){

      Loading.start("deleteProduct")
      UserProfile.useCache(false)

      // do the deletion in the background, without a progress spinner...
      UsersProducts.delete(
        {id: slug, idType:"url_slug"},  // the url
        {"tiids": [$routeParams.tiid]},  // the body data
        function(){
          console.log("finished deleting", $routeParams.tiid)
          security.redirectToProfile()
        }
      )
    }

    $scope.editProduct = function(){
      UserProfile.useCache(false)
      $modal.open({
        templateUrl: "profile-product/edit-product-modal.tpl.html",
        controller: "editProductModalCtrl",
        resolve: {
          product: function(){
            return $scope.product
          }
        }
      })
    }

    $scope.product = UsersProduct.get({
      id: slug,
      tiid: $routeParams.tiid
    },
    function(data){
      Loading.finish('profileProduct')
      Page.setTitle(data.biblio.title)
      $scope.productMarkup = $compile(data.markup)($scope)

    },
    function(data){
      $location.path("/"+slug) // replace this with "product not found" message...
    }
    )
  })


.controller("editProductModalCtrl", function($scope, $location, $modalInstance, Loading, product, ProductBiblio){

    // this shares a lot of code with the freeFulltextUrlFormCtrl below...refactor.

    $scope.product = product
    var tiid = $location.path().match(/\/product\/(.+)$/)[1]
    $scope.onCancel = function(){
      $scope.$close()
    }

    $scope.onSave = function() {
      Loading.start("saveButton")
      console.log("saving...", tiid)
      ProductBiblio.patch(
        {'tiid': tiid},
        {
          title: $scope.product.biblio.title,
          authors: $scope.product.biblio.authors
        },
        function(resp){
          Loading.finish("saveButton")
          $scope.$close()

          // this is overkill, but works for now.
          location.reload()
        }
      )
    }

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
        Loading.finish("saveButton")
        $scope.$close()
        location.reload() // hack to make the linkout icon appear right away.
      }
    )
  }
})




.controller("editProductFormCtrl", function(){
})



















