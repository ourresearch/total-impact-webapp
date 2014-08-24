angular.module("productPage", [
    'resources.users',
    'resources.products',
    'resources.embedly',
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
        product: function(Product, $route){
          return Product.get({
            user_id: $route.current.params.url_slug,
            tiid: $route.current.params.tiid
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
    Embedly,
    product,
    Page) {

    var slug = $routeParams.url_slug
    window.scrollTo(0,0)  // hack. not sure why this is needed.

    UserProfile.useCache(true)


    $scope.userSlug = slug
    $scope.loading = Loading
    $scope.aliases = product.aliases
    $scope.biblio = product.biblio
    $scope.metrics = product.metrics
    $scope.displayGenrePlural = product.display_genre_plural


    // these are just for testing!
    // once we've got a biblio.file_url set by the server,
    // delete them.
    product.biblio.file_url = "http://www.slideshare.net/hpiwowar/right-time-right-place-to-change-the-world"
    product.biblio.file_url = "http://jasonpriem.org/self-archived/data-for-free.pdf"


    if (product.biblio.file_url){
      Embedly.get(
        {url: product.biblio.file_url},
        function(resp){
          console.log("successful resp from embedly: ", resp)
          $scope.iframeToEmbed = resp.html
        },
        function(resp){
          console.log("error response from embedly: ", resp)
        }
      )
    }





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
        event: "view"
      }
    )


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
          renderProduct()
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
          renderProduct()
        }
      )
    }

    $scope.afterSaveTest = function(){
      console.log("running after save.")
    }

    $scope.userWantsFullAbstract = false
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
          renderProduct()
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


    $scope.biblioString = function(biblioKey, biblioVal){
      if (biblioVal){
        return biblioVal
      }
      else {
        return "no " + biblioKey + " available"
      }
    }

    var renderProduct = function(){
      $scope.product = UsersProduct.get({
        id: $routeParams.url_slug,
        tiid: $routeParams.tiid
      },
      function(data){
        Loading.finish('productPage')
        Page.setTitle(data.biblio.title)

        $scope.biblioMarkup = data.markups_dict.biblio
        $scope.metricsMarkup = data.markups_dict.metrics

        $scope.aliases = data.aliases
        $scope.biblio = data.biblio

        console.log("loaded a product", data)
        window.scrollTo(0,0)  // hack. not sure why this is needed.
        Loading.clear() // hack for now, should do in promise...


      },
      function(data){
        $location.path("/"+slug) // replace this with "product not found" message...
      }
      )
    }

//    renderProduct()

  })


.controller("editProductModalCtrl", function($scope,
                                             $location,
                                             $modalInstance,
                                             $routeParams,
                                             Loading,
                                             product,
                                             fieldToEdit,
                                             UsersProduct,
                                             ProductBiblio){

    console.log("editProductModalCtrl fieldToEdit", fieldToEdit)

    $scope.fieldToEdit = fieldToEdit

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
          authors: $scope.product.biblio.authors,
          journal: $scope.product.biblio.journal,
          year: $scope.product.biblio.year

        },
        function(resp){
          console.log("saved new product biblio", resp)
          Loading.finish("saveButton")
          console.log("got a response back from the UsersProduct.get() call", resp)
          return $scope.$close(resp)

        }
      )
    }
  })


.controller("editProductFormCtrl", function(){

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



.controller("productUploadCtrl", function($scope, $upload, $routeParams){
    $scope.onFileSelect = function($files){
      console.log("trying to upload files", $files)

      $scope.upload = $upload.upload({
        url: "/product/"+ $routeParams.tiid +"/file",
        file: $files[0]
      })
      .success(function(data){
        console.log("success on upload", data)
      })

    }
})


.controller("pdfCtrl", function($scope, $routeParams){
    $scope.pdfName = 'Relativity: The Special and General Theory by Albert Einstein';
    $scope.pdfUrl = '/product/'+ $routeParams.tiid +'/pdf';
    $scope.getNavStyle = function(scroll) {
      if(scroll < 80) return 'fixed';
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















