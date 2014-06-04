angular.module("profile", [
  'resources.users',
  'product.product',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.loading',
  'services.timer',
  'profileSingleProducts',
  'profileLinkedAccounts',
  'services.userMessage',
  'services.tour',
  'directives.jQueryTools',
  'update.update'
])

.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/embed/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl'
  })

}])

.factory('UserProfile', function($window, $anchorScroll, $location, UsersAbout, security, Slug, Page, Tour){
  var about = {}

  var cacheProductsSetting = false
  var hasConnectedAccounts = false

  return {

    useCache: function(cacheProductsArg){
      // set or get the cache products setting.

      if (typeof cacheProductsArg !== "undefined"){
        cacheProductsSetting = !!cacheProductsArg
      }

      return cacheProductsSetting
    },
    hasConnectedAccounts: function(){
      return hasConnectedAccounts
    },
    makeAnchorLink: function(genre, account){
      var anchor = genre
      if (account) {
        anchor += ":" + encodeURIComponent(account)
      }
      return $location.path() + "#" + anchor
    },


    filterProducts: function(products, filterBy) {
      var productsWithMetrics = _.filter(products, function(x){return _.size(x.metrics); });
      var productsWitoutMetrics = _.filter(products, function(x){return x.metrics && _.size(x.metrics)==0; });

      if (filterBy == "withMetrics") {
        return productsWithMetrics;
      }
      else if (filterBy === "withoutMetrics") {
        return productsWitoutMetrics;
      }
      else {
        return productsWithMetrics.concat(productsWitoutMetrics);
      }
    },
    scrollToCorrectLocation: function(){
      if ($location.hash()){
        $anchorScroll()
      }
      else {
        var lastScrollPos = Page.getLastScrollPosition($location.path())
        $window.scrollTo(0, lastScrollPos)
      }
    },
    makeSlug: function(){
      about.url_slug = Slug.make(about.givenName, about.surname)
    },
    readyToCreateOnServer: function(){
      return about.url_slug && !id;
    },

    reset:function(){
      about = {}
    },

    setId: function(newId){id = newId},
    getId: function(){return id},
    getSlug: function(){return about.url_slug},
    "about": about
  }
})

