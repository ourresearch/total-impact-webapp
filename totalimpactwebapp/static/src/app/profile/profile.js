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
//        var lastScrollPos = Page.getLastScrollPosition($location.path())
//        $window.scrollTo(0, lastScrollPos)
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
    Product,
    TiMixpanel,
    UserProfile,
    UserMessage,
    Update,
    Loading,
    ProfileService,
    ProfileAboutService,
    PinboardService,
    Tour,
    Timer,
    security,
    Page) {

    $scope.pinboardService = PinboardService
    $scope.$watch("pinboardService.cols", function(newVal, oldVal){
      PinboardService.saveState(true)
    }, true)

    $scope.sortableOptions = {
    }



    Timer.start("profileViewRender")
    Timer.start("profileViewRender.load")
    Page.setName('overview')

    var url_slug = $routeParams.url_slug;

    $timeout(function(){
        twttr.widgets.load()
    }, 1000)

    $scope.profileLoading =  ProfileService.isLoading
    $scope.url_slug = url_slug
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



    $scope.sliceSortedCards = function(cards, startIndex, endIndex){
      var sorted = _.sortBy(cards, "sort_by")
      var reversed = sorted.concat([]).reverse()
      return reversed.slice(startIndex, endIndex)
    }

    $scope.nFormat = function(num) {
      // from http://stackoverflow.com/a/14994860/226013
      if (num >= 1000000) {
          return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (num >= 1000) {
          return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      }
      return num;
    }




    ProfileService.get(url_slug).then(
      function(resp){
        // put our stuff in the scope
        console.log("putting resp in profile from controller", resp)
        $scope.profile = resp
        Page.setTitle(resp.about.given_name + " " + resp.about.surname)
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
      },
      function(resp){
        console.log("problem loading the profile!", resp)
        $scope.userExists = false
      }
    )


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




