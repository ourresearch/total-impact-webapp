angular.module("productPage", [
    'resources.users',
    'resources.products',
    'services.page',
    'services.breadcrumbs',
    'profile',
    'services.loading',
    'ui.bootstrap',
    'angularFileUpload',
    'pdf',
    'security'
  ])



  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider.when("/:url_slug/product/:tiid/:tabName?", {
      templateUrl:'product-page/product-page.tpl.html',
      controller:'ProductPageCtrl',
      resolve: {
        product: function(ProductWithoutProfile, $route){
          return ProductWithoutProfile.get({
            tiid: $route.current.params.tiid
          }).$promise
        }
      }
    });

  }])

  .factory('ProductPage', function($rootScope,
                                   $routeParams,
                                   $location,
                                   Loading){
    var tab = "summary"
    var isProductPageUrl = function(url){
      if (!url){
        return false
      }
      return url.indexOf("/product/") > -1
    }

    return {
      loadingBar: function(nextRoute, currentRoute){
        if (!isProductPageUrl(nextRoute)){ // not going to a product page
          return false
        }
        else { // we are going to a product page
          if (nextRoute == currentRoute){ // first page upon loading the site
            Loading.startPage()
          }

          // going from elsewhere on the site to a product page
          if (isProductPageUrl(nextRoute) && !isProductPageUrl(currentRoute)){
            Loading.startPage()
          }

        }
        return false
      },
      tabIs: function(tabName){
        return tab == tabName
      },
      setTab: function(tabName){
        var newPath = "/" + $routeParams.url_slug + "/product/" + $routeParams.tiid

        if (!tabName){
          tabName = "summary"
        }

        if (tabName !== "summary") {
          newPath += "/" + tabName
        }

        tab = tabName
        $location.path(newPath, false)
      }
    }
  })

  .controller('ProductPageCtrl', function (
    $scope,
    $routeParams,
    $location,
    $modal,
    $compile,
    $sce,
    security,
    UsersProduct,
    UserProfile,
    ProductPage,
    Product,
    Loading,
    TiMixpanel,
    ProductBiblio,
    ProductInteraction,
    product,
    ProductWithoutProfile,
    ProfileAboutService,
    ProfileService,
    GenreConfigs,
    MapService,
    Page) {

    var genre_url_key = GenreConfigs.get(product.genre, "url_representation")

    var tiid = angular.copy($routeParams.tiid)

    Page.setName(genre_url_key)
    Loading.finishPage()

    console.log("product.host", product.host)

    var slug = $routeParams.url_slug
    UserProfile.useCache(true)
    ProductPage.setTab($routeParams.tabName)
    $scope.uploadableHost = !_.contains(["dryad", "github", "figshare"], product.host)
    $scope.ProductPage = ProductPage


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
    renderProduct(product)

    $scope.$on("currentTab.name", function(newVal, oldVal){
      console.log("tab changed", newVal, oldVal)
    })








    /**********************************************
     *
     *  functions
     *
     **********************************************/



    function renderProduct(myProduct){
      console.log("rendering this product", myProduct)

      Page.setTitle(myProduct.biblio.display_title)
      Loading.clear()
      window.scrollTo(0,0)  // hack. not sure why this is needed.
      $scope.userSlug = slug
      $scope.loading = Loading
      $scope.aliases = myProduct.aliases
      $scope.biblio = myProduct.biblio
      $scope.metrics = myProduct.metrics
      $scope.displayGenrePlural = myProduct.display_genre_plural
      $scope.genre = myProduct.genre
      $scope.genre_icon = myProduct.genre_icon
      $scope.tiid = myProduct.tiid
      $scope.productHost = parseHostname(myProduct.aliases.resolved_url)
      $scope.freeFulltextHost = parseHostname(myProduct.biblio.free_fulltext_url)
      $scope.hasEmbeddedFile = false
      $scope.userWantsFullAbstract = true

      if (myProduct.embed_markup) {
        $scope.iframeToEmbed = myProduct.embed_markup
        $scope.hasEmbeddedFile = true
        $scope.userWantsFullAbstract = false
        console.log("have something to embed, so don't include a full abstract")
      }
      else {
        console.log("nothing to embed, so include a full absract")
      }
      
    }


    if (product.countries) {

      var countryList = product.countries.list
      MapService.setCountries(countryList)
      $scope.MapService = MapService
      $scope.countries = countryList

      var countryCounts = {}
      _.each(countryList, function(countryObj){
        countryCounts[countryObj.iso_code] = countryObj.event_sum
      })

      console.log("preparing to run the map", countryCounts)

      $(function(){
        console.log("running the map", countryCounts)
        $("#product-map").vectorMap({
          map: 'world_mill_en',
          backgroundColor: "#fff",
          zoomOnScroll: false,
          regionStyle: {
            initial: {
              fill: "#dddddd"
            }
          },
          series: {
            regions: [{
              values: countryCounts,
              scale: ['#C8EEFF', '#0071A4'],
              normalizeFunction: 'polynomial'
            }]
          },
          onRegionTipShow: MapService.makeRegionTipHandler(countryList),
          onRegionClick: function(event, countryCode){
            if (!countryCounts[countryCode]) {
              return false // no country pages for blank countries.
            }
            console.log("country code click!", countryCode)
          }
        })
      })
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
      console.log("re-rendering product.")
      ProductWithoutProfile.get({
        tiid: tiid // use copied tiid so it still works after quick route change.
      },
      function(data){
        console.log("inserting this new product data into the ProfileProducts service:", data)
        ProfileService.overwriteProduct(data)
        renderProduct(data)
      },
      function(data){
        $location.path("/"+slug) // replace this with "product not found" message...
      }
      )
    }

    // not used right now...
    $scope.fbShare = function(){
      console.log("trying to share", Page.getUrl())
      FB.ui(
        {
          method: 'share',
          href: Page.getUrl()
        },
        function(response) {
          if (response && !response.error_code) {
            console.log('Posting completed.');
          } else {
            console.log('Error while posting.');
          }
        }
      );
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
          $scope.reRenderProduct()
//          ProfileAboutService.get($routeParams.url_slug)
//          ProfileService.get($routeParams.url_slug)
        }
      )
    }

    $scope.afterSaveTest = function(){
      console.log("running after save.")
    }

    $scope.currentTab = {
      name: "summary"
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
                                          UserProfile,
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
        UserProfile.useCache(false)
        $scope.reRenderProduct() // calls parent scope function
      })
      .error(function(data){
        alert("Sorry, there was an error uploading your file!")
      })

    }
})

.controller("changeGenreModalCtrl", function($scope, $rootScope, Loading, ProductBiblio, tiid){
    $scope.foo = function(){
      console.log("we foo!")
    }


    $scope.genreConfigs = $rootScope.genreConfigs
    $scope.myGenre = {}



    $scope.saveGenre = function(){
      console.log("saving genre")

      ProductBiblio.patch(
        {'tiid': tiid},
        {genre: $scope.myGenre.input.name},
        function(resp){
          console.log("finished saving new genre", resp)
          Loading.finish("saveButton")
          return $scope.$close(resp)
        }
      )

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















