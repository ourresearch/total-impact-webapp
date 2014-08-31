angular.module("productPage", [
    'resources.users',
    'resources.products',
    'resources.productEmbedMarkup',
    'profileAward.profileAward',
    'services.page',
    'profile',
    'services.loading',
    'ui.bootstrap',
    'angularFileUpload',
    'pdf',
    'security'
  ])



  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider.when("/:url_slug/product/:tiid", {
      templateUrl:'product-page/product-page.tpl.html',
      controller:'ProductPageCtrl',
      resolve: {
        product: function(ProductWithoutProfile, $route){
          return ProductWithoutProfile.get({
            tiid: $route.current.params.tiid
          }).$promise
        },
        profileWithoutProducts: function(ProfileWithoutProducts, $route){
          return ProfileWithoutProducts.get({
            profile_id: $route.current.params.url_slug
          }).$promise
        }
      }
    });

  }])

  .factory('productPage', function(){
    return {

    }
  })

  .controller('ProductPageCtrl', function (
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
    TiMixpanel,
    ProductBiblio,
    ProductInteraction,
    ProductEmbedMarkup,
    product,
    profileWithoutProducts,
    Page) {



    Page.setHeaderFullName(profileWithoutProducts.full_name)
    Page.setProfileUrl(profileWithoutProducts.url_slug)
    var slug = $routeParams.url_slug
    UserProfile.useCache(true)
    console.log("product page controller loaded. Profile:", profileWithoutProducts)

    security.isLoggedInPromise(slug).then(
      function(resp){
        $scope.userOwnsThisProfile = true
      },
      function(resp){
        $scope.userOwnsThisProfile = false
      }
    )

    // this runs as soon as the page loads to send a View interaction to server
    ProductInteraction.save(
      {tiid: $routeParams.tiid},
      {
        timestamp: moment.utc().toISOString(),
        event: "views"
      }
    )
    renderProduct()








    /**********************************************
     *
     *  functions
     *
     **********************************************/



    function renderProduct(){
      console.log("rendering product", product)

      Page.setTitle(product.biblio.display_title)
      Loading.clear()
      window.scrollTo(0,0)  // hack. not sure why this is needed.
      $scope.profileWithoutProducts = profileWithoutProducts
      $scope.userSlug = slug
      $scope.loading = Loading
      $scope.aliases = product.aliases
      $scope.biblio = product.biblio
      $scope.metrics = product.metrics
      $scope.displayGenrePlural = product.display_genre_plural
      $scope.genre = product.genre
      $scope.hasEmbeddedFile = false
      $scope.userWantsFullAbstract = true
      $scope.productHost = parseHostname(product.aliases.resolved_url)
      $scope.freeFulltextHost = parseHostname(product.biblio.free_fulltext_url)

      // this part will go away once thi product comes with this already...
      ProductEmbedMarkup.get(
        {tiid: product.tiid},
        function(resp){
          console.log("successful resp from embedded markup: ", resp)
          if (resp.html) {
            $scope.iframeToEmbed = resp.html
            $scope.hasEmbeddedFile = true
            $scope.userWantsFullAbstract = false
            console.log("have something to embed, so don't include a full abstract")
          }
          else {
            console.log("nothing to embed, so include a full absract")
          }
        },
        function(resp){
          console.log("error response from embedding endpoint: ", resp)
        }
      )
    }




    // this should really be a directive...
    // from http://stackoverflow.com/a/21516924
    function parseHostname(url){
      var urlParser = document.createElement('a')
      urlParser.href = url
      console.log("hostname", urlParser.hostname)
      return urlParser.hostname.replace("www.", "")
    }



    $scope.reRenderProduct = function(){
      UsersProduct.get({
        tiid: $routeParams.tiid
      },
      function(data){
        console.log("re-rendered the product")
        renderProduct()
      },
      function(data){
        $location.path("/"+slug) // replace this with "product not found" message...
      }
      )
    }




    $scope.openInfoModal = function(){
      $modal.open({templateUrl: "product-page/percentilesInfoModal.tpl.html"})
    }

    $scope.openFulltextLocationModal = function(){
      UserProfile.useCache(false)
      $modal.open(
        {templateUrl: "product-page/fulltext-location-modal.tpl.html"}
        // controller specified in the template :/
      )
      .result.then(function(resp){
          console.log("closed the free fulltext modal; re-rendering product", resp)
          TiMixpanel.track("added free fulltext url",{
            url: resp.product.biblio.free_fulltext_url
          })
          $scope.reRenderProduct()
      })
      .then(function(resp){
        security.refreshCurrentUser()
      })
    }

    $scope.deleteProduct = function(){
      Loading.start("deleteProduct")
      UserProfile.useCache(false)

      Product.delete(
        {user_id: slug, tiid: $routeParams.tiid},
        function(){
          Loading.finish("deleteProduct")
          TiMixpanel.track("delete product")
          security.redirectToProfile()
        }
      )
    }

    $scope.updateBiblio = function(propertyToUpdate){
      Loading.start("updateBiblio." + propertyToUpdate )
      var updateObj = {}
      updateObj[propertyToUpdate] = $scope.biblio[propertyToUpdate]
      console.log("updating biblio with this:", updateObj)
      ProductBiblio.patch(
        {'tiid': $routeParams.tiid},
        updateObj,
        function(resp){
          console.log("updated product biblio; re-rendering", resp)
          $scope.reRenderProduct()
        }
      )
    }

    $scope.afterSaveTest = function(){
      console.log("running after save.")
    }

    $scope.truncatedAbstract = function(){

      if (!product.biblio.abstract) {
        return ""
      }

      if ($scope.userWantsFullAbstract) {
        return product.biblio.abstract
      }
      else {
        return product.biblio.abstract.substr(0, 75) + "..."
      }
    }


    $scope.editProduct = function(field){
      UserProfile.useCache(false)
      $modal.open({
        templateUrl: "product-page/edit-product-modal.tpl.html",
        controller: "editProductModalCtrl",
        resolve: {
          product: function(){
            return $scope.product
          },
          fieldToEdit: function(){
            return field
          }
        }
      })
      .result.then(
        function(resp){
          console.log("closed the editProduct modal; re-rendering product")
          $scope.reRenderProduct()
        }
      )
    }

    $scope.downloadFile = function(){
      ProductInteraction.save(
        {tiid: $routeParams.tiid},
        {
          timestamp: moment.utc().toISOString(),
          event: "download"
        }
      )
    }


  })




.controller("freeFulltextUrlFormCtrl", function($scope,
                                                $location,
                                                Loading,
                                                TiMixpanel,
                                                ProductBiblio){
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
        return $scope.$close(resp)
      }
    )
  }
})



.controller("productUploadCtrl", function($scope,
                                          $upload,
                                          $routeParams,
                                          security,
                                          Loading){
    $scope.onFileSelect = function($files){
      console.log("trying to upload files", $files)
      Loading.start("productUpload")


      $scope.upload = $upload.upload({
        url: "/product/"+ $routeParams.tiid +"/file",
        file: $files[0]
      })
      .success(function(data){
        console.log("success on upload", data)
        $scope.reRenderProduct() // calls parent scope function
        // this is called in parallel w reRenderProduct, so is not
        // always going to finish first. but is not relevant until user
        // returns to the profile page, so should be fine.
        security.refreshCurrentUser()

      })
      .error(function(data){
        alert("Sorry, there was an error uploading your file!")
      })

    }
})



  .directive('dynamic', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.dynamic, function(html) {
        ele.html(html);
        $compile(ele.contents())(scope);
      });
    }
  };
});