.controller('ProfileCtrl', function (
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
    Users,
    UsersProducts,
    Product,
    UserProfile,
    UserMessage,
    Update,
    Loading,
    Timer,
    currentUserOwnsProfile,
    Page) {
    if (Page.isEmbedded()){
      // do embedded stuff. i don't think we're using this any more?
    }


    var $httpDefaultCache = $cacheFactory.get('$http')

    $scope.doneLoading = false
    $scope.doneRendering = false

    Timer.start("profileViewRender")
    Timer.start("profileViewRender.load")


    // filtering stuff
    $scope.productFilter = {
      has_new_metric: null,
      has_metrics: true
    }

    if ($location.search().filter == "has_new_metric") {
      $scope.productFilter.has_new_metric = true
    }


    $scope.setProductFilter = function(setting){

      if (setting == "all") {
        $scope.productFilter.has_new_metric = null
        $scope.productFilter.has_metrics = null
        $location.search("filter", null)
      }
      else if (setting == "has_metrics"){
        $scope.productFilter.has_new_metric = null
        $scope.productFilter.has_metrics = true
        $location.search("filter", null)
      }
      else if (setting == "has_new_metric"){
        $scope.productFilter.has_new_metric = true
        $scope.productFilter.has_metrics = true
        $location.search("filter", "has_new_metric")
      }

      console.log($scope.productFilter)

    }

    $scope.$on('$locationChangeStart', function(event, next, current){
      if ($location.search().filter == "has_new_metric"){
        console.log("filter=has_new_metric")
        $scope.productFilter.has_new_metric = true
        $scope.productFilter.has_metrics = true
      }
    })









    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.

      $scope.doneRendering = true

      console.log(
        "finished rendering products in "
          + Timer.elapsed("profileViewRender.render")
          + "ms"
      )

      // twttr is a GLOBAL VAR loaded by the twitter widget script called in
      //    bottom.js. it will break in unit tests, so fix before then.
        twttr.widgets.load()

    });

    $scope.hasConnectedAccounts = UserProfile.hasConnectedAccounts

    var url_slug = $routeParams.url_slug;
    var loadingProducts = true

    $scope.url_slug = url_slug
    $scope.loadingProducts = function(){
      return loadingProducts
    }
    $scope.userExists = true;
    $scope.filterProducts =  UserProfile.filterProducts;

    $scope.hideSignupBannerNow = function(){
      $scope.hideSignupBanner = true

    }

    $scope.refresh = function(){

      var url = "/user/"+ url_slug +"/products?action=refresh"

      console.log("POSTing to ", url)
      $http.post(url, {}).success(function(data, status, headers, config){
        console.log("POST returned. We're refreshing these tiids: ", data)
      })
    }

    $scope.humanDate = function(isoStr) {
      // using moment.js library imported from cdnjs at runtime. not encapsulated,
      // so will break in unit testing...
      return moment(isoStr).fromNow()
    }
    $scope.clickSignupLink = function(){
      analytics.track("Clicked signup link on profile")
    }


    $scope.currentUserIsProfileOwner = function(){
      return currentUserOwnsProfile
    }

    $scope.openProfileEmbedModal = function(){
      $modal.open({
        templateUrl: "profile/profile-embed-modal.tpl.html",
        controller: "profileEmbedModalCtrl",
        resolve: {
          url_slug: function($q){ // pass the url_slug to modal controller.
            return $q.when(url_slug)
          }
        }
      })
    }


    $scope.getSortScore = function(product) {
      return Product.getSortScore(product) * -1;
    }

    $scope.getMetricSum = function(product) {
      return Product.getMetricSum(product) * -1;
    }


    $scope.removeProduct = function(product){
      console.log("removing product: ", product)
      $scope.products.splice($scope.products.indexOf(product),1)
      UserMessage.set(
        "profile.removeProduct.success",
        false,
        {title: product.biblio.title}
      )

      // do the deletion in the background, without a progress spinner...
      UsersProducts.delete(
        {id: url_slug},
        {"tiids": [product._id]},
        function(){
          console.log("finished deleting", product.biblio.title)
        }
      )

    }



    // render the profile

    if (UserProfile.useCache() === false){
      // generally this will happen, since the default is false
      // and we set it back to false either way once this function
      // has run once.
      $httpDefaultCache.removeAll()
    }

    Users.query({
      id: url_slug,
      embedded: Page.isEmbedded()
    },
      function(resp){
        console.log("got /user resp back in "
          + Timer.elapsed("profileViewRender.load")
          + "ms: ", resp)

        // we only cache things one time
        UserProfile.useCache(false)

        // populate the user-about stuff
        $scope.profile = resp.about
        Page.setTitle(resp.about.given_name + " " + resp.about.surname)

//          if (!about.products_count && currentUserOwnsProfile){
//            Tour.start(about)
//          }


        $scope.products = resp.products
        $scope.profileAwards = resp.awards
        $scope.doneLoading = true


//        var anythingStillUpdating =  !_.all(resp.products, function(product){
//          return (!!product.is_heading || !!_(product.update_status).startsWith("SUCCESS"))
//        })
//
//        if (anythingStillUpdating) {
//          Update.showUpdate(url_slug, renderProducts)
//        }
//        else {
//          $scope.products = resp.products
//        }


        Timer.start("profileViewRender.render")

        // scroll to any hash-specified anchors on page. in a timeout because
        // must happen after page is totally rendered.
        $timeout(function(){
          UserProfile.scrollToCorrectLocation()
        }, 0)

      },
      function(resp){
        console.log("problem loading the profile!", resp)
        $scope.userExists = false
      }
    );
})





.controller("profileEmbedModalCtrl", function($scope, $location, Page, url_slug){
  console.log("user slug is: ", url_slug)

  var baseUrl = $location.protocol() + "://"
  baseUrl += $location.host()
  if ($location.port() === 5000){ // handle localhost special
    baseUrl += (":5000")
  }

  console.log("base url is ", baseUrl)


  $scope.url_slug = url_slug;
  $scope.baseUrl = baseUrl
  $scope.embed = {}
  $scope.embed.type = "badge"

})

.directive("backToProfile",function($location, Loading){
 return {
   restrict: 'A',
   replace: true,
   template:"<a ng-show='returnLink' class='back-to-profile btn btn-info btn-sm' href='{{ returnLink }}' ng-disabled='loading.is()'><i class='icon-chevron-left left'></i>back to profile</a>",
   link: function($scope,el){

     console.log("path: ", $location.path())

     $scope.returnLink = $location.path().split("/")[1]

     if ($scope.returnLink === "/embed") {
       $scope.returnLink = null
     }
   }
 }
})




