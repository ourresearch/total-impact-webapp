angular.module("profileProduct", [
    'resources.users',
    'resources.products',
    'profileAward.profileAward',
    'services.page',
    'profile',
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
    $sce,
    security,
    UsersProduct,
    UsersProducts,
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
      console.log("opening the modal")
      $modal.open({templateUrl: "profile-product/fulltext-location-modal.tpl.html"})
    }


    $scope.deleteProduct = function(){
      Loading.start("deleteProduct")
      UserProfile.useCache(false)

      Product.delete(
        {user_id: slug, tiid: $routeParams.tiid},
        function(){
          Loading.finish("deleteProduct")
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


      var compiled = $compile(data.markup)($scope)
      console.log("markup: ", data.markup)
      console.log("compiled: ", compiled)
      $scope.productMarkup = $compile(data.markup)($scope)
//      $scope.productMarkup = data.markup

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



















