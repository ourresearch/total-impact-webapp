angular.module("profile", [
  'resources.users',
  'product.product',
  'profileAward.profileAward',
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
  var slugIsCurrentUser = function(slug){
    if (!security.getCurrentUser()) return false;
    return (security.getCurrentUser().url_slug == slug);
  }

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
    loadUser: function($scope, slug) {
      return UsersAbout.get(
        {
          id: slug,
          idType: "url_slug"
        },
        function(resp) { // success
          console.log("got /about call back: ", resp.about)
          Page.setTitle(resp.about.given_name + " " + resp.about.surname)
          about = resp.about

          hasConnectedAccounts = _.some(about, function(v, k){
            return (k.match(/_id$/) && v)
          })



          if (!about.products_count && slugIsCurrentUser(about.url_slug)){
            console.log("calling Tour.start with ", about)
            Tour.start(about)
          }
        },
        function(resp) { // fail
          if (resp.status == 404) {
            $scope.userExists = false;
            $scope.slug = slug;
          }
        }
      );
    },
    'slugIsCurrentUser': slugIsCurrentUser,
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
    UsersProducts,
    Product,
    UserProfile,
    ProfileAwards,
    UserMessage,
    Update,
    Loading,
    Timer,
    Page) {
    if (Page.isEmbedded()){
      // do embedded stuff. i don't think we're using this any more?
    }

    var $httpDefaultCache = $cacheFactory.get('$http')

    // hack to make it easy to tell when update is done from selenium
    $scope.productsStillUpdating = true


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

      $scope.productsStillUpdating = false

      console.log(
        "finished rendering products in "
          + Timer.elapsed("renderProducts")
          + "ms"
      )

      // twttr is a GLOBAL VAR loaded by the twitter widget script called in
      //    bottom.js. it will break in unit tests, so fix before then.
        twttr.widgets.load()

    });

    $scope.hasConnectedAccounts = UserProfile.hasConnectedAccounts

    var userSlug = $routeParams.url_slug;
    var loadingProducts = true

    $scope.url_slug = userSlug
    $scope.loadingProducts = function(){
      return loadingProducts
    }
    $scope.userExists = true;
    $scope.filterProducts =  UserProfile.filterProducts;

    $scope.hideSignupBannerNow = function(){
      $scope.hideSignupBanner = true

    }

    $scope.refresh = function(){

      var url = "/user/"+ userSlug +"/products?action=refresh"

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

    $scope.user = UserProfile.loadUser($scope, userSlug);

    $scope.profileAwards = ProfileAwards.query(
      {id:userSlug},
      function(resp){
      }
    )

    $scope.currentUserIsProfileOwner = function(){
      return UserProfile.slugIsCurrentUser(userSlug);
    }

    $scope.openProfileEmbedModal = function(){
      $modal.open({
        templateUrl: "profile/profile-embed-modal.tpl.html",
        controller: "profileEmbedModalCtrl",
        resolve: {
          userSlug: function($q){ // pass the userSlug to modal controller.
            return $q.when(userSlug)
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
        {id: userSlug},
        {"tiids": [product._id]},
        function(){
          console.log("finished deleting", product.biblio.title)
        }
      )

    }



    var renderProducts = function(){
      Timer.start("getProducts")
      loadingProducts = true
      if (UserProfile.useCache() === false){
        // generally this will happen, since the default is falst
        // and we set it back to false either way once this function
        // has run once.
        $httpDefaultCache.removeAll()
      }

      UsersProducts.query({
        id: userSlug,
        includeHeadingProducts: true,
        embedded: Page.isEmbedded(),
        idType: "url_slug"
      },
        function(resp){
          console.log("loaded products in " + Timer.elapsed("getProducts") + "ms")

          // we only cache things one time
          UserProfile.useCache(false)

          var anythingStillUpdating = !!_.find(resp, function(product){
            return product.currently_updating
          })

          if (anythingStillUpdating) {
            Update.showUpdate(userSlug, renderProducts)
          }
          else {
            $scope.products = resp
          }


          Timer.start("renderProducts")
          loadingProducts = false

          // scroll to any hash-specified anchors on page. in a timeout because
          // must happen after page is totally rendered.
          $timeout(function(){
            UserProfile.scrollToCorrectLocation()
          }, 0)

        },
        function(resp){loadingProducts = false}
      );
    }
    $timeout(renderProducts, 100)
})





.controller("profileEmbedModalCtrl", function($scope, $location, Page, userSlug){
  console.log("user slug is: ", userSlug)

  var baseUrl = $location.protocol() + "://"
  baseUrl += $location.host()
  if ($location.port() === 5000){ // handle localhost special
    baseUrl += (":5000")
  }

  console.log("base url is ", baseUrl)


  $scope.userSlug = userSlug;
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




