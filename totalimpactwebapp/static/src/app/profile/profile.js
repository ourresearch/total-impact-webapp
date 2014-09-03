angular.module("profile", [
  'resources.users',
  'resources.products',
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

.factory('UserProfile', function($window, $anchorScroll, $location, security, Slug, Page){
  var about = {}

  var cacheProductsSetting = false

  return {

    useCache: function(cacheProductsArg){
      // set or get the cache products setting.

      if (typeof cacheProductsArg !== "undefined"){
        cacheProductsSetting = !!cacheProductsArg
      }

      return cacheProductsSetting
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
    $sce,
    Users,
    UsersProducts,
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
    if (Page.isEmbedded()){
      // do embedded stuff. i don't think we're using this any more?
    }

    var $httpDefaultCache = $cacheFactory.get('$http')

    $scope.doneLoading = false
    $scope.doneRendering = false

    Timer.start("profileViewRender")
    Timer.start("profileViewRender.load")





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

    var url_slug = $routeParams.url_slug;
    var loadingProducts = true




    $scope.url_slug = url_slug
    $scope.loadingProducts = function(){
      return loadingProducts
    }
    $scope.userExists = true;

    $scope.hideSignupBannerNow = function(){
      $scope.hideSignupBanner = true

    }

    $scope.refresh = function(){
      var url = "/profile/"+ url_slug +"/products?action=refresh"
      console.log("POSTing to ", url)
      $http.post(url, {}).success(function(data, status, headers, config){
        console.log("POST returned. We're refreshing these tiids: ", data)

        // show the updated products
        renderProducts()
      })
    }


    $scope.humanDate = function(isoStr) {
      // using moment.js library imported from cdnjs at runtime. not encapsulated,
      // so will break in unit testing...
      return moment(isoStr).fromNow()
    }
    $scope.clickSignupLink = function(){
      TiMixpanel.track("Clicked profile footer signup link")
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


    // render the profile

    if (UserProfile.useCache() === false){
      // generally this will happen, since the default is false
      // and we set it back to false either way once this function
      // has run once.
      $httpDefaultCache.removeAll()
    }


    $scope.sliceSortedCards = function(cards, startIndex, endIndex){
      var sorted = _.sortBy(cards, "sort_by")
      var reversed = sorted.concat([]).reverse()
      return reversed.slice(startIndex, endIndex)
    }


    var renderProducts = function(){
      console.log("rendering products")
      Users.query({
        id: url_slug,
        embedded: Page.isEmbedded()
      },
        function(resp){
          console.log("got /profile resp back in "
            + Timer.elapsed("profileViewRender.load")
            + "ms: ", resp)

          // we only cache things one time
          UserProfile.useCache(false)

          // put our stuff in the scope
          $scope.profile = resp.about
          Page.setTitle(resp.about.given_name + " " + resp.about.surname)
          $scope.profileAwards = resp.awards
          $scope.doneLoading = true
          $scope.genres = resp.genres



          // got user back with products. if still refreshing, show update modal
          console.log("here's the is_refreshing before checking it", resp.is_refreshing)
          Update.showUpdateModal(url_slug, resp.is_refreshing).then(
            function(msg){
              console.log("updater (resolved):", msg)
              $httpDefaultCache.removeAll()
              renderProducts()
            },
            function(msg){
              console.log("updater (rejected):", msg)
            }
          )

          // do this async, in case security is taking a long time to load,
          // and the products load first.
          security.isLoggedInPromise(url_slug).then(
            function(){
              var numTrueProducts = _.where(resp.products, {is_true_product: true}).length
              TiMixpanel.track("viewed own profile", {
                "Number of products": numTrueProducts
              })
              if (resp.products.length == 0){
                console.log("logged-in user looking at own profile with no products. showing tour.")
                Tour.start(resp.about)
              }
            }
          )

          Timer.start("profileViewRender.render")
        },
        function(resp){
          console.log("problem loading the profile!", resp)
          $scope.userExists = false
        }
      );
    }

    renderProducts()
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




