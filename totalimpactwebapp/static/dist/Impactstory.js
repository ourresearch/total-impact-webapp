/*! Impactstory - v0.0.1-SNAPSHOT - 2014-09-08
 * http://impactstory.org
 * Copyright (c) 2014 Impactstory;
 * Licensed MIT
 */
angular.module('accounts.account', [
  'directives.forms',
  'directives.onRepeatFinished',
  'services.loading',
  'googleScholar',
  'resources.users',
  'resources.products',
  'update.update',
  'profile'
])
.factory('Account', function(
    $q,
    Loading,
    Products,
    UsersLinkedAccounts,
    Users){

    var tiidsAdded = []

    var unlinkAccount = function(url_slug, accountObj){
      var deferred = $q.defer()

      var about = {}
      about[accountObj.accountHost + "_id"] = null



      Loading.start("saveButton")
      console.log("unlinking account " + accountObj.accountHost)
      Users.patch(
        {id:url_slug},
        {about: about},
        function(resp){
          deferred.resolve(resp)
          Loading.finish("saveButton")

        },
        function(resp){
          deferred(reject(resp))
          Loading.finish("saveButton")
        })

      return deferred.promise
    }



    var saveAccountInput = function(url_slug, accountObj) {

      var deferred = $q.defer()

      var about = {}
      var cleanUsername = accountObj.usernameCleanupFunction(accountObj.username.value)
      about[accountObj.accountHost + "_id"] = cleanUsername


      Loading.start("saveButton")
      Users.patch(
        {id:url_slug},
        {about: about},

        function(patchResp){
          // ok the userAbout object has this username in it now. let's slurp.

          console.log("telling webapp to update " + accountObj.accountHost)
          UsersLinkedAccounts.update(
            {id: url_slug, account: accountObj.accountHost},
            {},

            // got products back for this linked account
            function(updateResp){
              // we've kicked off a slurp for this account type. we'll add
              // as many products we find in that account, then dedup.
              // we'll return the list of new tiids

              console.log("update started for " + accountObj.accountHost + ". ", updateResp)
              Loading.finish("saveButton")
              deferred.resolve({
                updateResp: updateResp,
                patchResp: patchResp
              })
            },

            // ruh-roh, this linked account had no products with it.
            function(updateResp){

              // unlink this account from the user, since it's useless.
              about[accountObj.accountHost + "_id"] = null
              Users.patch(
                {id:url_slug},
                {about:about}
              ).$promise.then(function(resp){
                // now that this is cleaned out of the user, we can finish up.
                Loading.finish("saveButton")
                deferred.reject({
                  msg: "attempt to slurp in products from linked account failed",
                  resp: updateResp
                })
              })
            }

          )
        },
        function(patchResp){
          deferred.reject({
            failure: "PATCH to add external account failed; didn't even try slurping.",
            resp: patchResp
          })
        }
      )
      return deferred.promise
    }






    return {
      'saveAccountInput': saveAccountInput,
      unlinkAccount: unlinkAccount,
      getTiids: function(){return tiidsAdded}
    }

})


.controller('accountCtrl', function(
    $scope,
    $routeParams,
    $location,
    Products,
    GoogleScholar,
    UserProfile,
    Account,
    security,
    Loading,
    TiMixpanel){

  $scope.showAccountWindow = function(){
    $scope.accountWindowOpen = true;
    TiMixpanel.track("Opened an account window", {
      "Account name": $scope.account.displayName
    })

  }

  $scope.isLinked = function(){
    return !!$scope.account.username.value
  }

  $scope.isLinked = !!$scope.account.username.value

  $scope.setCurrentTab = function(index){$scope.currentTab = index}

  $scope.googleScholar = GoogleScholar

  $scope.showImportModal = function(){
    GoogleScholar.showImportModal()
    $scope.accountWindowOpen = false
  }


  $scope.onCancel = function(){
    $scope.accountWindowOpen = false;
  }

  $scope.unlink = function() {
    $scope.accountWindowOpen = false;
    $scope.isLinked = false

    Account.unlinkAccount($routeParams.url_slug, $scope.account).then(
      function(resp){
        console.log("finished unlinking!", resp)
        $scope.account.username.value = null
        security.refreshCurrentUser() // the current user looks different now, no account

      }
    )
  }

  $scope.onLink = function(){
    console.log(
      _.sprintf("calling /profile/%s/linked-accounts/%s with userInput:",
        $routeParams.url_slug,
        $scope.account.accountHost),
      $scope.account
    )

    $scope.accountWindowOpen = false

    console.log("linking an account other than google scholar")
    Loading.start($scope.account.accountHost)
    Account.saveAccountInput($routeParams.url_slug, $scope.account)
      .then(

      // linked this account successfully
      function(resp){
        console.log("successfully saved linked account", resp)

        if ($scope.account.accountHost == "google_scholar"){
          GoogleScholar.showImportModal()
        }

        $scope.isLinked = true
        TiMixpanel.track("Linked an account", {
          "Account name": $scope.account.displayName
        })
         // make sure everyone can see the new linked account
        security.refreshCurrentUser().then(
          function(resp){
            console.log("update the client's current user with our new linked account", resp)
            Loading.finish($scope.account.accountHost)
          }
        )
      },

      // couldn't link to account
      function(resp){
        console.log("failure at saving inputs :(", resp)
        Loading.finish($scope.account.accountHost)
        alert("Sorry, we weren't able to link this account. You may want to fill out a support ticket.")
      }
    )
  }
})

angular.module('accounts.allTheAccounts', [
  'accounts.account'
])

.factory('AllTheAccounts', function(){

  var importedProducts = []
  var accounts = {
//    academia_edu: {
//      displayName: "Academia.edu",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://academia.edu',
//      descr: "Academia.edu is a place to share and follow research.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "http://your_university.academia.edu/your_username"
//      }
//    },

    figshare: {
      displayName: "figshare",
      url: "http://figshare.com",
      sync: true,
      descr: "Figshare is a repository where users can make all of their research outputs available in a citable, shareable and discoverable manner.",
      username:{
            inputNeeded: "author page URL",
            placeholder: "http://figshare.com/authors/your_username/12345"

      },
      usernameCleanupFunction: function(x) {
              if (typeof x==="undefined") return x;
              return('http://'+x.replace('http://', ''))
      }
    },

    github: {
      displayName: "GitHub",
      sync: true,
      usernameCleanupFunction: function(x){return x},
      url: 'http://github.com',
      descr: "GitHub is an online code repository emphasizing community collaboration features.",
      username: {
        inputNeeded: "username",
        help: "Your GitHub account ID is at the top right of your screen when you're logged in."
      }
    },

    google_scholar: {
      displayName: "Google Scholar",
      sync:false,
      usernameCleanupFunction: function(x){return x},
      url: 'http://scholar.google.com/citations',
      descr: "Google Scholar profiles find and show researchers' articles as well as their citation impact.",
      username: {
        inputNeeded: "profile URL",
        placeholder: "http://scholar.google.ca/citations?user=your_user_id"
      }
    },

//    linkedin: {
//      displayName: "LinkedIn",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://linkedin.com',
//      descr: "LinkedIn is a social networking site for professional networking.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "http://www.linkedin.com/in/your_username"
//      }
//    },

//    mendeley: {
//      displayName: "Mendeley",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://mendeley.com',
//      descr: "Mendeley is a desktop and web program for managing and sharing research papers,discovering research data, and collaborating online.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "http://www.mendeley.com/profiles/your_username"
//      }
//    },

    orcid: {
      displayName: "ORCID",
      sync: true,
      username:{
        inputNeeded: "ID",
        placeholder: "http://orcid.org/xxxx-xxxx-xxxx-xxxx",
        help: "You can find your ID at top left of your ORCID page, beneath your name (make sure you're logged in)."
      },
      usernameCleanupFunction: function(x) {return(x.replace('http://orcid.org/', ''))},
      url: 'http://orcid.org',
      signupUrl: 'http://orcid.org/register',
      descr: "ORCID is an open, non-profit, community-based effort to create unique IDs for researchers, and link these to research products. It's the preferred way to import products into Impactstory.",
      extra: "If ORCID has listed any of your products as 'private,' you'll need to change them to 'public' to be imported."
    },

//    researchgate: {
//      displayName: "ResearchGate",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://researchgate.net',
//      descr: "ResearchGate is a social networking site for scientists and researchers to share papers, ask and answer questions, and find collaborators.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "https://www.researchgate.net/profile/your_username"
//      }
//    },

    slideshare: {
      displayName: "SlideShare",
      sync: true,
      usernameCleanupFunction: function(x){return x},
      url:'http://slideshare.net',
      descr: "SlideShare is community for sharing presentations online.",
      username: {
          help: "Your username is right after \"slideshare.net/\" in your profile's URL.",
          inputNeeded: "username"
      }
    }


   ,twitter: {
     displayName: "Twitter",
     sync: true,     
     usernameCleanupFunction: function(x) {return('@'+x.replace('@', ''))},
     url:'http://twitter.com',
     descr: "Twitter is a social networking site for sharing short messages.",
     username: {
         inputNeeded: "username",
         placeholder: "@example",
         help: "Your Twitter username is often written starting with @."
     }
   }

  }





  var makeLogoPath = function(displayName) {
    return '/static/img/logos/' + _(displayName.toLowerCase()).dasherize() + '.png';
  }


  var makeEndpoint = function(account) {
    if (account.endpoint) {
      return account.endpoint
    }
    else {
      return makeName(account.displayName)
    }
  }


  var makeCSSName = function(accountName) {
    return accountName.replace(/ /g, '-').toLowerCase()

  }


  return {
    addProducts: function(products) {
      importedProducts = importedProducts.concat(products)
}   ,
    getProducts: function(){
      return importedProducts
    },
    accountServiceNamesFromUserAboutDict:function(userAboutDict){

    },

    get: function(userDict){

      var ret = []
      var accountsConfig = angular.copy(accounts)

      _.each(accountsConfig, function(accountObj, accountHost){
        var userDictAccountKey = accountHost + "_id"


        accountObj.username.value = userDict[userDictAccountKey]


        accountObj.accountHost = accountHost
        accountObj.CSSname = makeCSSName(accountObj.displayName)
        accountObj.logoPath = makeLogoPath(accountObj.displayName)

        ret.push(accountObj)
      })

      return _.sortBy(ret, function(account){
        return account.displayName.toLocaleLowerCase();
      })

    }

  }



})

// setup libs outside angular-land. this may break some unit tests at some point...#problemForLater
// Underscore string functions: https://github.com/epeli/underscore.string
_.mixin(_.str.exports());


angular.module('app', [
  'placeholderShim',
  'ngCookies',
  'ngRoute',
  'ngSanitize',
  'ngEmbedApp',
  'ngAnimate',
  'emguo.poller',
  'services.loading',
  'services.userMessage',
  'services.routeChangeErrorHandler',
  'services.page',
  'services.breadcrumbs',
  'services.tiMixpanel',
  'security',
  'directives.crud',
  'directives.jQueryTools',
  'templates.app',
  'templates.common',
  'infopages',
  'signup',
  'passwordReset',
  'productPage',
  'genrePage',
  'services.profileService',
  'profileSidebar',
  'settings',
  'xeditable'
]);

angular.module('app').constant('TEST', {
  baseUrl: 'http://localhost:5000/',
  otherKey: 'value'
});


angular.module('app').config(function ($routeProvider,
                                       $sceDelegateProvider,
                                       $locationProvider) {
  $locationProvider.html5Mode(true);

  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow google docs embedding.  Notice the difference between * and **.
    'http://docs.google.com/**',
    'http://www.slideshare.net/**'

  ]);



  // want to make sure the user profile route loads last, because it's super greedy.
  $routeProvider.when("/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl',
    reloadOnSearch: false
  })
  $routeProvider.otherwise({
    template:'<div class="no-page"><h2>Whoops!</h2><p>Sorry, this page doesn\'t exist. Perhaps the URL is mistyped?</p></div>'
  });



});


angular.module('app').run(function(security, $window, Page, $location, editableOptions) {
  // Get the current user when the application starts
  // (in case they are still logged in from a previous session)
  security.requestCurrentUser();

  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

  angular.element($window).bind("scroll", function(event) {
    Page.setLastScrollPosition($(window).scrollTop(), $location.path())
  })

});


angular.module('app').controller('AppCtrl', function($scope,
                                                     $window,
                                                     $route,
                                                     $sce,
                                                     UserMessage,
                                                     $location,
                                                     Loading,
                                                     Page,
                                                     Breadcrumbs,
                                                     security,
                                                     $rootScope,
                                                     TiMixpanel,
                                                     RouteChangeErrorHandler) {

  $scope.userMessage = UserMessage
  $rootScope.security = security

  security.requestCurrentUser().then(function(currentUser){

    if (!currentUser){
      // ain't no one logged in.
    }
    else if (!currentUser.is_live){
    }
    else if (currentUser.is_trialing){
//      UserMessage.set(
//        'subscription.trialing',
//        true,
//        {daysLeft: currentUser.days_left_in_trial}
//      );
    }

  })

  $scope.page = Page;
  $scope.breadcrumbs = Breadcrumbs;
  $scope.loading = Loading;
  $scope.isAuthenticated =  security.isAuthenticated
  $scope.tiMixpanel = TiMixpanel
  $scope.modalOpen = function(){
    return $rootScope.modalOpen
  }

  $scope.trustHtml = function(str){
    return $sce.trustAsHtml(str)
  }


  $scope.$on('$routeChangeError', function(event, current, previous, rejection){
    RouteChangeErrorHandler.handle(event, current, previous, rejection)
  });

  $scope.$on('$routeChangeSuccess', function(next, current){
    security.requestCurrentUser().then(function(currentUser){
      Page.sendPageloadToSegmentio()
    })

  })

  $scope.$on('$locationChangeStart', function(event, next, current){
    Page.showHeader(true)
    Page.showFooter(true)
    Page.setProfileUrl(false)
    Breadcrumbs.clear()
    Loading.clear()
  })

});


angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'security', 'httpRequestTracker',
  function ($scope, $location, $route, security, httpRequestTracker) {

  $scope.location = $location;


  $scope.home = function () {
    console.log("home!")
    if (security.isAuthenticated()) {
      $location.path('/' + security.requestCurrentUser().url_slug);
    } else {
      $location.path('/');
    }
  };

  $scope.hasPendingRequests = function () {
    return httpRequestTracker.hasPendingRequests();
  };
}]);

angular.module("genrePage", [
  'resources.users',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.loading',
  'services.timer',
  'services.userMessage'
])

.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/products/:genre_name", {
    templateUrl:'genre-page/genre-page.tpl.html',
    controller:'GenrePageCtrl'
  })

}])

.factory("GenrePage", function(){
  var cacheProductsSetting = false

  return {
    useCache: function(cacheProductsArg){  // setter or getter
      if (typeof cacheProductsArg !== "undefined"){
        cacheProductsSetting = !!cacheProductsArg
      }
      return cacheProductsSetting
    }
  }
})




.controller('GenrePageCtrl', function (
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
    Tour,
    Timer,
    security,
    ProfileService,
    Page) {


    Timer.start("genreViewRender")
    Timer.start("genreViewRender.load")
    Page.setName($routeParams.genre_name)
    $scope.url_slug = $routeParams.url_slug
    var rendering = true

    $scope.isRendering = function(){
      return rendering
    }

    ProfileService.get($routeParams.url_slug).then(
      function(resp){
        console.log("genre page loaded products", resp)
        Page.setTitle(resp.about.full_name + "'s " + $routeParams.genre_name)

        $scope.about = resp.about
        $scope.products = ProfileService.productsByGenre($routeParams.genre_name)
        $scope.genreNamePlural = ProfileService.genreLookup($routeParams.genre_name).plural_name

        // scroll to the last place we were on this page. in a timeout because
        // must happen after page is totally rendered.
        $timeout(function(){
          var lastScrollPos = Page.getLastScrollPosition($location.path())
          $window.scrollTo(0, lastScrollPos)
        }, 0)
      },
      function(resp){
        console.log("ProfileService failed in genrePage.js...", resp)
      }
    )




    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
      // fired by the 'on-repeat-finished" directive in the main products-rendering loop.
      rendering = false
      console.log("finished rendering genre products in " + Timer.elapsed("genreViewRender") + "ms"
      )
    });



    $scope.removeProduct = function(product){
//      alert("Sorry! Product deletion is temporarily disabled. It'll be back soon.")
      console.log("removing product: ", product)
      $scope.products.splice($scope.products.indexOf(product),1)
      UserMessage.set(
        "profile.removeProduct.success",
        false,
        {title: product.display_title}
      )

      // do the deletion in the background, without a progress spinner...
      Product.delete(
        {user_id: $routeParams.url_slug, tiid: product._tiid},
        function(){
          console.log("finished deleting", product.display_title)
          TiMixpanel.track("delete product", {
            tiid: product._tiid,
            title: product.display_title
          })
        }
      )
    }

})







angular.module("googleScholar", [
 "security",
 "resources.users"

])
.factory("GoogleScholar", function($modal,
                                   $q,
                                   UsersProducts,
                                   Loading,
                                   TiMixpanel,
                                   security){
  var bibtex = ""
  var tiids = []
  var bibtexArticlesCount = function(){
    var matches = bibtex.match(/^@/gm)
    if (matches) {
      return matches.length
    }
    else {
      return 0
    }
  }

  return {
    bibtexArticlesCount: bibtexArticlesCount,
    setBibtex: function(newBibtex){
      bibtex = newBibtex
      console.log("new bibtex just got set!")
    },
    getBibtex: function(){
      console.log("getting bibtex!", bibtex)
      return bibtex
    },
    showImportModal: function(){
      $modal.open({
        templateUrl: "google-scholar/google-scholar-modal.tpl.html",
        controller: "GoogleScholarModalCtrl",
        resolve: {
          currentUser: function(security){
            security.clearCachedUser()
            return security.requestCurrentUser()
          }
        }
      })
    },
    sendToServer: function(){
      console.log(
        "sending this bibtex to /importers/bibtex: ",
        bibtex.substring(0, 50) + "..."
      )

      Loading.start("bibtex")

      TiMixpanel.track("Uploaded Google Scholar", {
        "Number of products": bibtexArticlesCount()
      })

      return UsersProducts.patch(
        {id: security.getCurrentUser("url_slug")},
        {bibtex: bibtex},
        function(resp){
          console.log("successfully uploaded bibtex!", resp)
          Loading.finish("bibtex")

        },
        function(resp){
          console.log("bibtex import failed :(")
          Loading.finish("bibtex")
          alert("Sorry, we weren't able to load your Google Scholar data! " +
            "Could you fill out a support ticket for us (click the orange tab " +
            "on the right of your screen). That way we can fix it right away.")
        }
      )
    },
    getTiids: function(){
      return tiids
    }
  }

  })

  .controller("GoogleScholarModalCtrl", function($scope, GoogleScholar, currentUser, Loading){
    console.log("google scholar modal controller activated!")
    $scope.currentUser = currentUser
    $scope.googleScholar = GoogleScholar
    $scope.loading = Loading

    $scope.sendToServer = function(){
      GoogleScholar.sendToServer().$promise.then(function(resp){
        console.log("finished with the upload, here's the resp", resp)
        $scope.importComplete = true
//        $scope.importedProductsCount = resp.data.products.length
        $scope.importedProductsCount = null
      })
    }

    $scope.$on("fileLoaded", function(event, result){
      GoogleScholar.setBibtex(result)
      $scope.fileLoaded = true
      $scope.$apply()
    })



  })

angular.module( 'infopages', [
    'security',
    'services.page',
    'services.tiMixpanel',
    'directives.fullscreen'
  ])
  .factory("InfoPages", function ($http) {
    var getProvidersInfo = function () {
      return $http.get("/providers").then(
        function (resp) {
          return _.filter(resp.data, function (provider) {
            // only show providers with a description
            return !!provider.descr
          })
        },
        function (resp) {
          console.log("/providers failed.")
        }
      )
    }
    return {
      'getProvidersInfo': getProvidersInfo
    }
  })

  .config(['$routeProvider', function($routeProvider, InfoPages, security) {
    $routeProvider

      .when('/', {
        templateUrl: 'infopages/landing.tpl.html',
        controller: 'landingPageCtrl',
        resolve:{
          allowed: function(security){
            return security.testUserAuthenticationLevel("loggedIn", false)
          }
        }
      })
      .when('/h-index', {
        templateUrl: 'infopages/landing.tpl.html',
        controller: 'hIndexLandingPageCtrl',
        resolve:{
          allowed: function(security){
            return security.testUserAuthenticationLevel("loggedIn", false)
          }
        }
      })
      .when('/open-science', {
        templateUrl: 'infopages/landing.tpl.html',
        controller: 'openScienceLandingPageCtrl',
        resolve:{
          allowed: function(security){
            return security.testUserAuthenticationLevel("loggedIn", false)
          }
        }
      })
      .when('/faq', {
        templateUrl: 'infopages/faq.tpl.html',
        controller: 'faqPageCtrl',
        resolve: {
          providersInfo: function(InfoPages){
            return InfoPages.getProvidersInfo()
          }
        }
      })
      .when('/about', {
        templateUrl: 'infopages/about.tpl.html',
        controller: 'aboutPageCtrl'
      })
      .when('/advisors', {
        templateUrl: 'infopages/advisors.tpl.html',
        controller: 'advisorsPageCtrl'
      })
      .when('/spread-the-word', {
        templateUrl: 'infopages/spread-the-word.tpl.html',
        controller: 'SpreadTheWordCtrl'
      })
      .when('/collection/:cid', {
        templateUrl: 'infopages/collection.tpl.html',
        controller: 'collectionPageCtrl'
      })
      .when('/item/*', {
        templateUrl: 'infopages/collection.tpl.html',
        controller: 'collectionPageCtrl'
      })
  }])

  .controller( 'landingPageCtrl', function landingPageCtrl ( $scope, Page, TiMixpanel ) {
//    TiMixpanel.registerOnce({
//      "selling points": _.sample([
//        "impacts, products, free",
//        "impacts, products, notifications"
//      ])
//    })

    TiMixpanel.track("viewed landing page")

    var signupFormShowing = false
    $scope.landingPageType = "main"
    Page.showHeader(false)
    Page.setUservoiceTabLoc("hidden")
    Page.setTitle("Share the full story of your research impact.")

  })

  .controller("hIndexLandingPageCtrl", function($scope, Page){
    $scope.landingPageType = "h-index"
    Page.showHeader(false)
    Page.setUservoiceTabLoc("hidden")
    Page.setTitle("Share the full story of your research impact.")
  })

  .controller("openScienceLandingPageCtrl", function($scope, Page){
    $scope.landingPageType = "open-science"
    Page.showHeader(false)
    Page.setUservoiceTabLoc("hidden")
    Page.setTitle("Share the full story of your research impact.")
  })

  .controller( 'faqPageCtrl', function faqPageCtrl ( $scope, Page, providersInfo) {
    Page.setTitle("FAQ")
    $scope.providers = providersInfo
    console.log("faq page controller running")
  })

  .controller( 'aboutPageCtrl', function aboutPageCtrl ( $scope, Page ) {
    Page.setTitle("about")

  })

  .controller('advisorsPageCtrl', function($scope, Page) {
    Page.setTitle("advisors")

  })
  .controller('SpreadTheWordCtrl', function($scope, Page) {
    Page.setTitle("Spread the word")

  })

  .controller( 'collectionPageCtrl', function aboutPageCtrl ( $scope, Page ) {
    Page.setTitle("Collections are retired")

  });


angular.module('passwordReset', [
    'resources.users',
    'services.loading',
    'services.page',
    'services.userMessage',
    'directives.spinner',
    'security',
    'directives.forms'])

  .config(function ($routeProvider) {

  $routeProvider.when('/reset-password/:resetToken',
  {
    templateUrl:'password-reset/password-reset.tpl.html'
  }
  )
})

.controller("passwordResetFormCtrl", function($scope, $location, $routeParams, Loading, Page, UsersPassword, UserMessage, security){
  console.log("reset token", $routeParams.resetToken)

  $scope.password = ""
  $scope.onSave = function(){
    console.log("submitting password to change", $scope.password)
    Loading.start("saveButton")
    UsersPassword.save(
      {id: $routeParams.resetToken, id_type:"reset_token"},
      {newPassword: $scope.password},
      function(resp) {
        UserMessage.set('passwordReset.success', true);
        $location.path("/")
        security.showLogin()
      },
      function(resp) {
        UserMessage.set('passwordReset.error.invalidToken');
        Loading.finish('saveButton')
        $scope.password = "";  // reset the form
      }
    )
  }
  $scope.onCancel = function(){
    $location.path("/")
  }
})
angular.module("productPage", [
    'resources.users',
    'resources.products',
    'profileAward.profileAward',
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
    UserProfile,
    Product,
    Loading,
    TiMixpanel,
    ProductBiblio,
    ProductInteraction,
    product,
    profileWithoutProducts,
    ProductWithoutProfile,
    Breadcrumbs,
    Page) {

    console.log("product.host", product.host)
    Breadcrumbs.set(0, {
      text: profileWithoutProducts.full_name,
      url: "/" + profileWithoutProducts.url_slug
    })
    Breadcrumbs.set(1, {
      text: product.display_genre_plural,
      url: "/" + profileWithoutProducts.url_slug + "/products/" + product.genre
    })



    var slug = $routeParams.url_slug
    UserProfile.useCache(true)
    $scope.uploadableHost = !_.contains(["dryad", "github", "figshare"], product.host)


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
    renderProduct(product)








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
      $scope.profileWithoutProducts = profileWithoutProducts
      $scope.userSlug = slug
      $scope.loading = Loading
      $scope.aliases = myProduct.aliases
      $scope.biblio = myProduct.biblio
      $scope.metrics = myProduct.metrics
      $scope.displayGenrePlural = myProduct.display_genre_plural
      $scope.genre = myProduct.genre
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




    // this should really be a directive...
    // from http://stackoverflow.com/a/21516924
    function parseHostname(url){
      var urlParser = document.createElement('a')
      urlParser.href = url
      console.log("hostname", urlParser.hostname)
      return urlParser.hostname.replace("www.", "")
    }



    $scope.reRenderProduct = function(){
      ProductWithoutProfile.get({
        tiid: $routeParams.tiid
      },
      function(data){
        console.log("re-rendering the product", data)
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
















angular.module('profileAward.profileAward', [])
  .factory('ProfileAward', function() {
    return {
      test: function foo(){}
    }

})

  .controller('ProfileAwardCtrl', function ($scope, ProfileAward) {

  })


angular.module('profileLinkedAccounts', [
  'accounts.allTheAccounts',
  'services.page',
  'accounts.account',
  'resources.users'
])

  .config(['$routeProvider', function($routeProvider, UserAbout) {

    $routeProvider
      .when("/:url_slug/accounts", {
        templateUrl: 'profile-linked-accounts/profile-linked-accounts.tpl.html',
        controller: 'profileLinkedAccountsCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          },
          currentUser: function(security){
            return security.requestCurrentUser()
          }
        }
      })

  }])
  .controller("profileLinkedAccountsCtrl", function($scope, Page, $routeParams, AllTheAccounts, currentUser){


    Page.showHeader(false)
    Page.showFooter(false)

    console.log("linked accounts page. current user: ", currentUser)

    $scope.accounts = AllTheAccounts.get(currentUser)
    $scope.returnLink = "/"+$routeParams.url_slug



  })
angular.module('profileSidebar', [
    'security',
    'resources.users',
    'services.profileService'
])
  .controller("profileSidebarCtrl", function($scope, $rootScope, ProfileService, Page, security){

    $scope.page = Page
    ProfileService.getCached().then(
      function(resp){
        $scope.profile = resp
      }
    )





  })
angular.module('profileSingleProducts', [
  'services.page',
  'resources.users',
  'services.loading'

])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when("/:url_slug/products/add", {
        templateUrl: 'profile-single-products/profile-single-products.tpl.html',
        controller: 'addSingleProductsCtrl',
        resolve:{
          userOwnsThisProfile: function(security){
            return security.testUserAuthenticationLevel("ownsThisProfile")
          }
        }
      })

  }])
  .controller("addSingleProductsCtrl", function($scope, Page, $routeParams){
    Page.showHeader(false)
    Page.showFooter(false)
    $scope.url_slug = $routeParams.url_slug


  })
  .controller("ImportSingleProductsFormCtrl", function($scope,
                                                       $location,
                                                       $routeParams,
                                                       $cacheFactory,
                                                       Loading,
                                                       UsersProducts,
                                                       TiMixpanel,
                                                       security){

    $scope.newlineDelimitedProductIds = ""
    $scope.onCancel = function(){
      security.redirectToProfile()
    }


    $scope.onSubmit = function(){
      Loading.start("saveButton")

      var productIds = _.compact($scope.newlineDelimitedProductIds.split("\n"))

      UsersProducts.patch(
        {id: $routeParams.url_slug},
        {product_id_strings: productIds},
        function(resp){
          console.log("saved some single products!", resp)
          TiMixpanel.track(
            "Added single products",
            {productsCount: resp.products.length}
          )
          Loading.finish("saveButton")
          security.redirectToProfile()

        },
        function(resp){
          console.log("failed to save new products :(", resp)
          Loading.finish("saveButton")
          alert("Oops! Looks like there was an error importing your products! " +
            "We've logged the error, but please feel free to open a support " +
            "ticket, too (click the orange tab on the right of the screen).")

        }
      )


    }

  })
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
    Tour,
    Timer,
    security,
    Page) {


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





// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security', [
  'security.service',
  'security.login'
]);

angular.module('security.login.form', [
    'directives.forms',
    'services.page',
    'services.loading',
    'services.userMessage',
    'security.login.resetPassword',
    'ui.bootstrap'
  ])

// The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
// This controller and its template (login/form.tpl.html) are used in a modal dialog box by the security service.
.controller('LoginFormController', function($scope, security, $modalInstance, $modal, UserMessage, Page, Loading) {
  var reportError = function(status){
    var key
    if (status == 401) {
      UserMessage.set("login.error.invalidPassword")
    }
    else if (status == 404) {
      UserMessage.set("login.error.invalidUser")
    }
    else {
      UserMessage.set("login.error.serverError")
    }

  }
  var dismissModal = function(){
    UserMessage.remove()
    UserMessage.showOnTop(true)
    $modalInstance.dismiss('cancel');
    Loading.finish('login')
  }

  UserMessage.showOnTop(false)
  $scope.user = {};
  $scope.loading = Loading
  $scope.userMessage = UserMessage



  $scope.login = function () {
    // Clear any previous security errors
    Loading.start('login')

    // Try to login
    security.login($scope.user.email, $scope.user.password)
      .success(function(data, status){
        dismissModal()
        security.redirectToProfile()
      })
      .error(function(data, status){
        console.log("login error!", status)
        Loading.finish('login')
        reportError(status)
      })
  };
  $scope.showForgotPasswordModal = function(){
    console.log("launching the forgot password modal.")
    dismissModal()

    var forgotPasswordModal = $modal.open({
      templateUrl: "security/login/reset-password-modal.tpl.html",
      controller: "ResetPasswordModalCtrl",
      windowClass: "creds forgot-password"
    })
  }

  $scope.cancel = function () {
    dismissModal()
  };


});
angular.module('security.login', [
  'security.login.form',
  'security.login.toolbar'
]);
angular.module('security.login.resetPassword',
  ['ui.bootstrap']
)
.controller('ResetPasswordModalCtrl', function($scope, $http, security, $modalInstance) {
  $scope.user = {}
  var emailSubmittedBool = false
  $scope.emailSubmitted = function(){
    return emailSubmittedBool
  }
  $scope.sendEmail = function(){
    emailSubmittedBool = true
    var url = "/profile/" + $scope.user.email + "/password?id_type=email"
    $http.get(url).then(function(resp){
      console.log("response!", resp)
    })

  }

  $scope.close = function(){
    $modalInstance.close()
  }
})

angular.module('security.login.toolbar', [
  'ui.bootstrap',
  'services.page',
  'security',
  'resources.users'
  ])

// The loginToolbar directive is a reusable widget that can show login or logout buttons
// and information the current authenticated user
.directive('loginToolbar', function($http, Page, security) {
  var directive = {
    templateUrl: 'security/login/toolbar.tpl.html',
    restrict: 'E',
    replace: true,
    scope: true,
    link: function($scope, $element, $attrs, $controller) {
      $scope.login = security.showLogin;
      $scope.logout = security.logout;
      $scope.page = Page  // so toolbar can change when you're on  landing page.

      $scope.illuminateNotificationIcon = function(){

        var user = security.getCurrentUser()
        if (user){
          var dismissed = user.new_metrics_notification_dismissed
          var latestMetrics = user.latest_diff_timestamp
          if (!dismissed && latestMetrics) {
            return true // never hit dismissed before
          }
          else if (dismissed && latestMetrics && latestMetrics > dismissed) {
            return true // new stuff since they last dismissed
          }
          else {
            return false // brand new profile, or no new metrics since dismissal
          }

        }
        else {
          return false
        }

      }

      $scope.dismissProfileNewProductsNotification = function(){

        $http.get("/profile/current/notifications/new_metrics_notification_dismissed?action=dismiss").success(function(data, status){
          console.log("new metrics notification dismissed", data.user)
          security.setCurrentUser(data.user)
        })

      }

      $scope.$watch(function() {
        return security.getCurrentUser();
      }, function(currentUser) {
        $scope.currentUser = currentUser;
      });
    }
  };
  return directive;
});
// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security.service', [
    'services.userMessage',
    'services.tiMixpanel',
    'security.login',         // Contains the login form template and controller
    'ui.bootstrap'     // Used to display the login form as a modal dialog.
  ])

  .factory('security', function($http,
                                $q,
                                $location,
                                $modal,
                                TiMixpanel,
                                UserMessage) {
    var useCachedUser = true
    var currentUser = globalCurrentUser || null
    console.log("logging in from object: ", currentUser)
    TiMixpanel.registerFromUserObject(currentUser)



    // Redirect to the given url (defaults to '/')
    function redirect(url) {
      url = url || '/';
      $location.path(url);
    }

    // Login form dialog stuff
    var loginDialog = null;
    function openLoginDialog() {
      console.log("openLoginDialog() fired.")
      loginDialog = $modal.open({
        templateUrl: "security/login/form.tpl.html",
        controller: "LoginFormController",
        windowClass: "creds"
      });
      loginDialog.result.then();
    }



    var currentUrlSlug = function(){
      var m = /^(\/signup)?\/([-\w\.]+)\//.exec($location.path())
      var current_slug = (m) ? m[2] : false;
      console.log("current slug is", current_slug)
      return current_slug
    }


    // The public API of the service
    var service = {

      showLogin: function() {
        openLoginDialog();
      },

      login: function(email, password) {
        return $http.post('/profile/current/login', {email: email, password: password})
          .success(function(data, status) {
            console.log("user just logged in: ", currentUser)
            currentUser = data.user;
            TiMixpanel.identify(currentUser.id)
            TiMixpanel.registerFromUserObject(currentUser)
          })
      },

      currentUserOwnsProfile: function(profileSlug){
        var deferred = $q.defer()

        service.requestCurrentUser().then(
          function(user){
            if (user && user.url_slug && user.url_slug == profileSlug){
              deferred.resolve(true)
            }
            else {
              deferred.resolve(false)
            }
          }
        )

        return deferred.promise
      },

      testUserAuthenticationLevel: function(level, falseToNegate){

        var negateIfToldTo  = function(arg){
          return (falseToNegate === false) ? !arg : arg
        }

        var makeErrorMsg = function(msg){
          if (falseToNegate === false) { // it was supposed to NOT be this level, but it was.
            return msg
          }
          return "not" + _.capitalize(level) // it was supposed to be this level, but wasn't.
        }

        var levelRules = {
          anon: function(user){
            return !user
          },
          partlySignedUp: function(user){
            return (user && user.url_slug && !user.email)
          },
          loggedIn: function(user){
            return (user && user.url_slug && user.email)
          },
          ownsThisProfile: function(user){
//          return true

            return (user && user.url_slug && user.url_slug == currentUrlSlug())

          }
        }


        var deferred = $q.defer()
        service.requestCurrentUser().then(
          function(user){
            var shouldResolve = negateIfToldTo(levelRules[level](user))

            if (shouldResolve){
              deferred.resolve(level)
            }
            else {
              deferred.reject(makeErrorMsg(level))
            }

          }
        )
        return deferred.promise
      },

      // Ask the backend to see if a user is already authenticated - this may be from a previous session.
      requestCurrentUser: function() {
        if (useCachedUser) {
          return $q.when(currentUser);

        } else {
          return service.refreshCurrentUser()
        }
      },

      refreshCurrentUser: function(){
        console.log("logging in from cookie")
        return $http.get('/profile/current')
          .success(function(data, status, headers, config) {
            useCachedUser = true
            currentUser = data.user;
            console.log("successfully logged in from cookie.")
            TiMixpanel.identify(currentUser.id)
            TiMixpanel.registerFromUserObject(currentUser)
          })
          .then(function(){return currentUser})
      },


      logout: function() {
        console.log("logging out user.", currentUser)
        currentUser = null;
        $http.get('/profile/current/logout').success(function(data, status, headers, config) {
          UserMessage.set("logout.success")
          TiMixpanel.clearCookie()
        });
      },




      userIsLoggedIn: function(){
        var deferred = $q.defer();

        service.requestCurrentUser().then(
          function(user){
            if (!user){
              deferred.reject("userNotLoggedIn")
              deferred.reject("userNotLoggedIn")
            }
            else {
              deferred.resolve(user)
            }
          }
        )
        return deferred.promise
      },


      hasNewMetrics: function(){
        return currentUser && currentUser.has_diff
      },


      redirectToProfile: function(){
        service.requestCurrentUser().then(function(user){
          redirect("/" + user.url_slug)
        })
      },

      clearCachedUser: function(){
        currentUser = null
        useCachedUser = false
      },

      isLoggedIn: function(url_slug){
        return currentUser && currentUser.url_slug && currentUser.url_slug==url_slug
      },

      isLoggedInPromise: function(url_slug){
        var deferred = $q.defer();

        service.requestCurrentUser().then(
          function(userObj){
            if (!userObj){
              deferred.reject("user not logged in")
            }
            else if (userObj.url_slug == url_slug ) {
              deferred.resolve("user is logged in!")
            }
            else {
              deferred.reject("user not logged in")
            }
          }
        )
        return deferred.promise
      },

      getCurrentUser: function(attr){
        if (currentUser && attr) {
          return currentUser[attr]
        }
        else {
          return currentUser
        }

      },

      getCurrentUserSlug: function() {
        if (currentUser) {
          return currentUser.url_slug
        }
        else {
          return null
        }
      },

      setCurrentUser: function(user){
        currentUser = user
      },

      // Is the current user authenticated?
      isAuthenticated: function(){
        return !!currentUser;
      }

    };

    return service;
  });
angular.module("settings.pageDescriptions", [])
angular.module('settings.pageDescriptions')
.factory('SettingsPageDescriptions', function(){
           
  var settingsPageDisplayNames = [
    "Subscription",
    "Profile",
    "Notifications",
    "Custom URL",
    "Email",
    "Password"
//    ,"Linked accounts"
  ]

  var urlPathFromDisplayName = function(displayName){
    return "/settings/" + displayName.replace(" ", "-").toLowerCase();
  }           
  var templatePathFromDisplayName = function(displayName){
    return urlPathFromDisplayName(displayName).substring(1) + "-settings.tpl.html";
  }

  var settingsPageDescriptions = [];
           
  // make a list of objects, each describing one our our settings pages.
  _.each(settingsPageDisplayNames, function(pageDisplayName) {
   var settingsPageObj = {
     displayName: pageDisplayName,
     urlPath: urlPathFromDisplayName(pageDisplayName),
     templatePath: templatePathFromDisplayName(pageDisplayName)
   };
    settingsPageDescriptions.push(settingsPageObj);
  })
           
  return {
    get: function(){
      return settingsPageDescriptions;
    }
    ,getDescrFromPath: function(path){
      return _.findWhere(settingsPageDescriptions, {urlPath: path})
    }
  };

})
angular.module('settings', [
    'resources.users',
    'services.loading',
    'update.update',
    'directives.spinner',
    'settings.pageDescriptions',
    'services.userMessage',
    'services.tiMixpanel',
    'security',
    'angularPayments',
    'directives.forms'])

  .config(function ($routeProvider) {

    $routeProvider.when('/settings/:page',
      {
        templateUrl:'settings/settings.tpl.html',
        controller: "settingsCtrl",
        resolve:{
          authenticatedUser:function (security) {
            return security.requestCurrentUser();
          },
          allowed: function(security){
            return security.testUserAuthenticationLevel("loggedIn")
          }
        }
      }
    )
  })

  .controller('settingsCtrl', function ($scope, $location, authenticatedUser, SettingsPageDescriptions, $routeParams, Loading) {

    $scope.resetUser = function(){
      $scope.user = angular.copy(authenticatedUser)
    }
    $scope.loading = Loading
    $scope.home = function(){
      $location.path('/' + authenticatedUser.url_slug);
    }
    $scope.isCurrentPath = function(path) {
      return path == $location.path();
    }

    $scope.onCancel = function(){
      $scope.resetUser();
      $scope.home();
    }

    $scope.testClick = function(formCtrl){
      formCtrl.$setPristine()
    }

    var currentPageDescr = SettingsPageDescriptions.getDescrFromPath($location.path());

    $scope.resetUser()
    Loading.finish()
    $scope.include =  currentPageDescr.templatePath;
    $scope.authenticatedUser = authenticatedUser;
    $scope.pageDescriptions = SettingsPageDescriptions.get();

  })

  .controller('profileSettingsCtrl', function ($scope, Users, security, UserMessage, Loading) {
    $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.url_slug},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set('settings.profile.change.success', true);
          $scope.home();
        }
      )
    };
  })


  .controller('NotificationsSettingsCtrl', function ($scope, Users, security, UserMessage, Loading) {
    $scope.onSave = function() {
      var messageKey = "settings.notifications."
        + $scope.user.notification_email_frequency
        + ".success"


      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.url_slug},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set(messageKey, true);
          $scope.home();
        }
      )
    };
  })


  .controller('passwordSettingsCtrl', function ($scope, $location, UsersPassword, security, UserMessage, Loading) {

    $scope.showPassword = false;
    var resetToken =  $location.search()["reset_token"]
    $scope.requireCurrentPassword = !resetToken

    $scope.onSave = function() {
      Loading.start('saveButton')

      UsersPassword.save(
        {id: $scope.user.url_slug},
        $scope.user,
        function(resp) {
          UserMessage.set('settings.password.change.success', true);
          $scope.home()
        },
        function(resp) {
          UserMessage.set('settings.password.change.error.unauthenticated');
          Loading.finish('saveButton')
          $scope.resetUser();  // reset the form
          $scope.wrongPassword = true;
          scroll(0,0)
        }
      )
    };
  })



  .controller('urlSettingsCtrl', function ($scope, Users, security, $location, UserMessage, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.id, id_type:"id"},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set('settings.url.change.success', true);
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })



  .controller('subscriptionSettingsCtrl', function ($scope,
                                                    Users,
                                                    security,
                                                    $location,
                                                    UserMessage,
                                                    Loading,
                                                    TiMixpanel,
                                                    UsersSubscription) {


    // important! this is how we get stuff out of the form from here
    $scope.subscribeForm = {
      plan: "base-yearly",
      coupon: null
    }

    $scope.isTrialing = function(){
      return security.getCurrentUser("is_trialing")
    }

    $scope.isSubscribed = function(){
      return security.getCurrentUser("is_subscribed")
    }


    $scope.daysLeftInTrial = function(){
      return security.getCurrentUser("days_left_in_trial")
    }

    $scope.paidSince = function(){
      var su = security.getCurrentUser("subscription")
      return "August 2014"  // short-term hack
    }

    $scope.editCard = function(){
      alert("Sorry--we're actually still working on the form for this! But drop us a line at team@impactstory.org and we'll be glad to modify your credit card information manually.")
    }

    $scope.cancelSubscription = function(){
      UsersSubscription.delete(
        {id: $scope.user.url_slug},
        {},
        function(resp){
          console.log("subscription successfully cancelled", resp)
          security.refreshCurrentUser() // refresh the currentUser from server
          UserMessage.set("settings.subscription.delete.success")

          // @todo refresh the page
        },
        function(resp){
          console.log("there was a problem; subscription not cancelled", resp)
        }
      )
    }

    var subscribeUser = function(url_slug, plan, token, coupon) {
      console.log("running subscribeUser()", url_slug, plan, token, coupon)
      return UsersSubscription.save(
        {id: url_slug},
        {
          token: token,
          plan: plan,
          coupon: coupon
        },
        function(resp){
          console.log("we subscribed a user, huzzah!", resp)
          security.refreshCurrentUser() // refresh the currentUser from server
          window.scrollTo(0,0)
          UserMessage.set("settings.subscription.subscribe.success")
          Loading.finish("subscribe")
          TiMixpanel.track("User subscribed")


        },
        function(resp){
          console.log("we failed to subscribe a user.", resp)
          UserMessage.set("settings.subscription.subscribe.error")
          Loading.finish("subscribe")
        }
      )
    }

    $scope.handleStripe = function(status, response){

      console.log("handleStripe() returned stuff from Stripe:", response)

      Loading.start("subscribe")
      console.log("in handleStripe(), got a response back from Stripe.js's call to the Stripe server:", status, response)
      if (response.error && !$scope.subscribeForm.coupon) {

        console.log("got an error instead of a token, and there ain't no coupon to fall back on.")
        UserMessage.set("settings.subscription.subscribe.error")

      }

      else if (response.error && $scope.subscribeForm.coupon){
        console.log("got an error instead of a token--but that's ok, we've got a coupon!")
        subscribeUser($scope.user.url_slug, $scope.subscribeForm.plan, null, $scope.subscribeForm.coupon)
      }

      else {
        console.log("yay, Stripe CC token created successfully! Now let's save the card.")
        subscribeUser($scope.user.url_slug, $scope.subscribeForm.plan, response.id, null)

      }
    }
  })


  .controller('emailSettingsCtrl', function ($scope, Users, security, $location, UserMessage, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.url_slug, log:"changing email from settings"},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set(
            'settings.email.change.success',
            true,
            {email: resp.about.email}
          );
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })




angular.module( 'signup', [
    'services.slug',
    'services.page',
    'services.tiMixpanel',
    'resources.users',
    'update.update',
    'security.service'
    ])

.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when("/signup", {
      templateUrl: 'signup/signup.tpl.html',
      controller: 'signupCtrl',
      resolve:{
        userNotLoggedIn: function(security){
          return security.testUserAuthenticationLevel("loggedIn", false)
        }
      }
    })
}])

  .controller('signupCtrl', function($scope, Page){

    Page.setUservoiceTabLoc("bottom")
    Page.showHeader(false)
    Page.showFooter(false)

  })

  .controller( 'signupFormCtrl', function ($scope,
                                           $location,
                                           security,
                                           Slug,
                                           Users,
                                           TiMixpanel,
                                           Loading) {
    var emailThatIsAlreadyTaken = "aaaaaaaaaaaa@foo.com"

    $scope.newUser = {}
    $scope.emailTaken = function(){
      return $scope.newUser.email === emailThatIsAlreadyTaken
    }

    $scope.signup = function(){
      var slug = Slug.make($scope.newUser.givenName, $scope.newUser.surname)
      Loading.start("signup")
      Users.save(
        {id: slug},
        {
          givenName: $scope.newUser.givenName,
          surname: $scope.newUser.surname,
          email: $scope.newUser.email,
          password: $scope.newUser.password
        },
        function(resp, headers){
          security.clearCachedUser()
          $location.path(resp.user.url_slug)

          // so mixpanel will start tracking this user via her userid from here
          // on out.
          TiMixpanel.alias(resp.user.id)
          TiMixpanel.track("Signed up new user")
        },
        function(resp){
          if (resp.status === 409) {
            Loading.finish("signup")
            emailThatIsAlreadyTaken = angular.copy($scope.newUser.email)
            console.log("oops, email already taken...")
            console.log("resp", resp)
          }
        }
      )

    }
  })

angular.module( 'update.update', [
    'emguo.poller',
    'resources.users'
  ])
  .factory("Update", function($modal,
                              $timeout,
                              $q,
                              poller,
                              UsersUpdateStatus){

    var status = {}
    var url_slug
    var modalInstance
    var pollingInterval = 10  // 10ms...as soon as we get server resp, ask again.
    var deferred
    var isDeduping

    var clear = function(){
      status = {}
      url_slug = null
      deferred = null
      modalInstance = null
    }

    var tick = function(){
      UsersUpdateStatus.get({id:url_slug}).$promise.then(
        function(resp){
          console.log("tick() got /refresh_status response back from server", resp)
          status = resp
          if (resp.percent_complete == 100){
            console.log("tick() satisfied success criteria, calling dedup")
            status.isDeduping = true
            UsersProducts.dedup({id: url_slug}, {}).$promise.then(
              function(resp){
                console.log("dedup successful!", resp)
              },
              function(resp){
                console.log("dedup failed :(", resp)
              }
            ).finally(function(resp){
                console.log("cleaning up after dedup"),
                modalInstance.close()
                deferred.resolve("Update finished!")
                clear()
            })
          }

          else {
            $timeout(tick, pollingInterval)
          }
        },
        function(resp){
          console.log("failed to get /refresh_status; trying again.", resp)
          $timeout(tick, pollingInterval)
        }
      )
    }

    var showUpdateModal = function(url_slug_arg, profile_is_refreshing){
      deferred = $q.defer()
      url_slug = url_slug_arg

      if (!profile_is_refreshing){
        deferred.reject("Everything is already up to date.")
        return deferred.promise
      }

      if (modalInstance){
        // we can only have one modal instance running at once...otherwise, it breaks.
        deferred.reject("there's already an update modal up.")
        return deferred.promise
      }

      modalInstance = $modal.open({
        templateUrl: 'update/update-progress.tpl.html',
        controller: 'updateProgressModalCtrl',
        backdrop:"static",
        keyboard: false
      });

      // start polling
      tick()

      return deferred.promise
    }



    return {
      showUpdateModal: showUpdateModal,
      status: status,
      getPercentComplete: function(){
        return status.percent_complete
      },
      getNumComplete: function(){
        return status.num_complete
      },
      getNumUpdating: function() {
        return status.num_refreshing
      },
      isDeduping: function(){
        return status.isDeduping
      }
    }
  })
  .controller("updateProgressModalCtrl", function($scope, Update){
    $scope.status = Update
  })

angular.module('directives.crud', ['directives.crud.buttons', 'directives.crud.edit']);

angular.module('directives.crud.buttons', [])

.directive('crudButtons', function () {
  return {
    restrict:'E',
    replace:true,
    template:
      '<div>' +
      '  <button type="button" class="btn btn-primary save" ng-disabled="!canSave()" ng-click="save()">Save</button>' +
      '  <button type="button" class="btn btn-warning revert" ng-click="revertChanges()" ng-disabled="!canRevert()">Revert changes</button>'+
      '  <button type="button" class="btn btn-danger remove" ng-click="remove()" ng-show="canRemove()">Remove</button>'+
      '</div>'
  };
});
angular.module('directives.crud.edit', [])

// Apply this directive to an element at or below a form that will manage CRUD operations on a resource.
// - The resource must expose the following instance methods: $saveOrUpdate(), $id() and $remove()
.directive('crudEdit', ['$parse', function($parse) {
  return {
    // We ask this directive to create a new child scope so that when we add helper methods to the scope
    // it doesn't make a mess of the parent scope.
    // - Be aware that if you write to the scope from within the form then you must remember that there is a child scope at the point
    scope: true,
    // We need access to a form so we require a FormController from this element or a parent element
    require: '^form',
    // This directive can only appear as an attribute
    link: function(scope, element, attrs, form) {
      // We extract the value of the crudEdit attribute
      // - it should be an assignable expression evaluating to the model (resource) that is going to be edited
      var resourceGetter = $parse(attrs.crudEdit);
      var resourceSetter = resourceGetter.assign;
      // Store the resource object for easy access
      var resource = resourceGetter(scope);
      // Store a copy for reverting the changes
      var original = angular.copy(resource);

      var checkResourceMethod = function(methodName) {
        if ( !angular.isFunction(resource[methodName]) ) {
          throw new Error('crudEdit directive: The resource must expose the ' + methodName + '() instance method');
        }
      };
      checkResourceMethod('$saveOrUpdate');
      checkResourceMethod('$id');
      checkResourceMethod('$remove');

      // This function helps us extract the callback functions from the directive attributes
      var makeFn = function(attrName) {
        var fn = scope.$eval(attrs[attrName]);
        if ( !angular.isFunction(fn) ) {
          throw new Error('crudEdit directive: The attribute "' + attrName + '" must evaluate to a function');
        }
        return fn;
      };
      // Set up callbacks with fallback
      // onSave attribute -> onSave scope -> noop
      var userOnSave = attrs.onSave ? makeFn('onSave') : ( scope.onSave || angular.noop );
      var onSave = function(result, status, headers, config) {
        // Reset the original to help with reverting and pristine checks
        original = result;
        userOnSave(result, status, headers, config);
      };
      // onRemove attribute -> onRemove scope -> onSave attribute -> onSave scope -> noop
      var onRemove = attrs.onRemove ? makeFn('onRemove') : ( scope.onRemove || onSave );
      // onError attribute -> onError scope -> noop
      var onError = attrs.onError ? makeFn('onError') : ( scope.onError || angular.noop );

      // The following functions should be triggered by elements on the form
      // - e.g. ng-click="save()"
      scope.save = function() {
        resource.$saveOrUpdate(onSave, onSave, onError, onError);
      };
      scope.revertChanges = function() {
        resource = angular.copy(original);
        resourceSetter(scope, resource);
      };
      scope.remove = function() {
        if(resource.$id()) {
          resource.$remove(onRemove, onError);
        } else {
          onRemove();
        }
      };

      // The following functions can be called to modify the behaviour of elements in the form
      // - e.g. ng-disable="!canSave()"
      scope.canSave = function() {
        return form.$valid && !angular.equals(resource, original);
      };
      scope.canRevert = function() {
        return !angular.equals(resource, original);
      };
      scope.canRemove = function() {
        return resource.$id();
      };
      /**
       * Get the CSS classes for this item, to be used by the ng-class directive
       * @param {string} fieldName The name of the field on the form, for which we want to get the CSS classes
       * @return {object} A hash where each key is a CSS class and the corresponding value is true if the class is to be applied.
       */
      scope.getCssClasses = function(fieldName) {
        var ngModelContoller = form[fieldName];
        return {
          error: ngModelContoller.$invalid && !angular.equals(resource, original),
          success: ngModelContoller.$valid && !angular.equals(resource, original)
        };
      };
      /**
       * Whether to show an error message for the specified error
       * @param {string} fieldName The name of the field on the form, of which we want to know whether to show the error
       * @param  {string} error - The name of the error as given by a validation directive
       * @return {Boolean} true if the error should be shown
       */
      scope.showError = function(fieldName, error) {
        return form[fieldName].$error[error];
      };
    }
  };
}]);
angular.module("directives.external", [])

/*https://github.com/iameugenejo/angular-centered/angular-centered.js*/
.directive("centered", function() {
  return {
		restrict : "ECA",
		transclude : true,
		template : "<div class=\"angular-center-container\">\
						<div class=\"angular-centered\" ng-transclude>\
						</div>\
					</div>"
	};
});

angular.module("directives.fullscreen", [])
  .directive('fullscreen', function () {
    return {
      restrict: 'A',
      link: function (scope, elem, attr) {
        var viewportHeight = $(window).height()
        $(elem).height(viewportHeight)

      }
    }
  })
angular.module('directives.gravatar', [])

// A simple directive to display a gravatar image given an email
.directive('gravatar', ['md5', function(md5) {

  return {
    restrict: 'E',
    template: '<img ng-src="http://www.gravatar.com/avatar/{{hash}}{{getParams}}"/>',
    replace: true,
    scope: {
      email: '=',
      size: '=',
      defaultImage: '=',
      forceDefault: '='
    },
    link: function(scope, element, attrs) {
      scope.options = {};
      scope.$watch('email', function(email) {
        if ( email ) {
          scope.hash = md5(email.trim().toLowerCase());
        }
      });
      scope.$watch('size', function(size) {
        scope.options.s = (angular.isNumber(size)) ? size : undefined;
        generateParams();
      });
      scope.$watch('forceDefault', function(forceDefault) {
        scope.options.f = forceDefault ? 'y' : undefined;
        generateParams();
      });
      scope.$watch('defaultImage', function(defaultImage) {
        scope.options.d = defaultImage ? defaultImage : undefined;
        generateParams();
      });
      function generateParams() {
        var options = [];
        scope.getParams = '';
        angular.forEach(scope.options, function(value, key) {
          if ( value ) {
            options.push(key + '=' + encodeURIComponent(value));
          }
        });
        if ( options.length > 0 ) {
          scope.getParams = '?' + options.join('&');
        }
      }
    }
  };
}])

.factory('md5', function() {
  function md5cycle(x, k) {
    var a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);

  }

  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function md51(s) {
    txt = '';
    var n = s.length,
      state = [1732584193, -271733879, -1732584194, 271733878],
      i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) {
        tail[i] = 0;
      }
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  /* there needs to be support for Unicode here,
   * unless we pretend that we can redefine the MD-5
   * algorithm for multi-byte characters (perhaps
   * by adding every four 16-bit characters and
   * shortening the sum to 32 bits). Otherwise
   * I suggest performing MD-5 as if every character
   * was two bytes--e.g., 0040 0025 = @%--but then
   * how will an ordinary MD-5 sum be matched?
   * There is no way to standardize text to something
   * like UTF-8 before transformation; speed cost is
   * utterly prohibitive. The JavaScript standard
   * itself needs to look at this: it should start
   * providing access to strings as preformed UTF-8
   * 8-bit unsigned value arrays.
   */

  function md5blk(s) { /* I figured global was faster.   */
    var md5blks = [],
      i; /* Andy King said do it this way. */
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  var hex_chr = '0123456789abcdef'.split('');

  function rhex(n) {
    var s = '', j = 0;
    for (; j < 4; j++) {
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    }
    return s;
  }

  function hex(x) {
    for (var i = 0; i < x.length; i++) {
      x[i] = rhex(x[i]);
    }
    return x.join('');
  }

  function md5(s) {
    return hex(md51(s));
  }

  /* this function is much faster,
  so if possible we use it. Some IEs
  are the only ones I know of that
  need the idiotic second function,
  generated by an if clause.  */

  add32 = function(a, b) {
    return (a + b) & 0xFFFFFFFF;
  };

  if (md5('hello') !== '5d41402abc4b2a76b9719d911017c592') {
    add32 = function (x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF),
        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    };
  }

  return md5;
});
// only have to use this once per page. could be on the main view i think?

angular.module("directives.jQueryTools", [])
  .directive('jqPopover', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        $("body").popover({
          html:true,
          trigger:'hover',
          placement:'auto',
          selector: "[data-content]"
        })
      }
    }
  })

  .directive('jqTooltip', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        $("body").tooltip({
          placement:'bottom auto',
          html:true,
          selector: "[data-toggle='tooltip']"
        })
      }
    }
  })


angular.module('directives.modal', []).directive('modal', ['$parse',function($parse) {
  var backdropEl;
  var body = angular.element(document.getElementsByTagName('body')[0]);
  var defaultOpts = {
    backdrop: true,
    escape: true
  };
  return {
    restrict: 'ECA',
    link: function(scope, elm, attrs) {
      var opts = angular.extend(defaultOpts, scope.$eval(attrs.uiOptions || attrs.bsOptions || attrs.options));
      var shownExpr = attrs.modal || attrs.show;
      var setClosed;

      if (attrs.close) {
        setClosed = function() {
          scope.$apply(attrs.close);
        };
      } else {
        setClosed = function() {
          scope.$apply(function() {
            $parse(shownExpr).assign(scope, false);
          });
        };
      }
      elm.addClass('modal');

      if (opts.backdrop && !backdropEl) {
        backdropEl = angular.element('<div class="modal-backdrop"></div>');
        backdropEl.css('display','none');
        body.append(backdropEl);
      }

      function setShown(shown) {
        scope.$apply(function() {
          model.assign(scope, shown);
        });
      }

      function escapeClose(evt) {
        if (evt.which === 27) { setClosed(); }
      }
      function clickClose() {
        setClosed();
      }

      function close() {
        if (opts.escape) { body.unbind('keyup', escapeClose); }
        if (opts.backdrop) {
          backdropEl.css('display', 'none').removeClass('in');
          backdropEl.unbind('click', clickClose);
        }
        elm.css('display', 'none').removeClass('in');
        body.removeClass('modal-open');
      }
      function open() {
        if (opts.escape) { body.bind('keyup', escapeClose); }
        if (opts.backdrop) {
          backdropEl.css('display', 'block').addClass('in');
          backdropEl.bind('click', clickClose);
        }
        elm.css('display', 'block').addClass('in');
        body.addClass('modal-open');
      }

      scope.$watch(shownExpr, function(isShown, oldShown) {
        if (isShown) {
          open();
        } else {
          close();
        }
      });
    }
  };
}]);

// mostly copped from
// http://stackoverflow.com/a/15208347/226013


angular.module("directives.onRepeatFinished", [])
  .directive('onRepeatFinished', function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        if (scope.$last === true) {
          $timeout(function () {
            scope.$emit('ngRepeatFinished');
          });
        }
      }
    }
  });
angular.module('directives.pwMatch', [])
  // from http://blog.brunoscopelliti.com/angularjs-directive-to-check-that-passwords-match


  .directive('pwMatch', [function () {
    return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
        var firstPassword = '#' + attrs.pwMatch;
        elem.add(firstPassword).on('keyup', function () {
          scope.$apply(function () {
            var v = (elem.val()===$(firstPassword).val());
            ctrl.$setValidity('pwmatch', v);
          });
        });
      }
    }
  }]);
angular.module("directives.spinner", ['services.loading'])
angular.module("directives.spinner")

  .directive("spinner", function(Loading){
    return {
     restrict: 'E',
     template: '<div class="working help-block" ng-show="loading.is()">' +
       '<i class="icon-refresh icon-spin"></i>' +
       '<span class="text">{{ msg }}...</span>' +
       '</div>',
     link: function(scope, elem, attr, ctrl){
       if (attr.msg) {
         scope.msg = attr.msg;
       }
       else {
         scope.msg = "Loading"
       }

     }

    }
    })
angular.module('directives.forms', ["services.loading"])


  .directive("customFileSelect",function(){
    return {
      link: function($scope, el, attrs){
        el.bind("change", function(e){
          var reader = new FileReader()
          reader.onload = function(e){
            $scope.$emit("fileLoaded", reader.result)
          }

          var file = (e.srcElement || e.target).files[0];
          reader.readAsText(file)
        })
      }
    }
  })





.directive('prettyCheckbox', function(){
  // mostly from http://jsfiddle.net/zy7Rg/6/
  return {
    template: '<div class="checkmark-and-text"><i class="icon-check" ng-show=value></i>' +
      '<i class="icon-check-empty" ng-show=!value></i>' +
      '<span class="text">{{ text }}</span></div>',
    restrict: "E",
    replace: true,
    scope: {
      value: "=" // mirror the scope that was passed in...
    },
    link: function(scope, elem, attrs){
      scope.text = attrs.text;
      elem.bind('click', function() {
        scope.$apply(function(){
          scope.value = !scope.value
        });
      });
    }
  }
})

.directive('saveButtons', function(Loading){
  return {
    templateUrl: 'forms/save-buttons.tpl.html',
    replace: true,
    scope: true,
    require: "^form",
    restrict: "E",
    link:function(scope, elem, attr, formController){
      scope.loading = Loading
      if (attr.action) {
        scope.action = attr.action
        scope.actionGerund = attr.action + "ing"
      }
      else {
        scope.action = "Save"
        scope.actionGerund = "Saving"
      }

      scope.isValid = function() {
        return formController.$valid;
      }
    }
  }

})
.directive('hasFocus', function() {
    return {
      restrict: 'A',
      link: function(scope, elem, attr, ctrl){
        elem.find("input")
          .bind("focus", function(){
            elem.addClass("has-focus")
          })
          .bind("blur", function(){
            elem.removeClass("has-focus")
          })
      }
    }
})


.directive('requireUnique', function($http, $q, Loading) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl) {

      var canceler = $q.defer()
      var modelParts =  attr.ngModel.split(".")
      var userModelName = modelParts[0]
      var userPropertyToCheck = modelParts[1];

      var initialValue = scope[userModelName][userPropertyToCheck]

      scope.$watch(attr.ngModel, function(value) {
        ctrl.$setValidity('checkingUnique', false);
        ctrl.$setValidity('requireUnique', true);

        canceler.resolve()

        if (!attr.checkInitialValue && value == initialValue){
          ctrl.$setPristine();
          ctrl.$setValidity('requireUnique', true);
          ctrl.$setValidity('checkingUnique', true);

          Loading.finish('requireUnique');
          return true;
        }

        canceler = $q.defer()
        Loading.start('requireUnique');
        var url = '/profile/' + value + '?id_type=' + userPropertyToCheck;

        $http.get(url, {timeout: canceler.promise})
        .success(function(data) {
          ctrl.$setValidity('requireUnique', false);
          ctrl.$setValidity('checkingUnique', true);
          ctrl.$dirty = true;
          Loading.finish('requireUnique')
        })
        .error(function(data) {
          if (data) {
            ctrl.$setValidity('requireUnique', true);
            ctrl.$setValidity('checkingUnique', true);
            ctrl.$dirty = true;
            Loading.finish('requireUnique')
          }
        })
      })
    }
  }
})
angular.module('resources.products',['ngResource'])

.factory('Products', function ($resource) {

  return $resource(
   "/importer/:importerName",
   {}
  )
})

.factory('ProductBiblio', function ($resource) {

  return $resource(
    "/product/:tiid/biblio",
    {},
    {
      patch:{
        method: "POST",
        headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'}
      }
    }
  )
})


.factory("ProductInteraction", function($resource){
  return $resource(
    "/product/:tiid/interaction",
    {}
  )
})




.factory('Product', function ($resource) {

  return $resource(
    "/profile/:user_id/product/:tiid",
    {},
    {}
  )
})



.factory('ProductWithoutProfile', function ($resource) {

  return $resource(
    "/product/:tiid",
    {},
    {}
  )
})




angular.module('resources.users',['ngResource'])

  .factory('Users', function ($resource) {

    return $resource(
      "/profile/:id",
      {},
      {
        query:{
          method: "GET",
          params: {embedded: "@embedded"}
        },
        patch:{
          method: "POST",
          headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'},
          params:{id:"@about.id"} // use the 'id' property of submitted data obj
        }
      }
    )
  })



  .factory("ProfileWithoutProducts", function($resource){
    return $resource(
      "/profile-without-products/:profile_id"
    )
  })



  .factory('UserProduct', function ($resource) {

    return $resource(
     "/profile/:id/product/:tiid",
     {
          cache: false      
     }
    )
  })


  .factory('UsersProducts', function ($resource) {

    return $resource(
      "/profile/:id/products",
      {
        // default params go here
      },
      {
        update:{
          method: "PUT"
        },
        patch: {
          method: "POST",
          headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'}

        },
        delete: {
          method: "DELETE",
          headers: {'Content-Type': 'application/json'}
        },
        query:{
          method: "GET",
          isArray: true,
          cache: true,
          params: {hide: "metrics,awards,aliases", embedded: "@embedded"}
        },
        poll:{
          method: "GET",
          isArray: true,
          cache: false
        },
        refresh: {
          method: "POST"
        },
        dedup: {
          method: "POST",
          params: {action: "deduplicate"}
        }
      }
    )
  })
  .factory('UsersProduct', function ($resource) {

    return $resource(
      "/profile/:id/product/:tiid",
      {},  // defaults go here
      {
        update:{
          method: "PUT"
        }
      }
    )
  })

  .factory('UsersUpdateStatus', function ($resource) {
    return $resource(
      "/profile/:id/refresh_status",
      {}, // default params
      {}  // method definitions
    )
  })


  .factory('UsersLinkedAccounts', function($resource){

    return $resource(
      "/profile/:id/linked-accounts/:account",
      {},
      {
        update:{
          method: "POST",
          params: {action: "update"}
        }
      }

    )


  })

  .factory('UsersPassword', function ($resource) {

    return $resource(
      "/profile/:id/password",
      {} // defaults
    )
  })

  .factory("UsersProductsCache", function(UsersProducts){
      var cache = []
      return {
        query: function(){}
      }
    })


  .factory("UsersSubscription", function($resource){
    return $resource(
      "/profile/:id/subscription",
      {
        token: null,
        coupon: null,
        plan: "base-yearly"
      },
      {
        delete: {
          method: "DELETE",
          headers: {'Content-Type': 'application/json'}
        }
      }
    )
  })



angular.module('services.userMessage', [])
  .factory('UserMessage', function ($interpolate, $rootScope) {


    var currentMessageObject
    var persistAfterNextRouteChange
    var showOnTop = true

    var messages = {
      'login.error.invalidPassword':["Whoops! We recognize your email address but it looks like you've got the wrong password.", 'danger'],
      'login.error.invalidUser':["Sorry, we don't recognize that email address.", 'danger'],
      'login.error.serverError': ["Uh oh, looks like we've got a system error...feel free to let us know, and we'll fix it.", 'danger'],
      'logout.success': ["You've logged out.", 'info'],

      'settings.password.change.success': ["Password changed.", 'success'],
      'settings.password.change.error.unauthenticated': ["Sorry, looks like you typed your password wrong.", 'danger'],
      'settings.profile.change.success': ["Your profile's been updated.", 'success'],
      'settings.url.change.success': ["Your profile URL has been updated.", 'success'],
      'settings.email.change.success': ["Your email has been updated to {{email}}.", 'success'],
      'settings.subscription.delete.success': ["We've cancelled your Impactstory subscription.", 'success'],
      'settings.subscription.subscribe.success': ["Congratulations: you're now subscribed to Impactstory!", 'success'],
      'settings.subscription.subscribe.error': ["Sorry, looks like there was an error! Please check your credit card info.", 'danger'],
      'settings.notifications.as_they_happen.success': ["As-they-happen notifications are coming soon! We've changed your settings so that you'll get them as soon as we launch. In the meantime, we'll still send you emails every week or two. Can't wait? Got ideas? Drop us a line at <a href='http://twitter.com/impactstory'>@impactstory<a/> or <a href='mailto:team@impactstory.org'>team@impactstory.org</a>!", 'warning'],
      'settings.notifications.every_week_or_two.success':["Notification settings updated! You'll be getting emails every week or two with your latest impacts.", "success"],
      'settings.notifications.monthly.success':["Monthly notifications are coming soon! We've changed your settings so you'll get monthly emails when we roll them out. <br> Can't wait? Got ideas? Drop us a line at <a href='http://twitter.com/impactstory'>@impactstory<a/> or <a href='mailto:team@impactstory.org'>team@impactstory.org</a>!", "warning"],
      'settings.notifications.none.success':["We've unsubscribed you from notification emails. If you've got any suggestions for how these emails could be more useful for you, we'd love to hear them! <br> Drop us a line at <a href='http://twitter.com/impactstory'>@impactstory<a/> or <a href='mailto:team@impactstory.org'>team@impactstory.org</a>", "success"],

      'passwordReset.error.invalidToken': ["Looks like you've got an expired password reset token in the URL.", 'danger'],
      'passwordReset.success': ["Your password was reset.", 'success'],


      'profile.removeProduct.success': ["'<em>{{title}}</em>' has been deleted from your profile.", 'info'],

      'browser.error.oldIE': ["Warning: you're browsing using an out-of-date version of Internet Explorer.  Many ImpactStory features won't work. <a href='http://windows.microsoft.com/en-us/internet-explorer/download-ie'>Update</a>", 'warning'],
      'dedup.success': ["We've successfully merged <span class='count'>{{ numDuplicates }}</span> duplicated products.", 'info'],

      'subscription.trialing': ["You've got {{daysLeft}} days left on your free trial. <a href='/settings/subscription'>Subscribe</a> to keep your profile going strong!", 'info']
    };

    var clear = function(){
      currentMessageObject = null
    }

    $rootScope.$on('$routeChangeSuccess', function () {
      if (persistAfterNextRouteChange){
        persistAfterNextRouteChange = false
      }
      else {
        clear()
      }
    });




    return {
      set: function(key, persist, interpolateParams){
        persistAfterNextRouteChange = persist

        var msg = messages[key]
        currentMessageObject = {
          message: $interpolate(msg[0])(interpolateParams),
          type: msg[1]
        }
      },

      showOnTop: function(yesOrNo){
        if (typeof yesOrNo !== "undefined") {
          clear()
          showOnTop = !!yesOrNo
        }
        else {
          return showOnTop
        }
      },

      get: function(){
        return currentMessageObject
      },

      remove: function(){
        clear()
      }

    }


  })

angular.module('services.breadcrumbs', []);
angular.module('services.breadcrumbs').factory('Breadcrumbs', ['$rootScope', '$location', function($rootScope, $location){

  var levels = []

  return {
    set: function(level,obj){ // {text: foo, url: bar}
      levels[level] = obj
    },
    get: function(level, key){ // key is "text" or "url"
      var myLevel = levels[level]
      if (myLevel) {
        return myLevel[key]
      }
      else {
        return undefined
      }
    },
    hasLevel: function(level){
      return !!levels[level]
    },
    clear: function(){
      levels.length = 0
    }

  }
}]);
angular.module('services.charge', [])
  .factory("Charge", function(){
    var handler = StripeCheckout.configure({
      key: 'pk_test_CR4uaJdje6LJ02H4m6Mdcuor',
      image: '//gravatar.com/avatar/9387b461360eaf54e3fa3ce763c656f4/?s=120&d=mm',
      allowRememberMe: false,
      token: function(token, args) {
        // Use the token to create the charge with a server-side script.
        // You can access the token ID with `token.id`
        console.log("doin' stuff with the token!")
      }
    });


    return {
      open:function(args){
        handler.open(args)
      }
    }




  })
angular.module('services.crud', ['services.crudRouteProvider']);
angular.module('services.crud').factory('crudEditMethods', function () {

  return function (itemName, item, formName, successcb, errorcb) {

    var mixin = {};

    mixin[itemName] = item;
    mixin[itemName+'Copy'] = angular.copy(item);

    mixin.save = function () {
      this[itemName].$saveOrUpdate(successcb, successcb, errorcb, errorcb);
    };

    mixin.canSave = function () {
      return this[formName].$valid && !angular.equals(this[itemName], this[itemName+'Copy']);
    };

    mixin.revertChanges = function () {
      this[itemName] = angular.copy(this[itemName+'Copy']);
    };

    mixin.canRevert = function () {
      return !angular.equals(this[itemName], this[itemName+'Copy']);
    };

    mixin.remove = function () {
      if (this[itemName].$id()) {
        this[itemName].$remove(successcb, errorcb);
      } else {
        successcb();
      }
    };

    mixin.canRemove = function() {
      return item.$id();
    };

    /**
     * Get the CSS classes for this item, to be used by the ng-class directive
     * @param {string} fieldName The name of the field on the form, for which we want to get the CSS classes
     * @return {object} A hash where each key is a CSS class and the corresponding value is true if the class is to be applied.
     */
    mixin.getCssClasses = function(fieldName) {
      var ngModelContoller = this[formName][fieldName];
      return {
        error: ngModelContoller.$invalid && ngModelContoller.$dirty,
        success: ngModelContoller.$valid && ngModelContoller.$dirty
      };
    };

    /**
     * Whether to show an error message for the specified error
     * @param {string} fieldName The name of the field on the form, of which we want to know whether to show the error
     * @param  {string} error - The name of the error as given by a validation directive
     * @return {Boolean} true if the error should be shown
     */
    mixin.showError = function(fieldName, error) {
      return this[formName][fieldName].$error[error];
    };

    return mixin;
  };
});

angular.module('services.crud').factory('crudListMethods', ['$location', function ($location) {

  return function (pathPrefix) {

    var mixin = {};

    mixin['new'] = function () {
      $location.path(pathPrefix+'/new');
    };

    mixin['edit'] = function (itemId) {
      $location.path(pathPrefix+'/'+itemId);
    };

    return mixin;
  };
}]);
(function() {

  function crudRouteProvider($routeProvider) {

    // This $get noop is because at the moment in AngularJS "providers" must provide something
    // via a $get method.
    // When AngularJS has "provider helpers" then this will go away!
    this.$get = angular.noop;

    // Again, if AngularJS had "provider helpers" we might be able to return `routesFor()` as the
    // crudRouteProvider itself.  Then we would have a much cleaner syntax and not have to do stuff
    // like:
    //
    // ```
    // myMod.config(function(crudRouteProvider) {
    //   var routeProvider = crudRouteProvider.routesFor('MyBook', '/myApp');
    // });
    // ```
    //
    // but instead have something like:
    //
    //
    // ```
    // myMod.config(function(crudRouteProvider) {
    //   var routeProvider = crudRouteProvider('MyBook', '/myApp');
    // });
    // ```
    //
    // In any case, the point is that this function is the key part of this "provider helper".
    // We use it to create routes for CRUD operations.  We give it some basic information about
    // the resource and the urls then it it returns our own special routeProvider.
    this.routesFor = function(resourceName, urlPrefix, routePrefix) {
      var baseUrl = urlPrefix + '/' + resourceName.toLowerCase();
      routePrefix = routePrefix || urlPrefix;
      var baseRoute = '/' + routePrefix + '/' + resourceName.toLowerCase();

      // Create the templateUrl for a route to our resource that does the specified operation.
      var templateUrl = function(operation) {
        return baseUrl + '/' + resourceName.toLowerCase() +'-'+operation.toLowerCase()+'.tpl.html';
      };
      // Create the controller name for a route to our resource that does the specified operation.
      var controllerName = function(operation) {
        return resourceName + operation +'Ctrl';
      };

      // This is the object that our `routesFor()` function returns.  It decorates `$routeProvider`,
      // delegating the `when()` and `otherwise()` functions but also exposing some new functions for
      // creating CRUD routes.  Specifically we have `whenList(), `whenNew()` and `whenEdit()`.
      var routeBuilder = {
        // Create a route that will handle showing a list of items
        whenList: function(resolveFns) {
          routeBuilder.when(baseRoute, {
            templateUrl: templateUrl('List'),
            controller: controllerName('List'),
            resolve: resolveFns
          });
          return routeBuilder;
        },
        // Create a route that will handle creating a new item
        whenNew: function(resolveFns) {
          routeBuilder.when(baseRoute +'/new', {
            templateUrl: templateUrl('Edit'),
            controller: controllerName('Edit'),
            resolve: resolveFns
          });
          return routeBuilder;
        },
        // Create a route that will handle editing an existing item
        whenEdit: function(resolveFns) {
          routeBuilder.when(baseRoute+'/:itemId', {
            templateUrl: templateUrl('Edit'),
            controller: controllerName('Edit'),
            resolve: resolveFns
          });
          return routeBuilder;
        },
        // Pass-through to `$routeProvider.when()`
        when: function(path, route) {
          $routeProvider.when(path, route);
          return routeBuilder;
        },
        // Pass-through to `$routeProvider.otherwise()`
        otherwise: function(params) {
          $routeProvider.otherwise(params);
          return routeBuilder;
        },
        // Access to the core $routeProvider.
        $routeProvider: $routeProvider
      };
      return routeBuilder;
    };
  }
  // Currently, v1.0.3, AngularJS does not provide annotation style dependencies in providers so,
  // we add our injection dependencies using the $inject form
  crudRouteProvider.$inject = ['$routeProvider'];

  // Create our provider - it would be nice to be able to do something like this instead:
  //
  // ```
  // angular.module('services.crudRouteProvider', [])
  //   .configHelper('crudRouteProvider', ['$routeProvider, crudRouteProvider]);
  // ```
  // Then we could dispense with the $get, the $inject and the closure wrapper around all this.
  angular.module('services.crudRouteProvider', []).provider('crudRoute', crudRouteProvider);
})();
angular.module('services.exceptionHandler', ['services.i18nNotifications']);

angular.module('services.exceptionHandler').factory('exceptionHandlerFactory', ['$injector', function($injector) {
  return function($delegate) {

    return function (exception, cause) {
      // Lazy load notifications to get around circular dependency
      //Circular dependency: $rootScope <- notifications <- i18nNotifications <- $exceptionHandler
      var i18nNotifications = $injector.get('i18nNotifications');

      // Pass through to original handler
      $delegate(exception, cause);

      // Push a notification error
      i18nNotifications.pushForCurrentRoute('error.fatal', 'error', {}, {
        exception:exception,
        cause:cause
      });
    };
  };
}]);

angular.module('services.exceptionHandler').config(['$provide', function($provide) {
  $provide.decorator('$exceptionHandler', ['$delegate', 'exceptionHandlerFactory', function ($delegate, exceptionHandlerFactory) {
    return exceptionHandlerFactory($delegate);
  }]);
}]);

angular.module('services.httpRequestTracker', []);
angular.module('services.httpRequestTracker').factory('httpRequestTracker', ['$http', function($http){

  var httpRequestTracker = {};
  httpRequestTracker.hasPendingRequests = function() {
    return $http.pendingRequests.length > 0;
  };

  return httpRequestTracker;
}]);
angular.module("services.loading", [])
angular.module("services.loading")
.factory("Loading", function(){

  var loadingJobs = {}

  var setLoading = function(setLoadingTo, jobName) {
    loadingJobs[jobName] = !!setLoadingTo
  }


  return {
    is: function(jobName){

      // loading.is() ... is ANY loading job set to True?
      if (!jobName) {
        return _.some(_.values(loadingJobs))
      }

      // loading.is("jobname") ... is THIS job set to true?
      else {

        // no one ever set this job
        if (!(jobName in loadingJobs)) {
          return null
        }

        // ok, someone asked for a real job object.
        return loadingJobs[jobName]

      }
    },
    set: setLoading,
    start: function(jobName){
      setLoading(true, jobName)
    },
    finish:function(jobName){
      setLoading(false, jobName)
    },
    clear: function(){
      loading = false;
      for (var jobName in loadingJobs) delete loadingJobs[jobName]
    }
  }
})
angular.module("services.page", [
  'signup'
])
angular.module("services.page")
.factory("Page", function($location){
   var title = '';
   var notificationsLoc = "header"
   var uservoiceTabLoc = "right"
   var lastScrollPosition = {}
   var isEmbedded =  _($location.path()).startsWith("/embed/")
   var headerFullName
   var profileUrl
   var pageName

   var showHeaderNow = true
   var showFooterNow = true

   var frameTemplatePaths = {
     header: "",
     footer: ""
   }

   var addTplHtml = function(pathRoot){
     if (pathRoot){
       return pathRoot + ".tpl.html"
     }
     else {
       return ""
     }
   }

    var getPageType = function(){
      var myPageType = "profile"
      var path = $location.path()

      var settingsPages = [
          "/settings",
          "/reset-password"
      ]

      var infopages = [
          "/faq",
          "/about"
        ]

      if (path === "/"){
        myPageType = "landing"
      }
      else if (path === "/CarlBoettiger") {
        myPageType = "demoProfile"
      }
      else if (path === "/signup") {
        myPageType = "signup"
      }
      else if (_.contains(infopages, path)){
        myPageType = "infopages"
      }
      else if (_.contains(settingsPages, path)) {
        myPageType = "settings"
      }
      else if (path.indexOf("products/add") > -1) {
        myPageType = "importIndividual"
      }
      else if (path.indexOf("account") > -1) {
        myPageType = "linkAccount"
      }

      return myPageType
    }


   return {
     showHeader: function(showHeaderArg){
       // read current value
       if (typeof showHeaderArg === "undefined"){
         return showHeaderNow
       }

       // set value
       else {
         showHeaderNow = !!showHeaderArg
         return showHeaderNow
       }
     },
     showFooter: function(showFooterArg){

       // read current value
       if (typeof showFooterArg === "undefined"){
         return showFooterNow
       }

       // set value
       else {
         showFooterNow = !!showFooterArg
         return showFooterNow
       }
     },

     setHeaderFullName: function(name){
       headerFullName = name
     },


     getHeaderFullName: function(name){
       return headerFullName
     },

     setProfileUrl: function(url){
       profileUrl = url
     },
     getProfileUrl: function(){
       return profileUrl
     },

     getUrl: function(){
       return window.location.href
     },


     'setNotificationsLoc': function(loc){
         notificationsLoc = loc;
     },
     showNotificationsIn: function(loc){
       return notificationsLoc == loc
     },
     setVersion: function(versionName){
       version = versionName;
     },
     getBodyClasses: function(){
        var conditionalClasses = {
          'show-tab-on-bottom': uservoiceTabLoc == "bottom",
          'show-tab-on-right': uservoiceTabLoc == "right",
          'hide-tab': uservoiceTabLoc == "hidden",
          'embedded': isEmbedded
        }

       var classes = []

       _.each(conditionalClasses, function(v, k){
         if (v) classes.push(k)
       })

       return classes.join(" ")



     },
     'isEmbedded': function(){
       return isEmbedded
     } ,
     setUservoiceTabLoc: function(loc) {uservoiceTabLoc = loc},

     getTitle: function() { return title; },
     setTitle: function(newTitle) { title = "Impactstory: " + newTitle },

     isLandingPage: function(){
       return ($location.path() === "/")
     },

     isProfile:function(){
       var path = $location.path()
       return (path != "/") && (path != "/faq") && (path != "/about")
     },

     setName: function(name){
       pageName = name
     },

     isNamed: function(name){
       return name === pageName
     },

     setLastScrollPosition: function(pos, path){
       if (pos) {
        lastScrollPosition[path] = pos
       }
     },
     getLastScrollPosition: function(path){
       return lastScrollPosition[path]
     },
     sendPageloadToSegmentio: function(){

       analytics.page(
         getPageType(),
         $location.path(),
         {
           "viewport width": $(window).width(),
           "page_type": getPageType()
         }
       )
     }
   };
})













angular.module('services.profileService', [
  'resources.users'
])
  .factory("ProfileService", function($q, $timeout, Update, Page, Users){

    var profileObj
    var loading = true

    function get(url_slug){

      if (profileObj){
        return $q.when(profileObj)
      }

      // we're gonna refresh our profile data
      else {
        loading = true
        return Users.get(
          {id: url_slug, embedded: Page.isEmbedded()},
          function(resp){
            console.log("ProfileService got a response", resp)
            profileObj = resp  // cache for future use
            loading = false

            // got the new stuff. but does the server say it's
            // actually still updating there? if so, show
            // updating modal
            Update.showUpdateModal(url_slug, resp.is_refreshing).then(
              function(msg){
                console.log("updater (resolved):", msg)
                get(url_slug)
              },
              function(msg){
                // great, everything's all up-to-date.
              }
            )
          },

          function(resp){
            console.log("ProfileService got a failure response", resp)
            profileObj = null
            loading = false
          }
        ).$promise
      }
    }


    function getCached(){
      return $timeout(function(){
        if (loading){
          return getCached()
        }
        else {
          return profileObj
        }
      })
    }

    function isLoading(){
      return loading
    }

    function genreLookup(url_representation){
      if (typeof profileObj.genres == "undefined"){
        return undefined
      }
      else {
        var res = _.findWhere(profileObj.genres, {url_representation: url_representation})
        return res
      }
    }

    function productsByGenre(url_representation){
      if (typeof profileObj.products == "undefined"){
        return undefined
      }
      else {
        var genreCanonicalName = genreLookup(url_representation).name
        var res = _.where(profileObj.products, {genre: genreCanonicalName})
        return res
      }
    }


    return {
      profile: profileObj,
      loading: loading,
      isLoading: isLoading,
      get: get,
      getCached: getCached,
      productsByGenre: productsByGenre,
      genreLookup: genreLookup
    }


  })
angular.module('services.routeChangeErrorHandler', [
  'security'
])
  .factory("RouteChangeErrorHandler", function(security, $location){


    var restrictPageFromLoggedInUsers = function(path, event){
      var restrictedPathRegexes = [
        /^\/signup\//,   // signup page. you're already signed up, dude.
        /^\/$/           // landing page.
      ]
    }

    var handle = function(event, current, previous, rejection){
      console.log("handling route change error.", event, current, previous, rejection)
      var path = $location.path()
      if (rejection == "notLoggedIn"){
        // do something more useful later...popup login dialog, maybe.
        $location.path("/")
      }
      else if (rejection == "loggedIn"){
        // you've got a profile, homey. go there.
        security.redirectToProfile()
      }
      else if (rejection == "notOwnsThisProfile"){
        $location.path("/") // do something more useful later
      }

    }

    return {
      'handle': handle
    }
  })

angular.module('services.slug', [])
angular.module('services.slug')
.factory('Slug', function(){
  var removeDiacritics =function(str) {
   // many thanks to https://github.com/backbone-paginator/backbone.paginator/blob/master/plugins/diacritic.js

    var defaultDiacriticsRemovalMap = [
      {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
      {'base':'AA','letters':/[\uA732]/g},
      {'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
      {'base':'AO','letters':/[\uA734]/g},
      {'base':'AU','letters':/[\uA736]/g},
      {'base':'AV','letters':/[\uA738\uA73A]/g},
      {'base':'AY','letters':/[\uA73C]/g},
      {'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
      {'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
      {'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
      {'base':'DZ','letters':/[\u01F1\u01C4]/g},
      {'base':'Dz','letters':/[\u01F2\u01C5]/g},
      {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
      {'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
      {'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
      {'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
      {'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
      {'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
      {'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
      {'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
      {'base':'LJ','letters':/[\u01C7]/g},
      {'base':'Lj','letters':/[\u01C8]/g},
      {'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
      {'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
      {'base':'NJ','letters':/[\u01CA]/g},
      {'base':'Nj','letters':/[\u01CB]/g},
      {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
      {'base':'OI','letters':/[\u01A2]/g},
      {'base':'OO','letters':/[\uA74E]/g},
      {'base':'OU','letters':/[\u0222]/g},
      {'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
      {'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
      {'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
      {'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
      {'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
      {'base':'TZ','letters':/[\uA728]/g},
      {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
      {'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
      {'base':'VY','letters':/[\uA760]/g},
      {'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
      {'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
      {'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
      {'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
      {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
      {'base':'aa','letters':/[\uA733]/g},
      {'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
      {'base':'ao','letters':/[\uA735]/g},
      {'base':'au','letters':/[\uA737]/g},
      {'base':'av','letters':/[\uA739\uA73B]/g},
      {'base':'ay','letters':/[\uA73D]/g},
      {'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
      {'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
      {'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
      {'base':'dz','letters':/[\u01F3\u01C6]/g},
      {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
      {'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
      {'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
      {'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
      {'base':'hv','letters':/[\u0195]/g},
      {'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
      {'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
      {'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
      {'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
      {'base':'lj','letters':/[\u01C9]/g},
      {'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
      {'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
      {'base':'nj','letters':/[\u01CC]/g},
      {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
      {'base':'oi','letters':/[\u01A3]/g},
      {'base':'ou','letters':/[\u0223]/g},
      {'base':'oo','letters':/[\uA74F]/g},
      {'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
      {'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
      {'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
      {'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
      {'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
      {'base':'tz','letters':/[\uA729]/g},
      {'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
      {'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
      {'base':'vy','letters':/[\uA761]/g},
      {'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
      {'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
      {'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
      {'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
    ];

    for(var i=0; i<defaultDiacriticsRemovalMap.length; i++) {
      str = str.replace(defaultDiacriticsRemovalMap[i].letters, defaultDiacriticsRemovalMap[i].base);
    }

    return str;

  }

  var cleanName = function(name){
    var re = /[^-\w\.]/g
    return removeDiacritics(name).replace(re, "")
  }

  return {
    asciify: removeDiacritics,
    make: function(givenName, surname) {

      var slug = cleanName(givenName) + "" + cleanName(surname);

      if (/^[-\w\.]+$/.test(slug)) { // we can match an ascii string
        return slug;
      }
      else {
        // looks like failed to make an ASCII slug that could even sorta represent the user's name.
        // so we make a random one, instead.
        var randomInt = (Math.random() + "").substr(2, 5)
        return "user" +  randomInt
      }



    }
  }








})
angular.module("services.tiMixpanel", [])
.factory("TiMixpanel", function($cookieStore, $q, $timeout){

    var getFromCookie = function(keyToGet){
      var deferred = $q.defer()
      if (_.isUndefined(mixpanel.cookie)){
        $timeout(
          function(){return getFromCookie(keyToGet)},
          1
        )
      }
      else {
        deferred.resolve(mixpanel.cookie.props[keyToGet])
      }
      return deferred.promise
    }

    return {

      // purely wrappers around mixpanel methods

      track: function(event, obj){
        return mixpanel.track(event, obj)
      },
      alias: function(myAlias){
        return mixpanel.alias(myAlias)
      },
      identify: function(myId){
        return mixpanel.alias(myId)
      },
      register: function(obj){
        return mixpanel.register(obj)
      },
      registerOnce: function(obj){
        return mixpanel.register_once(obj)
      },
      clearCookie: function(){
        return mixpanel.cookie.clear()
      },



    // methods just for tiMixpanel, not wrappers around mixpanel methods.
    registerFromUserObject: function(userObject){
      if (!userObject){
        return false
      }

      var keysToRegister = [
        "created",
        "email",
        "given_name",
        "is_advisor",
        "last_email_sent",
        "last_viewed_profile",
        "surname",
        "url_slug"
      ]

      var activeLinkedAccountServices = _.map(
        userObject.linked_accounts,
        function(linkedAccount){
          if (linkedAccount.username){
            return linkedAccount.service
          }
          else {
            return false
          }
      })

      var objToRegister = _.pick(userObject, keysToRegister)
      objToRegister.linkedAccounts = _.compact(activeLinkedAccountServices).join(",")
      mixpanel.register(objToRegister)

      return true
    },


      get: getFromCookie
    }

  })
angular.module("services.timer", [])
.factory("Timer", function(){
    var jobs = []
    return {
      start: function(jobName){
        jobs[jobName] = Date.now()
      },
      elapsed: function(jobName){
        return Date.now() - jobs[jobName]
      }
    }

  })
angular.module('services.tour', [])
  .factory("Tour", function($modal){
    return {
      start: function(userAbout){
//        $(".tour").popover({trigger: "click"}).popover("show")

        $modal.open({
          templateUrl: "profile/tour-start-modal.tpl.html",
          controller: "profileTourStartModalCtrl",
          resolve: {
            userAbout: function($q){
              return $q.when(userAbout)
            }
          }
        })
      }
    }
  })
  .controller("profileTourStartModalCtrl", function($scope, userAbout){
    $scope.userAbout = userAbout
  })

angular.module("services.uservoiceWidget", [])
angular.module("services.uservoiceWidget")
.factory("UservoiceWidget", function(){

  var tabSettings = {
    "primary": {
      tabColor: '#ff4d00',
      tabPosition: "middle-right"
    },
    "secondary": {
      tabColor: '#999999',
      tabPosition: "bottom-left"
    }
  }


  return {
    insertTabs: function() {
      this.pushTab("secondary");
      this.pushTab("primary");
    },

    pushTab: function(settingsKey) {
      try {
        UserVoice.push(['showTab', 'classic_widget', {
          mode: 'full',
          primary_color: '#cc6d00',
          link_color: '#007dbf',
          default_mode: 'feedback',
          forum_id: 166950,
          tab_label: 'Feedback & Support',
          tab_color: tabSettings[settingsKey].tabColor,
          tab_position: tabSettings[settingsKey].tabPosition,
          tab_inverted: false
        }]);
      }
      catch (e) {
        // UserVoice throws these errors when you load two tabs.
        // not sure what thy are, but everything seems to still work, so ignore.

        var errorsToIgnore = [
          "Cannot read property 'transitionDuration' of null",
          "Cannot read property 'style' of undefined"
        ]

        if (!_.contains(errorsToIgnore, e.message)){
          throw e
        }
      }
    }

  }


})
angular.module('templates.app', ['accounts/account.tpl.html', 'footer.tpl.html', 'genre-page/genre-page.tpl.html', 'google-scholar/google-scholar-modal.tpl.html', 'infopages/about.tpl.html', 'infopages/advisors.tpl.html', 'infopages/collection.tpl.html', 'infopages/faq.tpl.html', 'infopages/landing.tpl.html', 'infopages/spread-the-word.tpl.html', 'password-reset/password-reset-header.tpl.html', 'password-reset/password-reset.tpl.html', 'pdf/pdf-viewer.tpl.html', 'product-page/edit-product-modal.tpl.html', 'product-page/fulltext-location-modal.tpl.html', 'product-page/percentilesInfoModal.tpl.html', 'product-page/product-page.tpl.html', 'profile-award/profile-award.tpl.html', 'profile-linked-accounts/profile-linked-accounts.tpl.html', 'profile-sidebar/profile-sidebar.tpl.html', 'profile-single-products/profile-single-products.tpl.html', 'profile/profile-embed-modal.tpl.html', 'profile/profile.tpl.html', 'profile/tour-start-modal.tpl.html', 'security/login/form.tpl.html', 'security/login/reset-password-modal.tpl.html', 'security/login/toolbar.tpl.html', 'settings/custom-url-settings.tpl.html', 'settings/email-settings.tpl.html', 'settings/linked-accounts-settings.tpl.html', 'settings/notifications-settings.tpl.html', 'settings/password-settings.tpl.html', 'settings/profile-settings.tpl.html', 'settings/settings.tpl.html', 'settings/subscription-settings.tpl.html', 'signup/signup.tpl.html', 'update/update-progress.tpl.html', 'user-message.tpl.html']);

angular.module("accounts/account.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("accounts/account.tpl.html",
    "\n" +
    "\n" +
    "<div class=\"account-tile\" id=\"{{ account.CSSname }}-account-tile\"\n" +
    "     ng-class=\"{'is-linked': isLinked}\"\n" +
    "     ng-click=\"showAccountWindow()\">\n" +
    "\n" +
    "   <div class=\"account-name\"><img ng-src=\"{{ account.logoPath }}\"></div>\n" +
    "   <div class=\"linked-info\">\n" +
    "      <div class=\"linking-in-progress working\" ng-show=\"loading.is(account.accountHost)\">\n" +
    "         <i class=\"icon-refresh icon-spin\"></i>\n" +
    "         <div class=\"text\"></div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"connected-toggle\" id=\"{{account.CSSname}}-account-toggle\"\n" +
    "           ng-show=\"!loading.is(account.accountHost)\">\n" +
    "\n" +
    "         <div class=\"toggle-housing toggle-on sync-{{ account.sync }}\" ng-show=\"isLinked\">\n" +
    "               <div class=\"toggle-state-label\" id=\"{{account.CSSname}}-account-toggle-on\">on</div>\n" +
    "               <div class=\"toggle-switch\"></div>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"toggle-housing toggle-off sync-{{ account.sync }}\" ng-show=\"!isLinked\">\n" +
    "               <div class=\"toggle-switch\"></div>\n" +
    "               <div class=\"toggle-state-label\" id=\"{{account.CSSname}}-account-toggle-off\">off</div>\n" +
    "         </div>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"overlay animated fadeIn fadeOut\"\n" +
    "     ng-click=\"onCancel()\"\n" +
    "     ng-if=\"accountWindowOpen\"></div>\n" +
    "\n" +
    "<div class=\"account-window-wrapper animated slideInRight slideOutRight\"\n" +
    "     ng-if=\"accountWindowOpen\">\n" +
    "\n" +
    "   <div class=\"account-window\">\n" +
    "\n" +
    "      <div class=\"top-tab-wrapper\">\n" +
    "         <div ng-show=\"{{ account.sync }}\" class=\"top-tab sync-true syncing-now-{{ isLinked }}\" >\n" +
    "            <span ng-show=\"!isLinked\" class=\"syncing-status syncing-status-off\">\n" +
    "               Automatic import available\n" +
    "            </span>\n" +
    "            <span ng-show=\"isLinked\" class=\"syncing-status syncing-status-on\">\n" +
    "               <i class=\"icon-cloud-download left\"></i>\n" +
    "               Automatic import enabled\n" +
    "            </span>\n" +
    "         </div>\n" +
    "         <div ng-show=\"{{ !account.sync }}\" class=\"top-tab sync-false syncing-now-false\">Manual import available</div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div class=\"content\">\n" +
    "         <h2 class=\"account-name\" ng-show=\"!account.url\"><img ng-src=\"{{ account.logoPath }}\" /> </h2>\n" +
    "         <h2 class=\"account-name\" ng-show=\"account.url\">\n" +
    "            <a class=\"logo\" href=\"{{ account.url }}\" target=\"_blank\"><img ng-src=\"{{ account.logoPath }}\" /></a>\n" +
    "            <a class=\"visit\" href=\"{{ account.url }}\" target=\"_blank\">Visit<i class=\"icon-chevron-right\"></i></a>\n" +
    "         </h2>\n" +
    "\n" +
    "         <div class=\"descr\">{{ account.descr }}</div>\n" +
    "\n" +
    "         <form name=\"accountForm\"\n" +
    "               novalidate class=\"form\"\n" +
    "               ng-submit=\"onLink()\">\n" +
    "\n" +
    "\n" +
    "            <div class=\"form-group username\">\n" +
    "               <label class=\"control-label\">\n" +
    "                  {{ account.CSSname }} {{ account.username.inputNeeded }}\n" +
    "                  <i class=\"icon-question-sign\" ng-show=\"account.username.help\" tooltip-html-unsafe=\"{{ account.username.help }}\"></i>\n" +
    "               </label>\n" +
    "               <div class=\"account-input\">\n" +
    "                  <input\n" +
    "                          class=\"form-control\"\n" +
    "                          id=\"{{ account.CSSname }}-account-username-input\"\n" +
    "                          ng-model=\"account.username.value\"\n" +
    "                          ng-disabled=\"isLinked\"\n" +
    "                          required\n" +
    "                          type=\"text\"\n" +
    "                          autofocus=\"autofocus\"\n" +
    "                          placeholder=\"{{ account.username.placeholder }}\">\n" +
    "\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"buttons-group save\">\n" +
    "               <div class=\"buttons\" ng-show=\"!loading.is('saveButton')\">\n" +
    "                  <button ng-show=\"!isLinked\"\n" +
    "                          type=\"submit\"\n" +
    "                          ng-disabled=\"accountForm.$invalid\"\n" +
    "                          id=\"{{ account.CSSname }}-account-username-submit\",                  \n" +
    "                          ng-class=\"{'btn-success': account.sync, 'btn-primary': !account.sync }\" class=\"btn\">\n" +
    "                     <i class=\"icon-link left\"></i>\n" +
    "                     Connect to {{ account.displayName }}\n" +
    "                  </button>\n" +
    "\n" +
    "                  <a ng-show=\"isLinked\" ng-click=\"unlink()\" class=\"btn btn-danger\">\n" +
    "                     <i class=\"icon-unlink left\"></i>\n" +
    "                     Disconnect from {{ account.displayName }}\n" +
    "                  </a>\n" +
    "\n" +
    "                  <a class=\"btn btn-default cancel\" ng-click=\"onCancel()\">Cancel</a>\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "         </form>\n" +
    "\n" +
    "         <div class=\"extra\" ng-show=\"account.extra\" ng-bind-html=\"account.extra\"></div>\n" +
    "\n" +
    "         <div class=\"google-scholar-stuff\"\n" +
    "              ng-show=\"account.accountHost=='google_scholar' && isLinked\">\n" +
    "            <p class=\"excuses\">\n" +
    "               Unfortunately, Google Scholar prevents automatic profile access,\n" +
    "               so we can't do automated updates.\n" +
    "               However, you can still import Google Scholar articles manually.\n" +
    "            </p>\n" +
    "            <div class=\"button-container\">\n" +
    "               <a id=\"show-google-scholar-import-modal-button\"\n" +
    "                  class=\"show-modal btn btn-primary\"\n" +
    "                  ng-click=\"showImportModal()\">\n" +
    "                  Manually import products\n" +
    "               </a>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "         </div>\n" +
    "\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("footer.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("footer.tpl.html",
    "<div id=\"footer\" ng-show=\"page.showFooter()\">\n" +
    "   <div class=\"wrapper\">\n" +
    "\n" +
    "      <div id=\"footer-about\" class=\"footer-col\">\n" +
    "         <h3>About</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"/about\">About us</a></li>\n" +
    "            <li><a href=\"/faq#tos\" target=\"_self\">Terms of use</a></li>\n" +
    "            <li><a href=\"/faq#copyright\" target=\"_self\">Copyright</a></li>\n" +
    "            <li><a href=\"https://github.com/total-impact\">GitHub</a></li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div id=\"footer-follow\" class=\"footer-col\">\n" +
    "         <h3>Community</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"http://eepurl.com/RaRZ1\">Newsletter</a></li>\n" +
    "            <li><a href=\"http://twitter.com/Impactstory\">Twitter</a></li>\n" +
    "            <li><a href=\"http://blog.impactstory.org\">Blog</a></li>\n" +
    "            <li><a href=\"/advisors\">Advisors</a></li>\n" +
    "            <li><a href=\"https://docs.google.com/forms/d/1gpIGnifvh0YBGgMAGozBEWhBUP1EZGMYRn2X6U25XzM/viewform?usp=send_form\" target=\"_blank\">Free stickers!</a></li>\n" +
    "\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div id=\"footer-help\" class=\"footer-col\">\n" +
    "         <h3>Help</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"http://feedback.impactstory.org\" target=\"_blank\">Suggestions</a></li>\n" +
    "            <li>\n" +
    "               <a href=\"javascript:void(0)\" data-uv-lightbox=\"classic_widget\" data-uv-mode=\"full\" data-uv-primary-color=\"#cc6d00\" data-uv-link-color=\"#007dbf\" data-uv-default-mode=\"support\" data-uv-forum-id=\"166950\">Report bug</a>\n" +
    "            </li>\n" +
    "            <li><a href=\"/faq\">FAQ</a></li>\n" +
    "            <li><a href=\"/CarlBoettiger\">Example profile</a></li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div id=\"footer-funders\" class=\"footer-col\">\n" +
    "         <h3>Supported by</h3>\n" +
    "         <a href=\"http://nsf.gov\" id=\"footer-nsf-link\">\n" +
    "            <img src=\"/static/img/logos/nsf-seal.png\" />\n" +
    "         </a>\n" +
    "         <a href=\"http://sloan.org/\" id=\"footer-sloan-link\">\n" +
    "            <img src=\"/static/img/logos/sloan-seal.png\" />\n" +
    "         </a>\n" +
    "         <a href=\"http://www.jisc.ac.uk/\" id=\"footer-jisc-link\">\n" +
    "            <img src=\"/static/img/logos/jisc.png\" />\n" +
    "         </a>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "</div> <!-- end footer -->\n" +
    "");
}]);

angular.module("genre-page/genre-page.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("genre-page/genre-page.tpl.html",
    "<div class=\"genre-page\">\n" +
    "   <div class=\"loading\" ng-show=\"isRendering()\">\n" +
    "      <div class=\"working\"><i class=\"icon-refresh icon-spin\"></i><span class=\"text\">Loading profile info...</span></div>\n" +
    "   </div>\n" +
    "   <div class=\"wrapper\" ng-show=\"!isRendering()\">\n" +
    "      <div class=\"header\">\n" +
    "         <h2>\n" +
    "            <span class=\"return-to-profile-link-container\">\n" +
    "               <a class=\"return-to-profile\"\n" +
    "                  tooltip=\"return to {{ about.given_name }}'s profile\"\n" +
    "                  href=\"/{{ about.url_slug }}\">\n" +
    "                  <i class=\"icon-chevron-left\"></i>\n" +
    "               </a>\n" +
    "            </span>\n" +
    "            <span class=\"text\">\n" +
    "               {{ genreNamePlural }}\n" +
    "            </span>\n" +
    "         </h2>\n" +
    "      </div>\n" +
    "      <div class=\"products\">\n" +
    "         <ul class=\"products-list\">\n" +
    "            <li class=\"product genre-{{ product.genre }}\"\n" +
    "                ng-class=\"{first: $first}\"\n" +
    "                ng-repeat=\"product in filteredProducts = (products | orderBy:['-awardedness_score', '-metric_raw_sum', 'biblio.title']) | filter: productFilter\"\n" +
    "                id=\"{{ product.tiid }}\"\n" +
    "                on-repeat-finished>\n" +
    "\n" +
    "\n" +
    "               <!-- users must be logged in -->\n" +
    "               <div class=\"product-margin\" ng-show=\"security.isLogsgedIn(url_slug)\">\n" +
    "                     <span class=\"single-product-controls\">\n" +
    "                        <a class=\"remove-product\"\n" +
    "                           tooltip=\"Delete this product\"\n" +
    "                           ng-click=\"removeProduct(product)\">\n" +
    "                           <i class=\"icon-trash icon\"></i>\n" +
    "                        </a>\n" +
    "                     </span>\n" +
    "               </div>\n" +
    "               <div class=\"product-container\" ng-bind-html=\"trustHtml(product.markup)\"></div>\n" +
    "            </li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>");
}]);

angular.module("google-scholar/google-scholar-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("google-scholar/google-scholar-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Manually import Google Scholar articles</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"$close()\">&times;</a>\n" +
    "</div>\n" +
    "<div class=\"modal-body google-scholar-import\">\n" +
    "   <div class=\"import-not-complete\" ng-show=\"!importComplete\">\n" +
    "\n" +
    "      <p>\n" +
    "         Google Scholar prevents automatic\n" +
    "         syncing. However, you can manually import your articles. <a\n" +
    "              target=\"_blank\"\n" +
    "              href=\"http://feedback.impactstory.org/knowledgebase/articles/368452-google-scholar\">Click here to learn how.</a>\n" +
    "      </p>\n" +
    "\n" +
    "         <div class=\"file-input-container\">\n" +
    "            <input type=\"file\" custom-file-select=\"google_scholar_bibtex\">\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"submit\">\n" +
    "            <a class=\"btn btn-primary\"\n" +
    "               ng-show=\"fileLoaded && !loading.is('bibtex')\"\n" +
    "               ng-click=\"sendToServer()\">\n" +
    "               Import {{ googleScholar.bibtexArticlesCount() }} articles\n" +
    "            </a>\n" +
    "            <div class=\"working\" ng-show=\"loading.is('bibtex')\">\n" +
    "               <i class=\"icon-refresh icon-spin\"></i>\n" +
    "               <span class=\"text\">Adding articles...</span>\n" +
    "            </div>\n" +
    "         </div>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "   <div class=\"import-complete\" ng-show=\"importComplete\">\n" +
    "      <div class=\"msg\">\n" +
    "      Successfully imported {{ importedProductsCount }} new articles!\n" +
    "      </div>\n" +
    "      <a class=\"btn btn-info\" ng-click=\"$close()\">ok</a>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("infopages/about.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/about.tpl.html",
    "<div class=\"main infopage\" id=\"about\">\n" +
    "\n" +
    "   <div class=\"wrapper\">\n" +
    "      <h2 class=\"infopage-heading\">About</h2>\n" +
    "\n" +
    "\n" +
    "      <p>Impactstory is an open-source, web-based tool that helps researchers explore and share the diverse impacts of all their research products&mdash;from traditional ones like journal articles, to emerging products like blog posts, datasets, and software. By helping researchers tell data-driven stories about their impacts, we're helping to build a new scholarly reward system that values and encourages web-native scholarship. We’re funded by the National Science Foundation and the Alfred P. Sloan Foundation and incorporated as a 501(c)(3) nonprofit corporation.\n" +
    "\n" +
    "      <p>Impactstory delivers <em>open metrics</em>, with <em>context</em>, for <em>diverse products</em>:</p>\n" +
    "      <ul>\n" +
    "         <li><b>Open metrics</b>: Our data (to the extent allowed by providers’ terms of service), <a href=\"https://github.com/total-impact\">code</a>, and <a href=\"http://blog.impactstory.org/2012/03/01/18535014681/\">governance</a> are all open.</li>\n" +
    "         <li><b>With context</b>: To help researcher move from raw <a href=\"http://altmetrics.org/manifesto/\">altmetrics</a> data to <a href=\"http://asis.org/Bulletin/Apr-13/AprMay13_Piwowar_Priem.html\">impact profiles</a> that tell data-driven stories, we sort metrics by <em>engagement type</em> and <em>audience</em>. We also normalize based on comparison sets: an evaluator may not know if 5 forks on GitHub is a lot of attention, but they can understand immediately if their project ranked in the 95th percentile of all GitHub repos created that year.</li>\n" +
    "         <li><b>Diverse products</b>: Datasets, software, slides, and other research products are presented as an integrated section of a comprehensive impact report, alongside articles&mdash;each genre a first-class citizen, each making its own kind of impact.</li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <h3 id=\"team\">team</h3>\n" +
    "\n" +
    "      <div class=\"team-member first\">\n" +
    "         <img src=\"/static/img/heather.jpg\" height=100/>\n" +
    "         <p><strong>Heather Piwowar</strong> is a cofounder of Impactstory and a leading researcher in research data availability and data reuse. She wrote one of the first papers measuring the <a href=\"http://www.plosone.org/article/info:doi/10.1371/journal.pone.0000308\">citation benefit of publicly available research data</a>, has studied  <a href=\"http://www.plosone.org/article/info:doi/10.1371/journal.pone.0018657\">patterns in  data archiving</a>, <a href=\"https://peerj.com/preprints/1/\">patterns of data reuse</a>, and the <a href=\"http://researchremix.wordpress.com/2010/10/12/journalpolicyproposal\">impact of journal data sharing policies</a>.</p>\n" +
    "\n" +
    "         <p>Heather has a bachelor’s and master’s degree from MIT in electrical engineering, 10 years of experience as a software engineer, and a Ph.D. in Biomedical Informatics from the U of Pittsburgh.  She is an <a href=\"http://www.slideshare.net/hpiwowar\">frequent speaker</a> on research data archiving, writes a well-respected <a href=\"http://researchremix.wordpress.com\">research blog</a>, and is active on twitter (<a href=\"http://twitter.com/researchremix\">@researchremix</a>). </p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"team-member subsequent\">\n" +
    "         <img src=\"/static/img/hat.jpg\" height=100/>\n" +
    "         <p><strong>Jason Priem</strong> is a cofounder of Impactstory and a doctoral student in information science (currently on leave of absence) at the University of North Carolina-Chapel Hill. Since <a href=\"https://twitter.com/jasonpriem/status/25844968813\">coining the term \"altmetrics,\"</a> he's remained active in the field, organizing the annual <a href=\"http:altmetrics.org/altmetrics12\">altmetrics workshops</a>, giving <a href=\"http://jasonpriem.org/cv/#invited\">invited talks</a>, and publishing <a href=\"http://jasonpriem.org/cv/#refereed\">peer-reviewed altmetrics research.</a></p>\n" +
    "\n" +
    "         <p>Jason has contributed to and created several open-source software projects, including <a href=\"http://www.zotero.org\">Zotero</a> and <a href=\"http://feedvis.com\">Feedvis</a>, and has experience and training in art, design, and information visualisation.  Sometimes he writes on a <a href=\"http://jasonpriem.org/blog\">blog</a> and <a href=\"https://twitter.com/#!/jasonpriem\">tweets</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"team-member subsequent\">\n" +
    "         <img src=\"/static/img/stacy.jpg\" height=100/>\n" +
    "         <p><strong>Stacy Konkiel</strong> is the Director of Marketing & Research at Impactstory. A former academic librarian, Stacy has written and spoken most often about the potential for altmetrics in academic libraries.</p>\n" +
    "\n" +
    "         <p>Stacy has been an advocate for Open Scholarship since the beginning of her career, but credits her time at Public Library of Science (PLOS) with sparking her interest in altmetrics and other revolutions in scientific communication. Prior, she earned her dual master’s degrees in Information Science and Library Science at Indiana University (2008). You can connect with Stacy on Twitter at <a href=\"http://twitter.com/skonkiel\">@skonkiel</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"clearfix\"></div>\n" +
    "\n" +
    "\n" +
    "      <h3 id=\"history\">history</h3>\n" +
    "      <p>Impactstory began life as total-impact, a hackathon project at the Beyond Impact workshop in 2011. As the hackathon ended, a few of us migrated into a hotel hallway to continue working, eventually completing a 24-hour coding marathon to finish a prototype. Months of spare-time development followed, then funding.  We’ve got the same excitement for Impactstory today.</p>\n" +
    "\n" +
    "      <p>In early 2012, Impactstory was given £17,000 through the <a href=\"http://beyond-impact.org/\">Beyond Impact project</a> from the <a href=\"http://www.soros.org/\">Open Society Foundation</a>.  Today Impactstory is funded by the <a href=\"http://sloan.org/\">Alfred P. Sloan Foundation</a>, first through <a href=\"http://blog.impactstory.org/2012/03/29/20131290500/\">a $125,000 grant</a> in mid 2012 and then <a href=\"http://blog.impactstory.org/2013/06/17/sloan/\">a two-year grant for $500,000</a> starting in 2013.  We also received <a href=\"http://blog.impactstory.org/2013/09/27/impactstory-awarded-300k-nsf-grant/\">a $300,000 grant</a> from the National Science Foundation to study how automatically-gathered impact metrics can improve the reuse of research software. </p>\n" +
    "\n" +
    "      <h3 id=\"why\">philosophy</h3>\n" +
    "      <p>As a philanthropically-funded not-for-profit, we're in this because we believe open altmetrics are key for building the coming era of Web-native science. We're committed to:</p>\n" +
    "      <ul>\n" +
    "         <li><a href=\"https://github.com/total-impact\">open source</a></li>\n" +
    "         <li><a href=\"http://blog.impactstory.org/2012/06/08/24638498595/\">free and open data</a>, to the extent permitted by data providers</li>\n" +
    "         <li><a href=\"http://en.wikipedia.org/wiki/Radical_transparency\">Radical transparency</a> and <a href=\"http://blog.impactstory.org\">open communication</a></li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <h3 id=\"board\">board of directors</h3>\n" +
    "\n" +
    "      <div class=\"board-member\">\n" +
    "         <img src=\"http://i.imgur.com/G4wUQb8.png\" height=100/>\n" +
    "         <p><strong>Heather Joseph</strong> is the Executive Director of the <a href=\"http://www.sparc.arl.org/\">Scholarly Publishing and Academic Resources Coalition (SPARC)</a> and the convener of the\n" +
    "            <a href=\"http://www.taxpayeraccess.org/\">Alliance for Taxpayer Access</a>. Prior to coming to SPARC, she spent 15 years as a publisher in both commercial and not-for-profit publishing organizations. She served as the publishing director at the American Society for Cell Biology, which became the first journal to commit its full content to the NIH’s pioneering open repository, PubMed Central.</p>\n" +
    "\n" +
    "         <p>Heather serves on the Board of Directors of numerous not-for-profit organizations, including the\n" +
    "            <a href=\"http://www.plos.org\">Public Library of Science</a>.  She is a frequent speaker and writer on scholarly communications in general, and on open access in particular.</p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"board-member\">\n" +
    "         <img src=\"http://i.imgur.com/dVJPqlw.png\" height=100/>\n" +
    "         <p><strong>Ethan White</strong> is an Associate Professor at Utah State University. He studies ecological systems using data-intensive approaches and is actively involved in open approaches to science. He has written papers on <a href=\"http://dx.doi.org/10.4033/iee.2013.6b.6.f\">data management and sharing</a>, <a href=\"http://dx.doi.org/10.1371/journal.pbio.1001745\">best practices in computational science</a>, and <a href=\"http://dx.doi.org/10.1371/journal.pbio.1001563\">the benefits of preprints in biology</a>.</p>\n" +
    "         <p>Ethan has a PhD in Biology from the University of New Mexico, was a National Science Foundation Postdoctoral Fellow in biological informatics, and is the recipient of a National Science Foundation CAREER 'Young Investigators' Award. He speaks frequently about data-intensive approaches to ecology, co-writes a <a href=\"http://jabberwocky.weecology.org\">blog on ecology, academia, and open science</a>, develops material and serves as an instructor for <a href=”http://software-carpentry.org/”>Software Carpentry</a>, and is active on Twitter(<a href=\"https://twitter.com/ethanwhite/\">@ethanwhite</a>).</p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"board-member\">\n" +
    "         <img src=\"http://static.tumblr.com/2d33e55fcae6625ea29a0ea14e6b99df/5mlmvbq/O15n1w7ty/tumblr_static_headshot_informal.jpg\" height=100/>\n" +
    "         <p><strong>John Wilbanks</strong> works at <a href=\"http://www.sagebase.org/our-leadership/\">Sage Bionetworks</a>, which helps build <a href=\"http://www.sagebase.org/governance/\">tools and policies</a> that help <a href=\"http://www.sagebase.org/bridge/\">networks of people who have their health data</a> share it with <a href=\"http://synapse.sagebase.org\">networks of people who like to analyze health data</a>.\n" +
    "         </p>\n" +
    "         <p>Previously, John worked at Harvard’s <a href=\"http://cyber.law.harvard.edu\">Berkman Center for Internet &amp; Society</a>, the <a href=\"http://www.w3.org/2001/sw/\" title=\"Semantic Web - World Wide Web Consortium\" target=\"_self\">World Wide Web Consortium</a>, the <a href=\"http://en.wikipedia.org/wiki/Pete_Stark\" title='Fortney \"Pete\" Stark' target=\"_self\">US House of Representatives</a>, <a href=\"http://creativecommons.org\" title=\"Creative Commons\" target=\"_self\">Creative Commons</a>, and the <a href=\"http://kauffman.org\">Ewing Marion Kauffman Foundation</a>. John also serves on the board of the non-profit\n" +
    "            <a href=\"http://earthsciencefoundation.org/\">Foundation for Earth Science</a> and advisory boards for companies including <a href=\"http://www.boundlesslearning.com/\">Boundless Learning</a>,  <a href=\"http://www.crunchbase.com/company/curious-inc\">Curious</a>,  <a href=\"http://genomera.com\">Genomera</a>, <a href=\"http://www.qualcommlife.com/\">Qualcomm Life</a>, <a href=\"http://patientslikeme.com\">Patients Like Me</a>, and <a href=\"http://www.genospace.com/\">GenoSpace</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "      <div id=\"contact\">\n" +
    "         <h3>Contact and FAQ</h3>\n" +
    "         <p>We'd love to hear your feedback, ideas, or just chat! Reach us at <a href=\"mailto:team@impactstory.org\">team@impactstory.org</a>, on <a href=\"http://twitter.com/#!/Impactstory\">Twitter</a>, or via our <a href=\"http://feedback.impactstory.org\">help forum.</a> Or if you've got questions, check out our <a href=\"/faq\">FAQ</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "   </div><!-- end wrapper -->\n" +
    "</div>");
}]);

angular.module("infopages/advisors.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/advisors.tpl.html",
    "<div class=\"main infopage\" id=\"advisors-infopage\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <h2 class=\"infopage-heading\">Impactstory advisors</h2>\n" +
    "\n" +
    "      <p>Do you love Impactstory and want to tell others about us? Are you already an advocate who wants cool perks like free subscriptions and high fives from our team?\n" +
    "      <strong>Become an Impactstory Advisor!</strong>\n" +
    "      We’re now accepting applications to be part of a select group of researchers and librarians who believe in Impactstory to help spread the word!</p>\n" +
    "      <img id=\"stickers-pic\" src=\"/static/img/many-stickers-2.jpg\" alt=\"many impactstory stickers\"/>\n" +
    "\n" +
    "      <h3>Advisor responsibilities</h3>\n" +
    "      <ul>\n" +
    "         <li>Maintain a top-notch Impactstory profile</li>\n" +
    "         <li>Invite friends and colleagues to try out Impactstory</li>\n" +
    "         <li>Help us understand the needs of researchers in your field or region</li>\n" +
    "         <li>Spread the word locally by hanging up our cool new posters</li>\n" +
    "         <li>Stay on top of the latest Impactstory news</li>\n" +
    "         <li>Host brown bag lunches and presentations on Impactstory in your school or library </li>\n" +
    "         <li>Engage your university's administration on how Impactstory can help its faculty</li>\n" +
    "         <li>Connect Impactstory to the rest of your online life--link to your profile from your Twitter bio, Facebook page, lab website, and anywhere else you can!</li>\n" +
    "         <li>Tell us your Impactstory success stories, in promotions, grants, tenure, and beyond.</li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <h3>Your Benefits</h3>\n" +
    "      <ul>\n" +
    "         <li>Satisfaction that you’re helping to change academic research evaluation for the better!</li>\n" +
    "         <li>Free Impactstory swag--t-shirts, stickers, and more!</li>\n" +
    "         <li>Free subscription to Impactstory</li>\n" +
    "         <li>A shiny Advisor badge for your Impactstory profile and website</li>\n" +
    "         <li>Have pizza and drinks on us when you give a demo or talk at your institution</li>\n" +
    "         <li>A community of like-minded, cutting-edge Advisors </li>\n" +
    "         <li>High fives from our team members, whenever you see them in person!</li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <div class=\"call-to-action\">\n" +
    "         <h3>\n" +
    "            Join the team--apply to the Advisor program today!\n" +
    "         </h3>\n" +
    "         <a class=\"btn btn-primary btn-lg\"\n" +
    "            target=\"_blank\"\n" +
    "            href=\"https://docs.google.com/forms/d/1oZ2UMv3h4wVkW1PhtdDiUD2npNsRuxouMnxgqeVFPdE/viewform\">Apply now</a>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "</div>");
}]);

angular.module("infopages/collection.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/collection.tpl.html",
    "<div class=\"main infopage no-page\" id=\"collections\">\n" +
    "\n" +
    "   <div class=\"wrapper\">\n" +
    "      <h2 class=\"infopage-heading\">Retired</h2>\n" +
    "      <p class=\"info\">\n" +
    "         This old-style collection page has been retired.\n" +
    "         Check out our new <a href=\"http://blog.impactstory.org/2013/06/17/impact-profiles/\">profile pages!</a>\n" +
    "      </p>\n" +
    "   </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("infopages/faq.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/faq.tpl.html",
    "<div class=\"main infopage\" id=\"faq\"><div class=\"wrapper\">\n" +
    "   <h2 class=\"infopage-heading\">FAQ</h2>\n" +
    "\n" +
    "   <h3 id=\"what\" class=\"first\">what is Impactstory?</h3>\n" +
    "\n" +
    "   <p>Impactstory is an open-source, web-based tool that helps researchers explore and share the diverse impacts of all their research products&mdash;from traditional ones like journal articles, to emerging products like blog posts, datasets, and software. By helping researchers tell data-driven stories about their impacts, we're helping to build a new scholarly reward system that values and encourages web-native scholarship. We’re funded by the Alfred P. Sloan Foundation and incorporated as a nonprofit corporation.\n" +
    "\n" +
    "   <p>Impactstory delivers <em>open metrics</em>, with <em>context</em>, for <em>diverse products</em>:</p>\n" +
    "   <ul>\n" +
    "      <li><b>Open metrics</b>: Our data (to the extent allowed by providers’ terms of service), <a href=\"https://github.com/total-impact\">code</a>, and <a href=\"http://blog.impactstory.org/2012/03/01/18535014681/\">governance</a> are all open.</li>\n" +
    "      <li><b>With context</b>: To help researcher move from raw <a href=\"http://altmetrics.org/manifesto/\">altmetrics</a> data to <a href=\"http://asis.org/Bulletin/Apr-13/AprMay13_Piwowar_Priem.html\">impact profiles</a> that tell data-driven stories, we sort metrics by <em>engagement type</em> and <em>audience</em>. We also normalize based on comparison sets: an evaluator may not know if 5 forks on GitHub is a lot of attention, but they can understand immediately if their project ranked in the 95th percentile of all GitHub repos created that year.</li>\n" +
    "      <li><b>Diverse products</b>: Datasets, software, slides, and other research products are presented as an integrated section of a comprehensive impact report, alongside articles--each genre a first-class citizen, each making its own kind of impact.</li>\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"audience\">who is it for?</h3>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><b>researchers</b> who want to know how many times their work has been downloaded, bookmarked, and blogged\n" +
    "      <li><b>research groups</b> who want to look at the broad impact of their work and see what has demonstrated interest\n" +
    "      <li><b>funders</b> who want to see what sort of impact they may be missing when only considering citations to papers\n" +
    "      <li><b>repositories</b> who want to report on how their research products are being discussed\n" +
    "      <li><b>all of us</b> who believe that people should be rewarded when their work (no matter what the format) makes a positive impact (no matter what the venue). Aggregating evidence of impact will facilitate appropriate rewards, thereby encouraging additional openness of useful forms of research output.\n" +
    "   </ul>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"uses\">how should it be used?</h3>\n" +
    "\n" +
    "   <p>Impactstory data can be:</p>\n" +
    "   <ul>\n" +
    "      <li>highlighted as indications of the <em>minimum</em> impact a research product has made on the community\n" +
    "      <li>explored more deeply to see who is citing, bookmarking, and otherwise using your work\n" +
    "      <li>run to collect usage information for mention in biosketches\n" +
    "      <li>included as a link in CVs\n" +
    "      <li>analyzed by downloading detailed metric information\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"pooruses\">how <em>shouldn’t</em> it be used?</h3>\n" +
    "\n" +
    "   <p>Some of these issues relate to the early-development phase of Impactstory, some reflect our <a href=\"http://www.mendeley.com/groups/586171/altmetrics/papers/\">early-understanding of altmetrics</a>, and some are just common sense.  Impactstory reports shouldn't be used:\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><b>as indication of comprehensive impact</b>\n" +
    "         <p>Impactstory is in early development. See <a href=\"#limitations\">limitations</a> and take it all with a grain of salt.\n" +
    "\n" +
    "            <li><b>for serious comparison</b>\n" +
    "               <p>Impactstory is currently better at collecting comprehensive metrics for some products than others, in ways that are not clear in the report. Extreme care should be taken in comparisons. Numbers should be considered minimums. Even more care should be taken in comparing collections of products, since some Impactstory is currently better at identifying products identified in some ways than others. Finally, some of these metrics can be easily gamed. This is one reason we believe having many metrics is valuable.\n" +
    "\n" +
    "                  <li><b>as if we knew exactly what it all means</b>\n" +
    "                     <p>The meaning of these metrics are not yet well understood; see <a href=\"#meaning\">section</a> below.\n" +
    "\n" +
    "                        <li><b>as a substitute for personal judgement of quality</b>\n" +
    "         <p>Metrics are only one part of the story. Look at the research product for yourself and talk about it with informed colleagues.\n" +
    "\n" +
    "   </ul>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"meaning\">what do these number actually mean?</h3>\n" +
    "\n" +
    "   <p>The short answer is: probably something useful, but we’re not sure what. We believe that dismissing the metrics as “buzz” is short-sighted: surely people bookmark and download things for a reason. The long answer, as well as a lot more speculation on the long-term significance of tools like Impactstory, can be found in the nascent scholarly literature on “altmetrics.”\n" +
    "\n" +
    "   <p><a href=\"http://altmetrics.org/manifesto/\">The Altmetrics Manifesto</a> is a good, easily-readable introduction to this literature. You can check out the shared <a href=\"http://www.mendeley.com/groups/586171/altmetrics/papers/\">altmetrics library</a> on Mendeley for a growing list of relevant research.\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"you-are-not-geting-all-my-citations\">you're not getting all my citations!</h3>\n" +
    "   <p>We'd love to display citation information from Google Scholar and Thomson Reuter's Web of Science in Impactstory, but sadly neither Google Scholar nor Web of Science allow us to do this. We're really pleased that Scopus has been more open with their data, allowing us to display their citation data on our website.  PubMed and Crossref are exemplars of open data: we display their citation counts on our website, in Impactstory widgets, and through our API.  As more citation databases open up, we'll include their data as fully as we can.</p>\n" +
    "\n" +
    "   <p>Each source of citation data gathers citations in its own ways, with their own strengths and limitations.  Web of Science gets  citation counts by manually gathering citations from a relatively small set of \"core\" journals.  Scopus and Google Scholar crawl a much more expansive set of publisher webpages, and Google also examines papers hosted elsewhere on the web.  PubMed looks at the reference sections of papers in PubMed Central, and CrossRef by looking at the reference lists that they see.  Google Scholar's scraping techniques and citation criteria are the most inclusive; the number of citations found by Google Scholar is typically the highest, though the least curated. A lot of folks have looked into the differences between citation counts from different providers, comparing Google Scholar, Scopus, and Web of Science and finding many differences; if you'd like to learn more, you might start with <a href=\"http://eprints.rclis.org/8605/\">this article.</a></p>\n" +
    "\n" +
    "\n" +
    "   <!--<h3 id=\"whichartifacts\">which identifiers are supported?</h3>\n" +
    "   <table class=\"permitted-artifact-ids\" border=1>\n" +
    "           <tr><th>artifact type</th><th>host</th><th>supported<br>ID format</th><th>example (id-type:id)</th><tr>\n" +
    "           <tr><td>published article</td><td>an article with a DOI</td><td>DOI</td><td><b>doi:</b>10.1371/journal.pcbi.1000361</td></tr>\n" +
    "           <tr><td>published article</td><td>an article in PubMed</td><td>PMID</td><td><b>pmid:</b>19304878</td></tr>\n" +
    "           <tr><td>dataset</td><td>Dryad or figshare</td><td>DOI</td><td><b>doi:</b>10.5061/dryad.1295</td></tr>\n" +
    "           <tr><td>software</td><td>GitHub</td><td>URL</td><td><b>url:</b>https://github.com/egonw/biostar-central</td></tr>\n" +
    "           <tr><td>slides</td><td>SlideShare</td><td>URL</td><td><b>url:</b>http://www.slideshare.net/phylogenomics/eisenall-hands</td></tr>\n" +
    "           <tr><td>generic</td><td>A conference paper, website resource, etc.</td><td>URL</td><td><b>url:</b>http://opensciencesummit.com/program/</td></tr>\n" +
    "   </table>-->\n" +
    "\n" +
    "   <h3 id=\"tos\">terms of use</h3>\n" +
    "   <p>Due to agreements we have made with data providers, you may not scrape this website -- use the embed or download funtionality instead.</p>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"copyright\">copyright</h3>\n" +
    "   <span class=\"text\">Except where otherwise noted, content on this site is licensed under the\n" +
    "      <a rel=\"license\" href=\"http://creativecommons.org/licenses/by/2.0/\">CC-BY license</a>.\n" +
    "   </span>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"percentiles\">Impactstory reports \"percentiles\" a lot. How are these calculated?</h3>\n" +
    "   <p>Stay tuned, we're writing this now...</p>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"whichmetrics\">which metrics are measured?</h3>\n" +
    "\n" +
    "   <p>Metrics are computed based on the following data sources (column names for CSV export are in parentheses):</p>\n" +
    "\n" +
    "   <ul id=\"providers-metadata\">\n" +
    "      <!-- the provider -->\n" +
    "      <li ng-repeat=\"provider in providers | orderBy: ['name']\">\n" +
    "         <a href=\"{{ provider.url }}\" class=\"provider-name\">{{ provider.name }}:</a> <span class=\"descr\">{{ provider.descr }}</span>\n" +
    "\n" +
    "         <ul>\n" +
    "            <!-- a metric supplied by this provider -->\n" +
    "            <li ng-repeat=\"(metric_name, metric) in provider.metrics\" class=\"metric\">\n" +
    "               <img ng-src=\"/static/img/favicons/{{ provider.name }}_{{ metric_name }}.ico\" width=\"16\" height=\"16\" />\n" +
    "               <strong>{{ metric.display_name }}</strong>\n" +
    "               <span class=\"metric-descr\">{{ metric.description }}</span>\n" +
    "               <span class=\"csv-name\">({{ provider.name }}:{{ metric_name }})</span>\n" +
    "            </li>\n" +
    "         </ul>\n" +
    "      </li>\n" +
    "   </ul>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"whereisif\">where is the journal impact factor?</h3>\n" +
    "\n" +
    "   <p>We do not include the Journal Impact Factor (or any similar proxy) on purpose. As has been <a href=\"https://www.zotero.org/groups/impact_factor_problems/items\">repeatedly shown</a>, the Impact Factor is not appropriate for judging the quality of individual research products. Individual article citations reflect much more about how useful papers actually were. Better yet are article-level metrics, as initiated by PLoS, in which we examine traces of impact beyond citation. Impactstory broadens this approach to reflect <b>product-level metrics</b>, by inclusion of preprints, datasets, presentation slides, and other research output formats.\n" +
    "\n" +
    "   <h3 id=\"similar\">where is my other favourite metric?</h3>\n" +
    "\n" +
    "   <p>We only include open metrics here, and so far only a selection of those. We welcome contributions of plugins. Write your own and tell us about it.\n" +
    "\n" +
    "   <p>Not sure Impactstory is your cup of tea?  Check out these similar tools:\n" +
    "   <ul>\n" +
    "      <li><a href=\"http://altmetric.com\">altmetric.com</a>\n" +
    "      <li><a href=\"http://www.plumanalytics.com/\">Plum Analytics</a>\n" +
    "      <li><a href=\"http://article-level-metrics.plos.org/\">PLoS Article-Level Metrics application</a>\n" +
    "      <li><a href=\"http://sciencecard.org/\">Science Card</a>\n" +
    "      <li><a href=\"http://citedin.org/\">CitedIn</a>\n" +
    "      <li><a href=\"http://readermeter.org/\">ReaderMeter</a>\n" +
    "   </ul>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"limitations\">what are the current limitations of the system?</h3>\n" +
    "\n" +
    "   <p>Impactstory is in early development and has many limitations. Some of the ones we know about:\n" +
    "\n" +
    "   <h4>gathering IDs sometimes misses products</h4>\n" +
    "   <ul>\n" +
    "      <li>ORCID and BibTex import sometimes can't parse or locate all objects.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h4>products are sometimes missing metrics</h4>\n" +
    "   <ul>\n" +
    "      <li>doesn’t display metrics with a zero value\n" +
    "      <li>sometimes the products were received without sufficient information to use all metrics. For example, the system sometimes can't figure out all URLs from a DOI.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h4>metrics sometimes have values that are too low</h4>\n" +
    "   <ul>\n" +
    "      <li>some sources have multiple records for a given product. Impactstory only identifies one copy and so only reports the impact metrics for that record. It makes no current attempt to aggregate across duplications within a source.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h4>other</h4>\n" +
    "   <ul>\n" +
    "      <li>the number of items on a report is currently limited.\n" +
    "   </ul>\n" +
    "\n" +
    "   Tell us about bugs! <a href=\"http://twitter.com/#!/Impactstory\">@Impactstory</a> (or via email to team@impactstory.org)\n" +
    "\n" +
    "   <h3 id=\"what-do-i-get\">what do I get for the $5 a month?</h3>\n" +
    "\n" +
    "   <p>Currently, your subscription dollars buy you an Impactstory profile (featuring open metrics, with context, for diverse research products) that updates weekly, pulling in your new publications, datasets, slide decks, and other research outputs alongside their updated metrics. You also get notification emails that tell you when new metrics are added to your profile.</p>\n" +
    "\n" +
    "   <p>We&rsquo;ll continue to add new and useful features over time, and your subscription will include those features, too.</p>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"why-charge\">Impactstory is a non-profit. Why are you charging for profiles?</h3>\n" +
    "\n" +
    "   <p>Impactstory is the best place in the world to learn and share your scholarly impact. With our new subscription model, we&rsquo;re able to offer you a profile not built on selling your personal data, or cramming your page with ads, or our ability to hustle up more funding, or on a hope Elsevier acquires us someday.</p>\n" +
    "\n" +
    "   <p>Impactstory profiles deliver real, practical value to real researchers every day. To continue doing so, we&rsquo;ve got to &ldquo;keep the lights on&rdquo; in a financially sustainable way.</p>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"can-i-keep-data\">do I get to keep my data if I unsubscribe?</h3>\n" +
    "\n" +
    "   <p>Yes. We&rsquo;re big believers in Open Data--it&rsquo;s one of the reasons we decided to make Impactstory non-profit! And unlike most commercial sites for academics, we allow users full control over their data, including the ability to export it in multiple formats. You can <a href=\"http://feedback.impactstory.org/knowledgebase/articles/398552-exporting-your-impactstory-profile-data\">export your data</a>&nbsp;at any time prior to unsubscribing.</p>\n" +
    "   <p>The only catch? We are bound by the terms of service of our data providers. We lobby them hard for the most open terms possible, but some still forbid anyone to download their data.</p>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"waiver\">what if I can&rsquo;t afford $5 a month?</h3>\n" +
    "\n" +
    "   <p>We’ve got a no-questions-asked waiver; send us an email to team@impactstory.org showing us how you’re linking to your Impactstory profile in your email signature and we’ll send you a coupon for a free account.</p>\n" +
    "\n" +
    "   <h3 id=\"fee-but-open\">how can profiles still be Open if they cost money?</h3>\n" +
    "\n" +
    "   <p>Good question! Much like other open science non-profits PLOS and Dryad support their missions and daily operations by recovering costs up front, we&rsquo;re asking our users to pay $5/month for an app that both helps them discover and share their scholarly impact and supports a larger mission of making altmetrics Open.</p>\n" +
    "\n" +
    "   <p>On the other hand, there are services like Google Scholar that are free for authors to use, but are far from Open.They don&rsquo;t allow authors to download and reuse their own citation data; they won&rsquo;t open up their source code nor provide an API, so others can improve upon their service; and they lack transparency that allows their users to understand exactly how metrics are gathered.</p>\n" +
    "\n" +
    "   <p>These &ldquo;free&rdquo; services are often backed by larger commercial operations or venture capital funding that are required to make money for shareholders. They do this by selling your data, or putting ads on your profile, or getting bought out by Elsevier. </p>\n" +
    "\n" +
    "   <p>In contrast, we&rsquo;re a non-profit that&rsquo;s fiercely committed to independence, openness, and transparency. End users can access Impactstory profiles for free; anyone can fork our app and build a better one using our open source code; and trial users and subscribers alike can access and reuse the data behind their profiles, in JSON or CSV formats, as open as we can make it. That won&rsquo;t change. It&rsquo;s who we are. But we need to be financially sustainable to keep on doing it.</p>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"isitopen\">is this data Open?</h3>\n" +
    "\n" +
    "   <p>We’d like to make all of the data displayed by Impactstory available under CC0. Unfortunately, the terms-of-use of most of the data sources don’t allow that. We're trying to figure out how to handle this.\n" +
    "   <p>An option to restrict the displayed reports to Fully Open metrics — those suitable for commercial use — is on the To Do list.\n" +
    "   <p>The Impactstory software itself is fully open source under an MIT license. <a href=\"https://github.com/total-impact\">GitHub</a>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"who\">who developed Impactstory?</h3>\n" +
    "\n" +
    "   <p>Concept originally hacked at the <a href=\"http://beyond-impact.org/\">Beyond Impact Workshop</a>, part of the Beyond Impact project funded by the Open Society Foundations <a href=\"https://github.com/mhahnel/Total-Impact/contributors\">(initial contributors)</a>.  Here's the <a href=\"/about\">current team</a>.\n" +
    "\n" +
    "   <h3 id=\"funding\">who funds Impactstory?</h3>\n" +
    "\n" +
    "   <p>Early development was done on personal time, plus some discretionary time while funded through <a href=\"http://dataone.org\">DataONE</a> (Heather Piwowar) and a <a href=\"http://gradschool.unc.edu/programs/royster\">UNC Royster Fellowship</a> (Jason Priem).\n" +
    "\n" +
    "   <p>In early 2012, Impactstory was given £17,000 through the <a href=\"http://beyond-impact.org/\">Beyond Impact project</a> from the <a href=\"http://www.soros.org/\">Open Society Foundation</a>.  As of May 2012, Impactstory is funded through a $125k grant from the <a href=\"http://sloan.org/\">Alfred P. Sloan Foundation. </a>\n" +
    "\n" +
    "   <h3 id=\"learned\">what have you learned?</h3>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li>the multitude of IDs for a given product is a bigger problem than we guessed. Even articles that have DOIs often also have urls, PubMed IDs, PubMed Central IDs, Mendeley IDs, etc. There is no one place to find all synonyms, yet the various APIs often only work with a specific one or two ID types. This makes comprehensive impact-gathering time consuming and error-prone.\n" +
    "      <li>some data is harder to get than we thought (wordpress stats without requesting consumer key information)\n" +
    "      <li>some data is easier to get than we thought (vendors willing to work out special agreements, permit web scraping for particular purposes, etc)\n" +
    "      <li>lack of an author-identifier makes us reliant on user-populated systems like Mendeley for tracking author-based work (we need ORCID and we need it now!)\n" +
    "      <li>API limits like those on PubMed Central (3 request per second) make their data difficult to incorporate in this sort of application\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"howhelp\">how can I help?</h3>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><b>do you have data?</b> If it is already available in some public format, let us know so we can add it. If it isn’t, either please open it up or contact us to work out some mutually beneficial way we can work together.\n" +
    "      <li><b>do you have money?</b> We need money :) We need to fund future development of the system and are actively looking for appropriate opportunities.\n" +
    "      <li><b>do you have ideas?</b> Maybe enhancements to Impactstory would fit in with a grant you are writing, or maybe you want to make it work extra-well for your institution’s research outputs. We’re interested: please get in touch (see bottom).\n" +
    "      <li><b>do you have energy?</b> We need better “see what it does” documentation, better lists of collections, etc. Make some and tell us, please!\n" +
    "      <li><b>do you have anger that your favourite data source is missing?</b> After you confirm that its data isn't available for open purposes like this, write to them and ask them to open it up... it might work. If the data is open but isn't included here, let us know to help us prioritize.\n" +
    "      <li><b>can you email, blog, post, tweet, or walk down the hall to tell a friend?</b> See the <a href=\"#cool\">this is so cool</a> section for your vital role....\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"cool\">this is so cool.</h3>\n" +
    "\n" +
    "   <p>Thanks! We agree :)\n" +
    "   <p>You can help us.  Demonstrating the value of Impactstory is key to receiving future funding.\n" +
    "   <p>Buzz and testimonials will help. Tweet your reports. Blog, send email, and show off Impactstory at your next group meeting to help spread the word.\n" +
    "   <p>Tell us how cool it is at <a href=\"http://twitter.com/#!/Impactstory\">@Impactstory</a> (or via email to team@impactstory.org) so we can consolidate the feedback.\n" +
    "\n" +
    "   <h3 id=\"suggestion\">I have a suggestion!</h3>\n" +
    "\n" +
    "   <p><b>We want to hear it.</b> Send it to us at <a href=\"http://twitter.com/#!/Impactstory\">@Impactstory</a> (or via email to team@impactstory.org).\n" +
    "\n" +
    "\n" +
    "</div><!-- end wrapper -->\n" +
    "</div><!-- end faq -->\n" +
    "</div>");
}]);

angular.module("infopages/landing.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/landing.tpl.html",
    "<div class=\"main infopage landing\">\n" +
    "   <div class=\"toolbar-container\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <login-toolbar></login-toolbar>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "   <div class=\"top-screen\" fullscreen> <!-- this needs to be set to the viewport height-->\n" +
    "\n" +
    "      <div id=\"tagline\">\n" +
    "         <div class=\"wrapper\">\n" +
    "            <img class=\"big-logo\" src=\"/static/img/impactstory-logo-no-type.png\" alt=\"\"/>\n" +
    "\n" +
    "\n" +
    "            <div class=\"landing-page main\" ng-show=\"landingPageType=='main'\">\n" +
    "               <h1>Uncover your full research impact.</h1>\n" +
    "               <h2>Impactstory is a place to learn and share all the ways your research is making a difference.</h2>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"landing-page main\" ng-show=\"landingPageType=='h-index'\">\n" +
    "               <h1>You're more than your h-index.</h1>\n" +
    "               <h2>Discover the full impact of your research</h2>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"landing-page main\" ng-show=\"landingPageType=='open-science'\">\n" +
    "               <h1>For open scientists.</h1>\n" +
    "               <h2>Discover the full impact of all your open science</h2>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "            <div id=\"call-to-action\">\n" +
    "               <a href=\"/signup\" class=\"btn btn-xlarge btn-primary primary-action\" id=\"signup-button\">What's my impact?</a>\n" +
    "               <!--<a href=\"/CarlBoettiger\"\n" +
    "                  ng-show=\"abTesting.getTestState['link to sample profile from landing page']=='yes'\"\n" +
    "                  class=\"btn btn-xlarge btn-default\"\n" +
    "                  id=\"secondary-cta-button\">See an example</a>-->\n" +
    "            </div>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"bottom-of-top-screen\">\n" +
    "         <div class=\"featured-and-supported\">\n" +
    "            <h3>featured in and supported by</h3>\n" +
    "            <img src=\"/static/img/logos/bbc.png\" />\n" +
    "            <img src=\"/static/img/logos/nature.png\" />\n" +
    "            <img src=\"/static/img/logos/chronicle.png\"/>\n" +
    "\n" +
    "            <span class=\"divider\"></span>\n" +
    "\n" +
    "            <img src=\"/static/img/logos/jisc.png\" />\n" +
    "            <img src=\"/static/img/logos/sloan.png\" />\n" +
    "            <img src=\"/static/img/logos/nsf.png\" />\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"ask-for-more\">\n" +
    "            <span>more <i class=\"icon-chevron-down\"></i></span>\n" +
    "         </div>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   <div id=\"selling-points\">\n" +
    "      <ul class=\"wrapper\">\n" +
    "         <li>\n" +
    "            <h3><i class=\"icon-bar-chart icon-3x\"></i><span class=\"text\">Citations and more</span></h3>\n" +
    "            <p>Find out where your work has been cited, viewed, downloaded, tweeted, and more.</p>\n" +
    "         </li>\n" +
    "         <li class=\"middle\">\n" +
    "            <h3><i class=\"icon-globe icon-3x\"></i><span class=\"text\">All your outputs</span></h3>\n" +
    "            <p>Discover and share the impacts of your articles, slides, datasets, and software.</p>\n" +
    "         </li>\n" +
    "         <li>\n" +
    "            <h3 id=\"its-open\"><i class=\"icon-unlock-alt icon-3x\"></i><span class=\"text\">Open and nonprofit</span></h3>\n" +
    "            <p>We're in this to improve science. Your data is open, and our code is open-source.</p>\n" +
    "         </li>\n" +
    "      </ul>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "   <div id=\"testimonials\">\n" +
    "      <ul class=\"wrapper\">\n" +
    "         <li>\n" +
    "            <img src=\"/static/img/people/luo.png\"/>\n" +
    "            <q class=\"text\">I don't need my CV now, Impactstory tells my story!</q>\n" +
    "            <cite>Ruibang Luo, Hong Kong University</cite>\n" +
    "         </li>\n" +
    "\n" +
    "         <li>\n" +
    "            <img src=\"/static/img/people/graziotin.jpeg\"/>\n" +
    "            <q class=\"text\">Every time I look at my Impactstory profile, I see that I did some good things and somebody actually noticed them. There is so much besides the number of citations. </q>\n" +
    "            <cite>Daniel Graziotin, Free University of Bozen-Bolzano</cite>\n" +
    "         </li>\n" +
    "\n" +
    "\n" +
    "      </ul>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"bottom-cta\">\n" +
    "      <div id=\"call-to-action\">\n" +
    "         <a href=\"/signup\" class=\"btn btn-large btn-primary primary-action\" id=\"create-collection\">What's my impact?</a>\n" +
    "         <!--<a href=\"/CarlBoettiger\" class=\"btn btn-large btn-primary secondary-action\" id=\"view-sample-collection\">Show me a sample profile</a>-->\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("infopages/spread-the-word.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/spread-the-word.tpl.html",
    "<div class=\"main infopage\" id=\"spread-the-word-infopage\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <h2 class=\"infopage-heading\">Spread the word</h2>\n" +
    "\n" +
    "      <div class=\"intro\">\n" +
    "         <p>Want to share the news about Impactstory with your colleagues? Great!\n" +
    "            Here are some resources to get you started; let us know if you've got other\n" +
    "            materials you could use as well. If you've translated any of these into another language,\n" +
    "            let us know that too...we’ll post them here! </p>\n" +
    "      </div>\n" +
    "\n" +
    "      <h3>Slides</h3>\n" +
    "      <div class=\"descr\">\n" +
    "         <p>\n" +
    "            A deck that introduces Impactstory, and describes how to set up an Impactstory profile. Use it in your next presentation, or create your own! Feel free to edit these slides to suit your needs.\n" +
    "         </p>\n" +
    "         <p>\n" +
    "            Click the <img src=\"http://i.imgur.com/ivV76hl.png\" alt=\"\"/> icon under the embedded slides on the right to\n" +
    "            download them as PDF or Powerpoint, or check them out on\n" +
    "            <a href=\"https://docs.google.com/presentation/d/1WhE8yNwQ1grOffBoXSbbpNJo8oY7YdOBy83x8NPVU7s\" target=\"_blank\">Google Slides.</a>\n" +
    "         </p>\n" +
    "         <p class=\"translations\">\n" +
    "            Translations:\n" +
    "            <a href=\"https://docs.google.com/presentation/d/1hl1MbX80g2Pnt2KAzBmZrC29e3udzto96l-ZxLo19Uk\" target=\"_blank\">Spanish</a>, courtesy Carlos Rodr&iacute;guez Rell&aacute;n;\n" +
    "            <a href=\"https://docs.google.com/presentation/d/1-R2ESFCXKuhD7pMMDcvHb6BywOdYgR4X833DOykcghk/edit\" target=\"_blank\">German</a>, courtesy Timo Lüke;\n" +
    "            <a href=\"https://docs.google.com/a/impactstory.org/file/d/0BzVyoVbp68fZSHIycHBGTlVtcEY1UmR6OXNXRXJ4dUtJdF9J/edit?pli=1\" target=\"_blank\">Persian</a>, courtesy Samad Keramatfar.\n" +
    "         </p>\n" +
    "      </div>\n" +
    "      <div class=\"content\">\n" +
    "         <iframe src=\"https://docs.google.com/presentation/d/1WhE8yNwQ1grOffBoXSbbpNJo8oY7YdOBy83x8NPVU7s/embed?start=false&loop=false&delayms=3000\"\n" +
    "                 frameborder=\"0\"\n" +
    "                 width=\"480\"\n" +
    "                 height=\"299\"\n" +
    "                 allowfullscreen=\"true\"\n" +
    "                 mozallowfullscreen=\"true\"\n" +
    "                 webkitallowfullscreen=\"true\">\n" +
    "        </iframe>\n" +
    "      </div>\n" +
    "\n" +
    "      <h3>Poster</h3>\n" +
    "      <div class=\"descr\">\n" +
    "         <p>\n" +
    "            Spread the word locally by hanging up our cool new posters!\n" +
    "         </p>\n" +
    "         <p>\n" +
    "            Download the 8.5” x 11” poster as\n" +
    "            <a href=\"/static/downloads/share-the-word-poster.docx\" target=\"_self\">Word,</a>\n" +
    "            <a href=\"/static/downloads/share-the-word-poster.pdf\" target=\"_self\">PDF, </a> or\n" +
    "            <a href=\"/static/downloads/share-the-word-poster.png\" target=\"_self\">PNG.</a>\n" +
    "         </p>\n" +
    "         <p class=\"translations\">\n" +
    "            Translations:\n" +
    "            <a href=\"/static/downloads/share-the-word-poster-german.pdf\" target=\"_self\">German, </a> courtesy Timo L&uuml;ke;\n" +
    "            <a href=\"https://docs.google.com/a/impactstory.org/document/d/1WCWxR7Q8SrZf5jUk_Kwt7vC6jklzu0zEdh-KPYvktOc/edit?pli=1\" target=\"_self\">Italian, </a> courtesy Giulia Nicolino and J Lawrence Dennis;\n" +
    "            <a href=\"/static/downloads/share-the-word-poster_PTBR.pdf\" target=\"_self\">Portuguese, </a> courtesy Atila Iamarino.\n" +
    "         </p>\n" +
    "      </div>\n" +
    "      <div class=\"content\">\n" +
    "         <img id=\"poster-sample-image\" src=\"/static/downloads/share-the-word-poster.png\" alt=\"image of impactstory poster\"/>\n" +
    "      </div>\n" +
    "\n" +
    "      <h3>Stickers</h3>\n" +
    "      <div class=\"descr\">\n" +
    "         <p>\n" +
    "            Let folks know you're more than your h-index, and show your support for Impactstory\n" +
    "            with these weather-resistant vinyl stickers.\n" +
    "         </p>\n" +
    "         <p>\n" +
    "           For a limited time we'll send you a pack for free! <br> <a href=\"https://docs.google.com/forms/d/1gpIGnifvh0YBGgMAGozBEWhBUP1EZGMYRn2X6U25XzM/viewform?usp=send_form\" target=\"_blank\">Get my free stickers</a>        </p>\n" +
    "      </div>\n" +
    "      <div class=\"content\">\n" +
    "         <img id=\"stickers-pic\" src=\"/static/img/stickers-sheet.jpg\" alt=\"many impactstory stickers\"/>\n" +
    "      </div>\n" +
    "\n" +
    "      <h3>Logo</h3>\n" +
    "      <div class=\"descr\">\n" +
    "         <p>\n" +
    "            Want to use our logo for your poster, presentation, or other informational resource? Go for it!\n" +
    "         </p>\n" +
    "         <p>\n" +
    "            Download logo as a <a href=\"/logo\" target=\"_self\">big ol' PNG</a>\n" +
    "         </p>\n" +
    "      </div>\n" +
    "      <div class=\"content\">\n" +
    "         <img id=\"stickers-pic\" src=\"/static/img/impactstory-logo-sideways.png\" alt=\"Impactstory logo\"/>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("password-reset/password-reset-header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("password-reset/password-reset-header.tpl.html",
    "<div class=\"password-reset-header\">\n" +
    "   <h1><a class=\"brand\" href=\"/\">\n" +
    "      <img src=\"/static/img/impactstory-logo-white.png\" alt=\"Impactstory\" /></a>\n" +
    "      <span class=\"text\">password reset</span>\n" +
    "   </h1>\n" +
    "</div>\n" +
    "<div ng-include=\"'notifications.tpl.html'\" class=\"container-fluid\"></div>\n" +
    "");
}]);

angular.module("password-reset/password-reset.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("password-reset/password-reset.tpl.html",
    "<div class=\"password-reset\">\n" +
    "   <form novalidate\n" +
    "         name=\"passwordResetForm\"\n" +
    "         class=\"form-horizontal password-reset\"\n" +
    "         ng-submit=\"onSave()\"\n" +
    "         ng-controller=\"passwordResetFormCtrl\"\n" +
    "        >\n" +
    "\n" +
    "      <!--<div class=\"inst\">\n" +
    "         Enter your new password:\n" +
    "      </div>-->\n" +
    "\n" +
    "      <div class=\"form-group new-password\">\n" +
    "         <label class=\"control-label sr-only\">New password</label>\n" +
    "         <div class=\"controls \">\n" +
    "            <input ng-model=\"password\"\n" +
    "                   name=\"newPassword\"\n" +
    "                   type=\"password\"\n" +
    "                   ng-show=\"!showPassword\"\n" +
    "                   class=\"form-control input-lg\"\n" +
    "                   placeholder=\"new password\"\n" +
    "                   required>\n" +
    "\n" +
    "            <input ng-model=\"password\"\n" +
    "                   name=\"newPassword\"\n" +
    "                   type=\"text\"\n" +
    "                   ng-show=\"showPassword\"\n" +
    "                   class=\"form-control input-lg\"\n" +
    "                   placeholder=\"new password\"\n" +
    "                   required>\n" +
    "         </div>\n" +
    "         <div class=\"controls show-password\">\n" +
    "            <pretty-checkbox value=\"showPassword\" text=\"Show\"></pretty-checkbox>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div class=\"form-group submit\">\n" +
    "         <div>\n" +
    "            <save-buttons></save-buttons>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "   </form>\n" +
    "</div>");
}]);

angular.module("pdf/pdf-viewer.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("pdf/pdf-viewer.tpl.html",
    "<div id=\"pdf-nav\" class=\"pdf-nav\" ng-class=\"getNavStyle(scroll)\">\n" +
    "  <button class=\"btn\" ng-click=\"goPrevious()\"><span><i class=\"icon-chevron-left\"></i>prev</span></button>\n" +
    "  <span>\n" +
    "     <span class=\"current-page\">\n" +
    "        page {{ pageNum }}\n" +
    "     </span>\n" +
    "     <span class=\"page-count\">\n" +
    "         of {{pageCount}}\n" +
    "     </span>\n" +
    "  </span>\n" +
    "  <button class=\"btn\" ng-click=\"goNext()\"><span>next <i class=\"icon-chevron-right\"></i></span></button>\n" +
    "</div>\n" +
    "\n" +
    "<canvas id=\"pdf-canvas\" class=\"rotate0\" width=\"675\"></canvas>\n" +
    "\n" +
    "");
}]);

angular.module("product-page/edit-product-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("product-page/edit-product-modal.tpl.html",
    "<!--<div class=\"modal-header\">\n" +
    "   <button type=\"button\" class=\"close\" ng-click=\"$dismiss()\">&times;</button>\n" +
    "   <h3>Edit {{ fieldToEdit }}</h3>\n" +
    "</div>-->\n" +
    "\n" +
    "<div class=\"modal-body edit-product\">\n" +
    "\n" +
    "   <form\n" +
    "           name=\"editProductForm\"\n" +
    "           novalidate\n" +
    "           ng-submit=\"onSave()\"\n" +
    "           ng-controller=\"editProductFormCtrl\">\n" +
    "\n" +
    "      <div class=\"form-group\" ng-show=\"fieldToEdit=='title'\">\n" +
    "         <label>Edit publication title:</label>\n" +
    "         <input\n" +
    "           class=\"form-control\"\n" +
    "           type=\"text\"\n" +
    "           required\n" +
    "           name=\"productTitle\"\n" +
    "           ng-model=\"product.biblio.title\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"from-group\" ng-show=\"fieldToEdit=='authors'\">\n" +
    "         <label>Edit authors:</label>\n" +
    "         <input\n" +
    "           type=\"text\"\n" +
    "           class=\"form-control\"\n" +
    "           name=\"productAuthors\"\n" +
    "           ng-model=\"product.biblio.authors\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\" ng-show=\"fieldToEdit=='year'\">\n" +
    "         <label>Edit publication year:</label>\n" +
    "         <input\n" +
    "           type=\"text\"\n" +
    "           class=\"form-control\"\n" +
    "           name=\"productYear\"\n" +
    "           ng-model=\"product.biblio.year\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\" ng-show=\"fieldToEdit=='journal'\">\n" +
    "         <label>Edit journal:</label>\n" +
    "         <input\n" +
    "           type=\"text\"\n" +
    "           class=\"form-control\"\n" +
    "           name=\"productJournal\"\n" +
    "           ng-model=\"product.biblio.journal\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\" ng-show=\"fieldToEdit=='repository'\">\n" +
    "         <label>Edit repository:</label>\n" +
    "         <input\n" +
    "           type=\"text\"\n" +
    "           class=\"form-control\"\n" +
    "           name=\"productJournal\"\n" +
    "           ng-model=\"product.biblio.journal\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\" ng-show=\"fieldToEdit=='keywords'\">\n" +
    "         <label>\n" +
    "            Edit publication keywords:\n" +
    "            <span class=\"sublabel\">Separate keywords with semicolons</span>\n" +
    "         </label>\n" +
    "         <input\n" +
    "           type=\"text\"\n" +
    "           class=\"form-control\"\n" +
    "           name=\"productYear\"\n" +
    "           ng-model=\"product.biblio.keywords\">\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"form-group\" ng-show=\"fieldToEdit=='abstract'\">\n" +
    "         <label>Edit publication abstract:</label>\n" +
    "         <input\n" +
    "           type=\"text\"\n" +
    "           class=\"form-control\"\n" +
    "           name=\"productYear\"\n" +
    "           ng-model=\"product.biblio.abstract\">\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <save-buttons valid=\"editProductForm.$valid\"></save-buttons>\n" +
    "\n" +
    "   </form>\n" +
    "</div>\n" +
    "");
}]);

angular.module("product-page/fulltext-location-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("product-page/fulltext-location-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <button type=\"button\" class=\"close\" ng-click=\"$dismiss()\">&times;</button>\n" +
    "   <h3>Embed your article</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body free-fulltext-url\">\n" +
    "\n" +
    "   <div class=\"add-link\">\n" +
    "      <p>Do you already have a free version of this article, outside any paywalls?\n" +
    "         Nice! You can embed it on this page via URL.\n" +
    "      </p>\n" +
    "\n" +
    "      <form\n" +
    "              name=\"freeFulltextUrlForm\"\n" +
    "              novalidate\n" +
    "              ng-submit=\"onSave()\"\n" +
    "              ng-controller=\"freeFulltextUrlFormCtrl\">\n" +
    "         <div class=\"input-group\">\n" +
    "            <span class=\"input-group-addon icon-globe\"></span>\n" +
    "            <input\n" +
    "                    class=\"free-fulltext-url form-control\"\n" +
    "                    type=\"url\"\n" +
    "                    name=\"freeFulltextUrl\"\n" +
    "                    required\n" +
    "                    placeholder=\"Paste the link to PDF or image file here\"\n" +
    "                    ng-model=\"free_fulltext_url\" />\n" +
    "         </div>\n" +
    "         <save-buttons ng-show=\"freeFulltextUrlForm.$valid && freeFulltextUrlForm.$dirty\"\n" +
    "                       valid=\"freeFulltextUrlForm.$valid\"></save-buttons>\n" +
    "\n" +
    "      </form>\n" +
    "   </div>\n" +
    "</div>");
}]);

angular.module("product-page/percentilesInfoModal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("product-page/percentilesInfoModal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <button type=\"button\" class=\"close\" ng-click=\"$close()\">&times;</button>\n" +
    "   <h3>What do these numbers mean?</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "   <p>Impactstory classifies metrics along two dimensions: <strong>audience</strong> (<em>scholars</em> or the <em>public</em>) and <strong>type of engagement</strong> with research (<em>view</em>, <em>discuss</em>, <em>save</em>, <em>cite</em>, and <em>recommend</em>).</p>\n" +
    "\n" +
    "   <p>For each metric, the coloured bar shows its percentile relative to all articles indexed in the Web of Science that year.  The bars show a range, representing the 95% confidence interval around your percentile (and also accounting for ties).  Along with ranges, we show “Highly” badges for metrics above the 75th percentile that exceed a minimum frequency.</p>\n" +
    "\n" +
    "   <p>Each metric's raw count is shown to the left of its name.  Click the raw count to visit that metric source's external page for the item; there, you can explore the engagement in more detail.</p>\n" +
    "\n" +
    "   <p>For more information, see these blog posts and <a href=\"{{ url_for('faq') }}\">FAQ</a> sections:</p>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><a href=\"http://blog.impactstory.org/2012/09/10/31256247948/\">What do we expect?</a></li>\n" +
    "      <li><a href=\"http://blog.impactstory.org/2012/09/14/31524247207/\">Our framework for classifying altmetrics</a></li>\n" +
    "      <li>Reference sets: <a href=\"http://blog.impactstory.org/2012/09/13/31461657926/\">Motivation</a>; Choosing Web of Science (TBA)</li>\n" +
    "      <li>Percentiles: <a href=\"http://blog.impactstory.org/2012/09/11/31342582590/\">Part 1</a>, <a href=\"http://blog.impactstory.org/2012/09/12/31408899657/\">Part 2</a>, and <a href=\"http://blog.impactstory.org/2012/09/12/31411187588/\">Part 3</a></li>\n" +
    "      <li>Why <a href=\"{{ url_for('faq') }}#toc_3_9\">citation counts may not be what you expect</a></li>\n" +
    "      <li>Sampling and 95% confidence (TBA)</li>\n" +
    "   </ul>\n" +
    "</div>");
}]);

angular.module("product-page/product-page.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("product-page/product-page.tpl.html",
    "<div class=\"product-page\">\n" +
    "\n" +
    "   <div class=\"content wrapper\">\n" +
    "      <!--<div class=\"working\" ng-show=\"loading.is('productPage')\">\n" +
    "         <i class=\"icon-refresh icon-spin\"></i>\n" +
    "         <span class=\"text\">Loading product...</span>\n" +
    "      </div>-->\n" +
    "\n" +
    "\n" +
    "      <div class=\"main-content\">\n" +
    "\n" +
    "         <div id=\"biblio\">\n" +
    "            <h2 class=\"title\">\n" +
    "               <span class=\"return-to-profile-link-container\">\n" +
    "                  <a class=\"return-to-profile\"\n" +
    "                     tooltip=\"return to {{ profileWithoutProducts.given_name }}'s {{ genre }} list\"\n" +
    "                     href=\"/{{ profileWithoutProducts.url_slug }}/products/{{ genre }}\">\n" +
    "                     <i class=\"icon-chevron-left\"></i>\n" +
    "                  </a>\n" +
    "               </span>\n" +
    "\n" +
    "               <span class=\"title-text\"\n" +
    "                     tooltip=\"click to edit\"\n" +
    "                     tooltip-placement=\"left\"\n" +
    "                     e-rows=\"3\"\n" +
    "                     onaftersave=\"updateBiblio('title')\"\n" +
    "                     ng-show=\"!loading.is('updateBiblio.title') && userOwnsThisProfile\"\n" +
    "                     editable-textarea=\"biblio.display_title\">\n" +
    "                  {{biblio.display_title || \"click to enter title\"}}\n" +
    "               </span>\n" +
    "\n" +
    "               <span class=\"title-text\" ng-show=\"!userOwnsThisProfile\">\n" +
    "                  {{biblio.display_title }}\n" +
    "               </span>\n" +
    "\n" +
    "               <span class=\"loading\" ng-show=\"loading.is('updateBiblio.title')\">\n" +
    "                  <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                  updating publication year...\n" +
    "               </span>\n" +
    "            </h2>\n" +
    "\n" +
    "            <div class=\"optional-biblio\">\n" +
    "\n" +
    "               <!-- authors line -->\n" +
    "               <div class=\"biblio-line\">\n" +
    "                  <span class=\"biblio-field authors\">\n" +
    "\n" +
    "                     <span class=\"value\"\n" +
    "                           tooltip=\"click to edit\"\n" +
    "                           tooltip-placement=\"right\"\n" +
    "                           onaftersave=\"updateBiblio('authors')\"\n" +
    "                           ng-show=\"!loading.is('updateBiblio.authors') && userOwnsThisProfile\"\n" +
    "                           editable-text=\"biblio.authors\">\n" +
    "                     {{ biblio.display_authors || \"click to enter authors\" }}\n" +
    "                     </span>\n" +
    "                     <span class=\"value\" ng-show=\"!userOwnsThisProfile\">\n" +
    "                     {{ biblio.display_authors }}\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"loading\" ng-show=\"loading.is('updateBiblio.authors')\">\n" +
    "                        <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                        updating authors...\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "               </div>\n" +
    "\n" +
    "\n" +
    "               <!-- date and journal/repo line -->\n" +
    "               <div class=\"biblio-line date-and-source\">\n" +
    "                  <span class=\"biblio-field year\">\n" +
    "\n" +
    "                     <span class=\"value biblio-year\"\n" +
    "                           tooltip=\"click to edit\"\n" +
    "                           tooltip-placement=\"left\"\n" +
    "                           ng-show=\"!loading.is('updateBiblio.year') && userOwnsThisProfile\"\n" +
    "                           onaftersave=\"updateBiblio('year')\"\n" +
    "                           editable-text=\"biblio.year\">\n" +
    "                        {{ biblio.display_year || \"click to enter publication year\" }}\n" +
    "                     </span>\n" +
    "                     <span class=\"value biblio-year\" ng-show=\"!userOwnsThisProfile\">\n" +
    "                        {{ biblio.display_year }}\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"loading\" ng-show=\"loading.is('updateBiblio.year')\">\n" +
    "                        <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                        updating publication year...\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "                  <span class=\"biblio-field repository\"\n" +
    "                        ng-show=\"biblio.repository && !biblio.journal\">\n" +
    "\n" +
    "                     <span class=\"value\"\n" +
    "                        tooltip=\"click to edit\"\n" +
    "                        tooltip-placement=\"right\"\n" +
    "                        editable-text=\"biblio.repository\"\n" +
    "                        onaftersave=\"updateBiblio('repository')\"\n" +
    "                        ng-show=\"!loading.is('updateBiblio.repository') && userOwnsThisProfile\">\n" +
    "                        {{ biblio.repository || 'click to enter repository' }}.\n" +
    "                     </span>\n" +
    "                     <span class=\"value\" ng-show=\"!userOwnsThisProfile\">\n" +
    "                        {{ biblio.repository }}.\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"loading\" ng-show=\"loading.is('updateBiblio.repository')\">\n" +
    "                        <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                        updating repository...\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "                  <span class=\"biblio-field journal\" ng-show=\"biblio.journal\">\n" +
    "\n" +
    "                     <span class=\"value\"\n" +
    "                        tooltip=\"click to edit\"\n" +
    "                        tooltip-placement=\"right\"\n" +
    "                        editable-text=\"biblio.journal\"\n" +
    "                        onaftersave=\"updateBiblio('journal')\"\n" +
    "                        ng-show=\"!loading.is('updateBiblio.journal') && userOwnsThisProfile\">\n" +
    "                        {{ biblio.journal || 'click to enter journal' }}\n" +
    "                     </span>\n" +
    "                     <span class=\"value\" ng-show=\"!userOwnsThisProfile\">\n" +
    "                        {{ biblio.journal }}\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"loading\" ng-show=\"loading.is('updateBiblio.journal')\">\n" +
    "                        <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                        updating journal...\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "               </div>\n" +
    "\n" +
    "\n" +
    "               <!-- abstract line -->\n" +
    "               <div class=\"biblio-line abstract\">\n" +
    "                  <span class=\"biblio-field abstract\" ng-show=\"userOwnsThisProfile\">\n" +
    "                     <span class=\"biblio-field-label\">Abstract:</span>\n" +
    "                     <span class=\"value\"\n" +
    "                        tooltip=\"click to edit\"\n" +
    "                        tooltip-placement=\"right\"\n" +
    "                        ng-show=\"!loading.is('updateBiblio.abstract')\"\n" +
    "                        editable-textarea=\"biblio.abstract\"\n" +
    "                        onaftersave=\"updateBiblio('abstract')\">\n" +
    "                        {{ truncatedAbstract() || 'click to enter abstract'}}\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"more-abstract\"\n" +
    "                           ng-hide=\"loading.is('updateBiblio.abstract') || userWantsFullAbstract || !biblio.abstract\"\n" +
    "                           ng-click=\"userWantsFullAbstract=true\">\n" +
    "                        (more)\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"loading\" ng-show=\"loading.is('updateBiblio.abstract')\">\n" +
    "                        <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                        updating abstract...\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "                  <!-- show this abstract markup if the user doesn't own this profile -->\n" +
    "                  <span class=\"biblio-field abstract\" ng-show=\"!userOwnsThisProfile && biblio.abstract\">\n" +
    "                     <span class=\"biblio-field-label\">Abstract:</span>\n" +
    "                     <span class=\"value\">\n" +
    "                        {{ truncatedAbstract() }}\n" +
    "                     </span>\n" +
    "                     <span class=\"more-abstract\"\n" +
    "                           ng-hide=\"loading.is('updateBiblio.abstract') || userWantsFullAbstract || !biblio.abstract\"\n" +
    "                           ng-click=\"userWantsFullAbstract=true\">\n" +
    "                        (more)\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "\n" +
    "               </div>\n" +
    "\n" +
    "\n" +
    "               <!-- keywords line -->\n" +
    "               <div class=\"biblio-line keywords\">\n" +
    "\n" +
    "                  <span class=\"biblio-field keywords\" ng-show=\"userOwnsThisProfile\">\n" +
    "                     <span class=\"biblio-field-label\">Keywords:</span>\n" +
    "                     <span class=\"value\"\n" +
    "                        tooltip=\"click to edit\"\n" +
    "                        tooltip-placement=\"right\"\n" +
    "                        editable-text=\"biblio.keywords\"\n" +
    "                        onaftersave=\"updateBiblio('keywords')\"\n" +
    "                        ng-show=\"!loading.is('updateBiblio.keywords')\">\n" +
    "                        {{ biblio.keywords || 'click to enter keywords (separate with semicolons)'}}\n" +
    "                     </span>\n" +
    "                     <span class=\"loading\" ng-show=\"loading.is('updateBiblio.keywords')\">\n" +
    "                        <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                        updating keywords...\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "                  <span class=\"biblio-field keywords\" ng-show=\"!userOwnsThisProfile && biblio.keywords\">\n" +
    "                     <span class=\"biblio-field-label\">Keywords:</span>\n" +
    "\n" +
    "                     <span class=\"value\">\n" +
    "                        {{ biblio.keywords }}\n" +
    "                     </span>\n" +
    "                  </span>\n" +
    "\n" +
    "\n" +
    "\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"share-buttons\">\n" +
    "               <!--\n" +
    "               <a class=\"facebook\"\n" +
    "                  ng-click=\"fbShare()\">\n" +
    "                     facebook\n" +
    "                  </a>\n" +
    "               -->\n" +
    "               <a class=\"twitter\"\n" +
    "                  tooltip=\"Share this {{ genre }} on Twitter\"\n" +
    "                  href=\"https://twitter.com/share?text={{ biblio.display_title }}&url={{ page.getUrl() }}\"\n" +
    "                  target=\"_blank\">\n" +
    "                  <img ng-src=\"/static/img/favicons/twitter.ico\" />\n" +
    "               </a>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "         </div><!-- end biblio section -->\n" +
    "\n" +
    "\n" +
    "         <div id=\"resource\">\n" +
    "\n" +
    "\n" +
    "            <div id=\"file\" ng-show=\"hasEmbeddedFile\">\n" +
    "               <div class=\"iframe-wrapper\" dynamic=\"iframeToEmbed\"></div>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div id=\"linkout\" ng-show=\"!hasEmbeddedFile\">\n" +
    "               <div class=\"icon\">\n" +
    "                  <i class=\"icon-link\"></i>\n" +
    "               </div>\n" +
    "\n" +
    "               <div class=\"content\">\n" +
    "                  <h3>{{ genre }} available via\n" +
    "                     <a href=\"{{ aliases.resolved_url }}\" class=\"product-host\">\n" +
    "                        {{ productHost }}\n" +
    "                     </a>\n" +
    "                     <span class=\"locked-icon\" ng-show=\"!biblio.free_fulltext_url\">\n" +
    "                        <i class=\"icon-lock\"\n" +
    "                           ng-show=\"!userOwnsThisProfile\"\n" +
    "                           tooltip=\"{{ genre }} may be paywalled.\"></i>\n" +
    "\n" +
    "                        <i class=\"icon-lock\"\n" +
    "                           ng-show=\"userOwnsThisProfile\"\n" +
    "                           tooltip=\"{{ genre }} may be paywalled. To improve visibility, consider uploading a freely-readable copy.\"></i>\n" +
    "                     </span>\n" +
    "                  </h3>\n" +
    "                  <a class=\"full-url\" href=\"{{ aliases.resolved_url }}\">\n" +
    "                     {{ aliases.resolved_url }}\n" +
    "                  </a>\n" +
    "                  <div class=\"oa-version\" ng-show=\"biblio.free_fulltext_url\">\n" +
    "                     <div class=\"oa-version-label\">\n" +
    "                        <i class=\"icon-unlock-alt\"></i>\n" +
    "                        Open access version via\n" +
    "                        <a href=\"{{ biblio.free_fulltext_url }}\">{{ freeFulltextHost }}</a>\n" +
    "                     </div>\n" +
    "                  </div>\n" +
    "\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"upload-cta\"\n" +
    "                 ng-show=\"!hasEmbeddedFile && userOwnsThisProfile && uploadableHost\"\n" +
    "                 ng-controller=\"productUploadCtrl\">\n" +
    "\n" +
    "               <div class=\"not-uploaded-yet\" ng-show=\"!loading.is('productUpload')\">\n" +
    "                  <h4>Make this {{ genre }} more visible</h4>\n" +
    "                  <h5>\n" +
    "                     Upload a copy here to make it freely available to everyone&mdash;and get readership stats you can use.\n" +
    "                  </h5>\n" +
    "                  <div class=\"file-upload-container\">\n" +
    "                     <div class=\"file-upload-button btn btn-primary\"\n" +
    "                          onclick=\"document.getElementById('file-upload-button').click();\">\n" +
    "                        <span class=\"text\">Share your {{ genre }}</span>\n" +
    "                     </div>\n" +
    "                     <input id=\"file-upload-button\" type=\"file\" ng-file-select=\"onFileSelect($files)\">\n" +
    "                     <span class=\"or\">or</span>\n" +
    "                     <a class=\"embed-from-url\" ng-click=\"openFulltextLocationModal()\">embed from url</a>\n" +
    "                  </div>\n" +
    "\n" +
    "                  <div class=\"notes\">\n" +
    "                     <span class=\"sherpa-romeo\">\n" +
    "                        Learn more about your uploading rights and responsibilities at\n" +
    "                        <a href=\"http://www.sherpa.ac.uk/romeo/\" target=\"_blank\">SHERPA/RoMEO</a>\n" +
    "                     </span>\n" +
    "                  </div>\n" +
    "               </div>\n" +
    "\n" +
    "               <div class=\"uploading-now\" ng-show=\"loading.is('productUpload')\">\n" +
    "                  <div class=\"content\">\n" +
    "                     <i class=\"icon-refresh icon-spin left\"></i>\n" +
    "                     Uploading {{ genre }}&hellip;\n" +
    "                  </div>\n" +
    "               </div>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "            <div id=\"citation\">\n" +
    "               <ul class=\"aliases\">\n" +
    "                  <li class=\"doi\" ng-show=\"aliases.display_best_url && !aliases.display_doi\">\n" +
    "                     <span class=\"key\">URL:</span>\n" +
    "                     <a class=\"value\" href=\"{{ aliases.display_best_url }}\">{{ aliases.display_best_url }} <i class=\"icon-external-link\"></i></a>\n" +
    "                  </li>\n" +
    "\n" +
    "                  <li class=\"doi\" ng-show=\"aliases.display_doi\">\n" +
    "                     <span class=\"key\">DOI:</span>\n" +
    "                     <a class=\"value\" href=\"http://dx.doi.org/{{ aliases.display_doi }}\">{{ aliases.display_doi }}<i class=\"icon-external-link right\"></i></a>\n" +
    "                  </li>\n" +
    "                  <li class=\"pmid\" ng-show=\"aliases.display_pmid\">\n" +
    "                     <span class=\"key\">PubMed ID:</span>\n" +
    "                     <a class=\"value\" href=\"http://www.ncbi.nlm.nih.gov/pubmed/\">{{ aliases.display_doi }}<i class=\"icon-external-link\"></i></a>\n" +
    "                  </li>\n" +
    "               </ul>\n" +
    "\n" +
    "               <div class=\"text-citation\">\n" +
    "                  <span class=\"key\">Citation:</span>\n" +
    "                  <span class=\"value\">\n" +
    "                     <span class=\"authors\">{{ biblio.authors }}</span>\n" +
    "                     <span class=\"year\">({{ biblio.display_year }}).</span>\n" +
    "                     <span class=\"title\">{{ biblio.display_title }}.</span>\n" +
    "                     <span class=\"host\"> {{ biblio.display_host }}</span>\n" +
    "                  </span>\n" +
    "               </div>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "         </div>\n" +
    "\n" +
    "      </div><!-- end main-content -->\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "      <div id=\"product-page-sidebar\">\n" +
    "\n" +
    "         <!--\n" +
    "         <div class=\"download-button-container\">\n" +
    "            <div class=\"btn btn-default\" ng-click=\"downloadFile()\">Download</div>\n" +
    "         </div>\n" +
    "         -->\n" +
    "\n" +
    "         <div id=\"metrics\">\n" +
    "            <ul class=\"metric-details-list\">\n" +
    "\n" +
    "               <li class=\"metric-detail\" ng-repeat=\"metric in metrics | orderBy:'-display_order' | filter: {hide_badge: false}\">\n" +
    "                  <span class=\"metric-text\">\n" +
    "                     <a class=\"value-and-name\"\n" +
    "                        href=\"{{ metric.drilldown_url }}\"\n" +
    "                        target=\"_blank\"\n" +
    "                        tooltip-placement=\"left\"\n" +
    "                        tooltip=\"{{ metric.config.description }} Click to see more details on {{ metric.display_provider }}.\">\n" +
    "                        <img ng-src='/static/img/favicons/{{ metric.provider_name }}_{{ metric.interaction }}.ico' class='icon' >\n" +
    "                        <span class=\"raw-value\">{{ metric.display_count }}</span>\n" +
    "                        <span class=\"environment\">{{ metric.display_provider }}</span>\n" +
    "                        <span class=\"interaction\">{{ metric.display_interaction }}</span>\n" +
    "                        <i class=\"icon-external-link-sign\"></i>\n" +
    "                     </a>\n" +
    "\n" +
    "                     <span class=\"new-metrics\"\n" +
    "                           ng-show=\"metric.diff_value > 0\"\n" +
    "                           tooltip=\"{{ metric.diff_value }} new {{ metric.display_provider }} {{ metric.display_interaction }} in the last week\">\n" +
    "                      +{{ metric.diff_value }}\n" +
    "                     </span>\n" +
    "\n" +
    "                     <a class=\"percentile\"\n" +
    "                        ng-show=\"metric.percentile\"\n" +
    "                        href=\"/faq#percentiles\"\n" +
    "                        target=\"_self\"\n" +
    "                        tooltip-placement=\"left\"\n" +
    "                        tooltip=\"Compared to other {{ metric.percentile.mendeley_discipline_str }} {{ displayGenrePlural }} from {{ biblio.display_year }}. Click to read more about how we determine percentiles.\">\n" +
    "                        <span class=\"values\">\n" +
    "                           <span class=\"value\">{{ metric.percentile_value_string }}</span>\n" +
    "                           <span class=\"unit\">percentile</span>\n" +
    "                        </span>\n" +
    "                        <span class=\"descr\">on Impactstory.</span>\n" +
    "                     </a>\n" +
    "\n" +
    "                  </span>\n" +
    "               </li>\n" +
    "            </ul>\n" +
    "         </div>\n" +
    "      </div><!-- end sidebar -->\n" +
    "\n" +
    "   </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("profile-award/profile-award.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-award/profile-award.tpl.html",
    "<div class=\"award-container\" ng-show=\"!security.isLoggedIn(url_slug) && profileAward.award_badge\">\n" +
    "   <span class=\"profile-award\"\n" +
    "        ng-controller=\"ProfileAwardCtrl\"\n" +
    "        data-content=\"{{ profile.given_name }} has made {{ profileAward.level_justification }}\"\n" +
    "        data-original-title=\"{{ profileAward.level_name }} level award\"\n" +
    "        ng-show=\"profileAward.level>0\">\n" +
    "\n" +
    "      <span class=\"icon level-{{ profileAward.level }}\">\n" +
    "         <i class=\"icon-unlock-alt\"></i>\n" +
    "      </span>\n" +
    "      <span class=\"text\">{{ profileAward.name }}</span>\n" +
    "\n" +
    "   </span>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"award-container\" ng-show=\"security.isLoggedIn(url_slug) && profileAward.award_badge\">\n" +
    "   <span class=\"profile-award\"\n" +
    "        ng-controller=\"ProfileAwardCtrl\"\n" +
    "        data-content=\"You've made {{ profileAward.level_justification }} Nice work! <div class='call-to-action'>{{ profileAward.call_to_action }}.</div>\"\n" +
    "        data-original-title=\"{{ profileAward.level_name }} level award\"\n" +
    "        ng-show=\"profileAward.level>0\">\n" +
    "\n" +
    "      <span class=\"icon level-{{ profileAward.level }}\">\n" +
    "         <i class=\"icon-unlock-alt\"></i>\n" +
    "      </span>\n" +
    "      <span class=\"text\">{{ profileAward.name }}</span>\n" +
    "\n" +
    "   </span>\n" +
    "   <a href=\"https://twitter.com/share\" class=\"twitter-share-button\" data-url=\"https://impactstory.org/{{ url_slug }}?utm_source=sb&utm_medium=twitter\" data-text=\"I got a new badge on my Impactstory profile: {{ profileAward.level_name }}-level {{ profileAward.name }}!\" data-via=\"impactstory\" data-count=\"none\"></a>\n" +
    "</div>");
}]);

angular.module("profile-linked-accounts/profile-linked-accounts.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-linked-accounts/profile-linked-accounts.tpl.html",
    "<div class=\"profile-linked-accounts profile-subpage\" >\n" +
    "   <div class=\"profile-accounts-header profile-subpage-header\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <a back-to-profile></a>\n" +
    "         <h1 class=\"instr\">Connect to other accounts</h1>\n" +
    "         <h2>We'll automatically import your products from all over the web,\n" +
    "            so your profile stays up to date.</h2>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"accounts\">\n" +
    "      <div class=\"account\"\n" +
    "           ng-repeat=\"account in accounts\"\n" +
    "           ng-controller=\"accountCtrl\"\n" +
    "           ng-include=\"'accounts/account.tpl.html'\">\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
}]);

angular.module("profile-sidebar/profile-sidebar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-sidebar/profile-sidebar.tpl.html",
    "<div class=\"profile-sidebar\"\n" +
    "     ng-show=\"profile.about.given_name\"\n" +
    "     ng-controller=\"profileSidebarCtrl\">\n" +
    "\n" +
    "   <h1>\n" +
    "      <a href=\"/{{ profile.about.url_slug }}\">\n" +
    "         <span class=\"given-name\">{{ profile.about.given_name }}</span>\n" +
    "         <span class=\"surname\">{{ profile.about.surname }}</span>\n" +
    "      </a>\n" +
    "   </h1>\n" +
    "\n" +
    "   <div class=\"nav\">\n" +
    "      <a href=\"/{{ profile.about.url_slug }}\" ng-class=\"{active: page.isNamed('overview')}\">\n" +
    "         <i class=\"icon-user left\"></i>\n" +
    "         <span class=\"text\">\n" +
    "            Overview\n" +
    "         </span>\n" +
    "         <div class=\"arrow\"></div>\n" +
    "      </a>\n" +
    "      <div class=\"nav-group genres\">\n" +
    "         <ul>\n" +
    "            <li ng-repeat=\"genre in profile.genres | orderBy: 'name'\">\n" +
    "               <a href=\"/{{ profile.about.url_slug }}/products/{{ genre.url_representation }}\"\n" +
    "                  ng-class=\"{active: page.isNamed(genre.url_representation)}\">\n" +
    "                  <i class=\"{{ genre.icon }} left\"></i>\n" +
    "                  <span class=\"text\">\n" +
    "                     {{ genre.plural_name }}\n" +
    "                  </span>\n" +
    "                  <span class=\"count value\">\n" +
    "                     ({{ genre.num_products }})\n" +
    "                  </span>\n" +
    "               </a>\n" +
    "            </li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "   \n" +
    "   <div class=\"footer\">\n" +
    "      <login-toolbar></login-toolbar>\n" +
    "      <a href=\"/\" class=\"logo\">\n" +
    "         <img src=\"static/img/impactstory-logo-sideways.png\" alt=\"\"/>\n" +
    "      </a>\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("profile-single-products/profile-single-products.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-single-products/profile-single-products.tpl.html",
    "<div class=\"profile-single-products profile-subpage\" >\n" +
    "   <div class=\"profile-single-products-header profile-subpage-header\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <a back-to-profile></a>\n" +
    "         <h1 class=\"instr\">Import individual products</h1>\n" +
    "         <h2>(For faster importing, you can also\n" +
    "            <a href=\"/{{ url_slug }}/accounts\">link your external accounts</a> to Impactstory, and we'll sync them automatically)</h2>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"profile-single-products-body\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <form name=\"import-single-products\"\n" +
    "               ng-submit=\"onSubmit()\"\n" +
    "               ng-controller=\"ImportSingleProductsFormCtrl\">\n" +
    "            <textarea class=\"form-control\"\n" +
    "                      name=\"single-produts\"\n" +
    "                      ng-model=\"newlineDelimitedProductIds\"\n" +
    "                      placeholder=\"Paste products IDs here, one per line\"\n" +
    "                      id=\"single-products-importer\">\n" +
    "             </textarea>\n" +
    "            <save-buttons action=\"Import\"></save-buttons>\n" +
    "         </form>\n" +
    "\n" +
    "         <div class=\"id-sources\">\n" +
    "             <h3>Supported ID types:</h3>\n" +
    "            <ul class=\"accepted-ids\">\n" +
    "               <li><span class=\"id-type\">Article PMIDs</span><img src=\"/static/img/logos/pubmed.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Article DOIs</span><img src=\"/static/img/logos/crossref.jpg\" /></li>\n" +
    "               <li><span class=\"id-type\">Dataset DOIs</span><img src=\"/static/img/logos/dryad.png\" /><img src=\"/static/img/logos/figshare.png\" /></li>\n" +
    "               <li><span class=\"id-type\">GitHub repo URLs</span><img src=\"/static/img/logos/github.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Webpage URLs</span><img src=\"/static/img/logos/products-by-url.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Slide deck URLs</span><img src=\"/static/img/logos/slideshare.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Video URLs</span><img src=\"/static/img/logos/vimeo.png\" /><img src=\"/static/img/logos/youtube.png\" /></li>\n" +
    "            </ul>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
}]);

angular.module("profile/profile-embed-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile/profile-embed-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Embed profile</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"$close()\">&times;</a>\n" +
    "</div>\n" +
    "<div class=\"modal-body embed\">\n" +
    "   <label>\n" +
    "        <input type=\"radio\" name=\"embed-type\"\n" +
    "               value=\"link\" ng-model=\"embed.type\" />\n" +
    "      <span class=\"text\">Embed a <br><strong>link to this profile</strong></span>\n" +
    "      <img src=\"static/img/impactstory-logo.png\" alt=\"Impactstory logo\"/>\n" +
    "    </label>\n" +
    "\n" +
    "   <label>\n" +
    "        <input type=\"radio\" name=\"embed-type\"\n" +
    "               value=\"profile\" ng-model=\"embed.type\" />\n" +
    "      <span class=\"text\">Embed this <br><strong>whole profile at full size</strong></span>\n" +
    "      <img src=\"static/img/embedded-profile-example.png\" alt=\"Impactstory profile\"/>\n" +
    "    </label>\n" +
    "\n" +
    "\n" +
    "   <div class=\"code\">\n" +
    "      <div class=\"embed-profile\" ng-show=\"embed.type=='profile'\">\n" +
    "         <h3>Paste this code in your page source HTML:</h3>\n" +
    "         <textarea rows=\"3\">&lt;iframe src=\"{{ baseUrl }}/embed/{{ url_slug }}\" width=\"100%\" height=\"600\"&gt;&lt;/iframe&gt;</textarea>\n" +
    "      </div>\n" +
    "      <div class=\"embed-link\" ng-show=\"embed.type=='link'\">\n" +
    "         <h3>Paste this code in your page source HTML:</h3>\n" +
    "         <textarea rows=\"3\">&lt;a href=\"{{ baseUrl }}/{{ url_slug }}\"&gt;&lt;img src=\"{{ baseUrl}}/logo/small\" width=\"200\" /&gt;&lt;/a&gt;</textarea>\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("profile/profile.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile/profile.tpl.html",
    "<div class=\"profile-header\" ng-show=\"userExists\">\n" +
    "      <div class=\"loading\" ng-show=\"profileLoading()\">\n" +
    "         <div class=\"working\"><i class=\"icon-refresh icon-spin\"></i><span class=\"text\">Loading profile info...</span></div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"profile-header-loaded\" ng-show=\"!profileLoading()\">\n" +
    "\n" +
    "         <div class=\"my-vitals\">\n" +
    "            <div class=\"my-picture\" ng-show=\"profile.about.id\">\n" +
    "               <a href=\"http://www.gravatar.com\" >\n" +
    "                  <img class=\"gravatar\" ng-src=\"//www.gravatar.com/avatar/{{ profile.about.email_hash }}?s=110&d=mm\" data-toggle=\"tooltip\" class=\"gravatar\" rel=\"tooltip\" title=\"Modify your icon at Gravatar.com\" /> \n" +
    "               </a>\n" +
    "            </div>\n" +
    "            <!--\n" +
    "            <h2 class='page-title editable-name' id=\"profile-owner-name\">\n" +
    "               <span class=\"given-name editable\" data-name=\"given_name\">{{ profile.about.given_name }}</span>\n" +
    "               <span class=\"surname editable\" data-name=\"surname\">{{ profile.about.surname }}</span>\n" +
    "            </h2>\n" +
    "            -->\n" +
    "            <div class=\"my-metrics\">\n" +
    "               <!-- advisor badge -->\n" +
    "               <div class=\"advisor\" ng-show=\"profile.about.is_advisor\">\n" +
    "                  <img src=\"/static/img/advisor-badge.png\">\n" +
    "               </div>\n" +
    "               <ul class=\"profile-award-list\">\n" +
    "                  <li class=\"profile-award-container level-{{ profileAward.level }}\"\n" +
    "                      ng-include=\"'profile-award/profile-award.tpl.html'\"\n" +
    "                      ng-repeat=\"profileAward in profile.awards\">\n" +
    "                  </li>\n" +
    "               </ul>\n" +
    "            </div>\n" +
    "            <div class=\"bio\">\n" +
    "               Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n" +
    "            </div>\n" +
    "            <div class=\"connected-accounts\">\n" +
    "               <ul>\n" +
    "                  <li ng-repeat=\"linkedAccount in filteredLinkedAccounts = (profile.about.linked_accounts | filter: {profile_url: '!!'})\">\n" +
    "                     <a href=\"{{ linkedAccount.profile_url }}\" target=\"_blank\">\n" +
    "                        <img ng-src=\"/static/img/favicons/{{ linkedAccount.service }}.ico\">\n" +
    "                        <span class=\"service\">{{ linkedAccount.display_service }}</span>\n" +
    "                     </a>\n" +
    "                  </li>\n" +
    "               </ul>\n" +
    "\n" +
    "               <div class=\"add-connected-account\" ng-show=\"security.isLoggedIn(url_slug)\">\n" +
    "                  <a href=\"/{{ profile.about.url_slug }}/accounts\" class=\"btn btn-xs btn-info\">\n" +
    "                     <i class=\"icon-link left\"></i>\n" +
    "                     <span ng-show=\"filteredLinkedAccounts.length==0\" class=\"first\">Import from accounts</span>\n" +
    "                     <span ng-show=\"filteredLinkedAccounts.length>0\" class=\"more\">Connect more accounts</span>\n" +
    "                  </a>\n" +
    "               </div>\n" +
    "            </div>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"view-controls\">\n" +
    "            <!--<a><i class=\"icon-refresh\"></i>Refresh metrics</a>-->\n" +
    "            <div class=\"admin-controls\" ng-show=\"security.isLoggedIn(url_slug) && !page.isEmbedded()\">\n" +
    "               <a href=\"/{{ profile.about.url_slug }}/products/add\">\n" +
    "                  <i class=\"icon-upload\"></i>Import individual products\n" +
    "               </a>\n" +
    "               <!--<a ng-click=\"dedup()\">\n" +
    "                  <i class=\"icon-copy\"></i>dedup\n" +
    "               </a>-->\n" +
    "            </div>\n" +
    "            <div class=\"everyone-controls\">\n" +
    "               <a ng-click=\"openProfileEmbedModal()\" ng-show=\"!page.isEmbedded()\">\n" +
    "                  <i class=\"icon-suitcase\"></i>\n" +
    "                  Embed\n" +
    "               </a>\n" +
    "               <span class=\"dropdown download\">\n" +
    "                  <a id=\"adminmenu\" role=\"button\" class=\"dropdown-toggle\"><i class=\"icon-download\"></i>Download</a>\n" +
    "                  <ul class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"adminmenu\">\n" +
    "                     <li><a tabindex=\"-1\" href=\"/profile/{{ profile.about.url_slug }}/products.csv\" target=\"_self\"><i class=\"icon-table\"></i>csv</a></li>\n" +
    "                     <li><a tabindex=\"-1\" href=\"/profile/{{ profile.about.url_slug }}?hide=markup,awards\" target=\"_blank\"><i class=\"json\">{&hellip;}</i>json</a></li>\n" +
    "                  </ul>\n" +
    "               </span>\n" +
    "            </div>\n" +
    "         </div>\n" +
    "\n" +
    "      </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"genres\">\n" +
    "      <ul class=\"genre-list\">\n" +
    "         <li ng-repeat=\"genre in profile.genres | orderBy:'name'\" class=\"genre genre-{{ genre.plural_name }}\">\n" +
    "            <div class=\"genre-header\">\n" +
    "               <h3 class=\"genre-name\">\n" +
    "                  <a href=\"/{{ profile.about.url_slug }}/products/{{ genre.name }}\"\n" +
    "                     tooltip=\"view all {{ genre.num_products }} {{ genre.plural_name }}\">\n" +
    "                     <span class=\"total-products\">\n" +
    "                        {{ genre.num_products }}\n" +
    "                     </span>\n" +
    "                     <span class=\"name\">\n" +
    "                        {{ genre.plural_name }}\n" +
    "                     </span>\n" +
    "                  </a>\n" +
    "                  <span class=\"num-products-with-new-metrics\" ng-show=\"genre.num_products_with_new_metrics\">\n" +
    "                     ({{ genre.num_products_with_new_metrics }} have new impacts this week)\n" +
    "                  </span>\n" +
    "               </h3>\n" +
    "            </div>\n" +
    "            <div class=\"genre-body\">\n" +
    "               <ul class=\"genre-cards-best\">\n" +
    "                  <li class=\"genre-card\" ng-repeat=\"card in sliceSortedCards(genre.cards, 0, 3)\">\n" +
    "                     <img ng-src='/static/img/favicons/{{ card.provider }}_{{ card.interaction }}.ico' class='icon' >\n" +
    "                     <span class=\"card-accumulation\" ng-show=\"card.card_type=='GenreAccumulationCard'\">\n" +
    "                        <span class=\"value\">{{ nFormat(card.current_value) }}</span>\n" +
    "                        <span class=\"key\">\n" +
    "                           <span class=\"provider\">{{ card.provider }}</span>\n" +
    "                           <span class=\"interaction\">{{ card.interaction }}</span>\n" +
    "                        </span>\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"card-products-with-more-than-this\" ng-show=\"card.card_type=='GenreProductsWithMoreThanCard'\">\n" +
    "                        <span class=\"value\">{{ card.number_products_this_good }}</span>\n" +
    "                        <span class=\"key\">\n" +
    "                           <span class=\"genre-name\">\n" +
    "                              {{ genre.plural_name }} with\n" +
    "                           </span>\n" +
    "                           <span class=\"threshold\">\n" +
    "                              <span class=\"threshold-value\">\n" +
    "                                 {{ nFormat(card.metric_threshold_value) }}+\n" +
    "                              </span>\n" +
    "                              <span class=\"provider\">{{ card.provider }}</span>\n" +
    "                              <span class=\"interaction\">{{ card.interaction }}</span>\n" +
    "                           </span>\n" +
    "                        </span>\n" +
    "                     </span>\n" +
    "\n" +
    "                  </li>\n" +
    "               </ul>\n" +
    "\n" +
    "               <ul class=\"genre-cards-second-best\">\n" +
    "                  <li class=\"genre-card\" ng-repeat=\"card in sliceSortedCards(genre.cards, 3, 6)\">\n" +
    "\n" +
    "                     <!-- all this is copy/pasted from above -->\n" +
    "                     <img ng-src='/static/img/favicons/{{ card.provider }}_{{ card.interaction }}.ico' class='icon' >\n" +
    "                     <span class=\"card-accumulation\" ng-show=\"card.card_type=='GenreAccumulationCard'\">\n" +
    "                        <span class=\"value\">{{ nFormat(card.current_value) }}</span>\n" +
    "                        <span class=\"key\">\n" +
    "                           <span class=\"provider\">{{ card.provider }}</span>\n" +
    "                           <span class=\"interaction\">{{ card.interaction }}</span>\n" +
    "                        </span>\n" +
    "                     </span>\n" +
    "\n" +
    "                     <span class=\"card-accumulation\" ng-show=\"card.card_type=='GenreProductsWithMoreThanCard'\">\n" +
    "                        <span class=\"value\">{{ card.number_products_this_good }}</span>\n" +
    "                        <span class=\"key\">\n" +
    "                           <span class=\"explanation\">\n" +
    "                              {{ genre.plural_name }} with\n" +
    "                              <span class=\"threshold-value\">\n" +
    "                                 {{ nFormat(card.metric_threshold_value) }}+\n" +
    "                              </span>\n" +
    "                           </span>\n" +
    "                           <span class=\"provider\">{{ card.provider }}</span>\n" +
    "                           <span class=\"interaction\">{{ card.interaction }}</span>\n" +
    "                        </span>\n" +
    "                     </span>\n" +
    "\n" +
    "                  </li>\n" +
    "               </ul>\n" +
    "            </div>\n" +
    "         </li>\n" +
    "      </ul>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "<div class=\"user-does-not-exist no-page\" ng-show=\"!userExists\">\n" +
    "   <h2>Whoops!</h2>\n" +
    "   <p>We don't have a user account for <span class=\"slug\">'{{ profile.about.url_slug }}.'</span><br> Would you like to <a href=\"/signup\">make one?</a></p>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"signup-banner animated fadeOutDown\"\n" +
    "     ng-show=\"userExists && !isAuthenticated()\"\n" +
    "     ng-if=\"!hideSignupBanner\">\n" +
    "\n" +
    "   <span class=\"msg\">Join {{ profile.about.given_name }} and thousands of other scientists:</span>\n" +
    "   <a class=\"signup-button btn btn-primary btn-sm\" ng-click=\"clickSignupLink()\" href=\"/signup\">Try Impactstory for free</a>\n" +
    "   <a class=\"close-link\" ng-click=\"hideSignupBannerNow()\">&times;</a>\n" +
    "</div>\n" +
    "\n" +
    "<a class=\"refresh\" ng-click=\"refresh()\"></a>\n" +
    "\n" +
    "");
}]);

angular.module("profile/tour-start-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile/tour-start-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Welcome to Impactstory, {{ userAbout.given_name }}!</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"$close()\">&times;</a>\n" +
    "</div>\n" +
    "<div class=\"modal-body tour-start\">\n" +
    "   <p>\n" +
    "      This is your Impactstory profile page, where you can explore, edit, and share\n" +
    "      your impact data. It's always accessible at\n" +
    "      <span class=\"url\">impactstory.org/{{ userAbout.url_slug }}</span>\n" +
    "   </p>\n" +
    "\n" +
    "   <p>\n" +
    "     Before you share, though, you'll want to import some of your research products from around the web:\n" +
    "   </p>\n" +
    "\n" +
    "   <a class=\"btn btn-primary\"\n" +
    "      ng-click=\"$close()\"\n" +
    "      href=\"/{{ userAbout.url_slug }}/accounts\">\n" +
    "      Import my products\n" +
    "      <i class=\"icon-cloud-upload left\"></i>\n" +
    "   </a>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("security/login/form.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login/form.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Sign in</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"cancel()\">&times;</a>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "   <div id=\"user-message-modal\">\n" +
    "      <div class=\"animated fadeInDown fadeOutUp\"\n" +
    "           ng-class=\"['alert', 'alert-'+userMessage.get().type]\"\n" +
    "           ng-if=\"userMessage.get().message\">\n" +
    "             <span class=\"text\" ng-bind-html=\"userMessage.get().message\"></span>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <form name=\"loginForm\" novalidate class=\"login-form form-inline\" autocomplete=\"off\">\n" +
    "      <div class=\"form-group\" >\n" +
    "         <label class=\"sr-only\">E-mail</label>\n" +
    "         <div class=\"controls input-group\" has-focus ng-class=\"{'has-success': loginForm.login.$valid}\">\n" +
    "            <span class=\"input-group-addon\"><i class=\"icon-envelope-alt\"></i></span>\n" +
    "            <input name=\"login\" required autofocus\n" +
    "                   autocomplete=\"off\"\n" +
    "                   class=\"form-control\"\n" +
    "                   type=\"username\"\n" +
    "                   ng-model=\"user.email\"\n" +
    "                   placeholder=\"email\" >\n" +
    "         </div>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"sr-only\">Password</label>\n" +
    "         <div class=\"controls input-group\" has-focus ng-class=\"{'has-success': loginForm.pass.$valid}\">\n" +
    "            <span class=\"input-group-addon\"><i class=\"icon-key\"></i></span>\n" +
    "            <input name=\"pass\" required\n" +
    "                   autocomplete=\"off\"\n" +
    "                   class=\"form-control\"\n" +
    "                   type=\"password\"\n" +
    "                   ng-model=\"user.password\"\n" +
    "                   placeholder=\"password\">\n" +
    "         </div>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "         <button class=\"btn btn-primary login\"\n" +
    "            ng-disabled='loginForm.$invalid'\n" +
    "            ng-click=\"login()\"\n" +
    "            ng-hide=\"loading.is('login')\">Sign in</button>\n" +
    "\n" +
    "         <div class=\"working\" ng-show=\"loading.is('login')\">\n" +
    "            <i class=\"icon-refresh icon-spin\"></i>\n" +
    "            <span class=\"text\">logging in...</span>\n" +
    "         </div>\n" +
    "         <a class=\"forgot-login-details\" ng-click=\"showForgotPasswordModal()\">\n" +
    "            <i class=\"icon-question-sign\"></i>\n" +
    "            Forgot your login details?\n" +
    "         </a>\n" +
    "      </div>\n" +
    "   </form>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("security/login/reset-password-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login/reset-password-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Reset password</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"close()\">&times;</a>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "   <form name=\"form\" ng-show=\"!emailSubmitted()\" novalidate class=\"reset-password creds form-inline\">\n" +
    "      <div class=\"inst\">Enter your email and we'll send you instructions on how to reset your password.</div>\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"sr-only\">E-mail</label>\n" +
    "         <input name=\"login\" class=\"form-control\" type=\"email\" ng-model=\"user.email\" placeholder=\"email\" required autofocus>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "         <button class=\"btn btn-primary login\" ng-click=\"sendEmail()\" ng-disabled='form.$invalid'>Reset password</button>\n" +
    "      </div>\n" +
    "   </form>\n" +
    "   <div ng-show=\"emailSubmitted()\" class=\"email-submitted\">\n" +
    "      <div class=\"inst\">\n" +
    "         We've sent you password reset email. It should arrive in a few minutes\n" +
    "         (don't forget to check your spam folder).\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "         <button class=\"btn btn-primary cancel\" ng-click=\"close()\">OK</button>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("security/login/toolbar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login/toolbar.tpl.html",
    "<ul class=\"account-nav\">\n" +
    "   <li ng-show=\"currentUser\" class=\"logged-in-user nav-item\">\n" +
    "      <a class=\"current-user\"\n" +
    "         href=\"/{{ currentUser.url_slug }}\"\n" +
    "         tooltip-placement=\"left\"\n" +
    "         tooltip=\"View your profile\">\n" +
    "         <img class=\"gravatar\" ng-src=\"//www.gravatar.com/avatar/{{ profile.about.email_hash }}?s=110&d=mm\" data-toggle=\"tooltip\" class=\"gravatar\" rel=\"tooltip\" title=\"Modify your icon at Gravatar.com\" />\n" +
    "      </a>\n" +
    "   </li>\n" +
    "   <li ng-show=\"currentUser\" class=\"controls nav-item\">\n" +
    "\n" +
    "      <span class=\"or\"></span>\n" +
    "\n" +
    "      <!-- made security load too slow.\n" +
    "\n" +
    "      <span class=\"new-metrics control no-new-metrics\"\n" +
    "         tooltip=\"No new metrics.\"\n" +
    "         tooltip-placement=\"bottom\"\n" +
    "         ng-show=\"!illuminateNotificationIcon()\">\n" +
    "         <i class=\"icon-bell\"></i>\n" +
    "      </span>\n" +
    "      <a class=\"new-metrics control has-new-metrics\"\n" +
    "         tooltip=\"You've got new metrics!\"\n" +
    "         tooltip-placement=\"bottom\"\n" +
    "         ng-show=\"illuminateNotificationIcon()\"\n" +
    "         ng-click=\"dismissProfileNewProductsNotification()\"\n" +
    "         href=\"/{{ currentUser.url_slug }}?filter=has_diff\">\n" +
    "         <i class=\"icon-bell-alt\"></i>\n" +
    "      </a>\n" +
    "\n" +
    "      <span class=\"or\"></span>\n" +
    "      -->\n" +
    "      <span class=\"or\"></span>\n" +
    "      <a class=\"logout control\"\n" +
    "         tooltip-placement=\"left\"\n" +
    "         ng-click=\"logout()\"\n" +
    "         tooltip=\"Log out\">\n" +
    "         <i class=\"icon-signout\"></i>\n" +
    "      </a>\n" +
    "\n" +
    "\n" +
    "      <a class=\"preferences control\"\n" +
    "         href=\"/settings/profile\"\n" +
    "         tooltip-placement=\"left\"\n" +
    "         tooltip=\"Change profile settings\">\n" +
    "         <i class=\"icon-cog\"></i>\n" +
    "      </a>\n" +
    "\n" +
    "      <a class=\"add-products control\"\n" +
    "         href=\"{{ currentUser.url_slug }}/accounts\"\n" +
    "         tooltip-placement=\"left\"\n" +
    "         tooltip=\"Add accounts or products\">\n" +
    "         <i class=\"icon-plus\"></i>\n" +
    "      </a>\n" +
    "\n" +
    "      <a class=\"help control\"\n" +
    "         href=\"javascript:void(0)\"\n" +
    "         data-uv-lightbox=\"classic_widget\"\n" +
    "         data-uv-mode=\"full\"\n" +
    "         data-uv-primary-color=\"#cc6d00\"\n" +
    "         data-uv-link-color=\"#007dbf\"\n" +
    "         data-uv-default-mode=\"support\"\n" +
    "         data-uv-forum-id=\"166950\"\n" +
    "         tooltip-placement=\"left\"\n" +
    "         tooltip=\"Get help or report bug\">\n" +
    "         <i class=\"icon-question\"></i>\n" +
    "      </a>\n" +
    "   </li>\n" +
    "\n" +
    "   <li ng-show=\"!currentUser\" class=\"login-and-signup nav-item\">\n" +
    "      <a ng-show=\"!page.isLandingPage()\" class=\"signup\" href=\"/signup\">Sign up</a>\n" +
    "      <span ng-show=\"!page.isLandingPage()\" class=\"or\"></span>\n" +
    "      <a class=\"login\" ng-click=\"login()\">Log in<i class=\"icon-signin\"></i></a>\n" +
    "   </li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("settings/custom-url-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/custom-url-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Custom URL</h1>\n" +
    "   <p>Customize the URL people use to reach your profile</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate name=\"userUrlForm\" class=\"form-horizontal custom-url\" ng-submit=\"onSave()\" ng-controller=\"urlSettingsCtrl\">\n" +
    "   <div class=\"form-group custom-url\"\n" +
    "        ng-model=\"user.url_slug\"\n" +
    "        ng-class=\"{ 'has-error':  userUrlForm.url_slug.$invalid && userUrlForm.url_slug.$dirty && !loading.is(),\n" +
    "                    'has-success': userUrlForm.url_slug.$valid && userUrlForm.url_slug.$dirty && !loading.is() }\">\n" +
    "\n" +
    "      <div class=\"controls input-group col-sm-9\">\n" +
    "         <span class=\"input-group-addon\">impactstory.org/</span>\n" +
    "         <input ng-model=\"user.url_slug\"\n" +
    "                name=\"url_slug\"\n" +
    "                class=\"form-control\"\n" +
    "                required\n" +
    "                data-require-unique\n" +
    "                ng-pattern=\"/^[-\\w\\.]+$/\"\n" +
    "                 />\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div class=\"feedback col-sm-3\">\n" +
    "\n" +
    "         <div class=\"help-block checking one-line\" ng-show=\"loading.is('requireUnique')\">\n" +
    "            <i class=\"icon-refresh icon-spin\"></i>\n" +
    "            <span class=\"text\">Checking...</span>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"help-block error\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$error.pattern\n" +
    "               && userUrlForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            This URL has invalid characters.\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"help-block error\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$error.requireUnique\n" +
    "               && userUrlForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            Someone else is using that URL.\n" +
    "         </div>\n" +
    "         <div class=\"help-block success one-line\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$valid\n" +
    "               && userUrlForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            Looks good!\n" +
    "         </div>\n" +
    "         <div class=\"help-block\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$pristine\n" +
    "               && !loading.is()\">\n" +
    "            This is your current URL.\n" +
    "         </div>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-10\">\n" +
    "         <save-buttons valid=\"userUrlForm.$valid\"></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/email-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/email-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "  <h1>Email</h1>\n" +
    "  <p>Change email address used for login and contact</p>\n" +
    "</div>\n" +
    "\n" +
    "<form novalidate name=\"userEmailForm\" class=\"form-horizontal custom-url\" ng-submit=\"onSave()\" ng-controller=\"emailSettingsCtrl\">\n" +
    "  <div class=\"form-group change-email\"\n" +
    "  ng-model=\"user.email\"\n" +
    "  ng-class=\"{ 'has-error':  userEmailForm.email.$invalid && userEmailForm.email.$dirty && !loading.is(),\n" +
    "                    'has-success': userEmailForm.email.$valid && userEmailForm.email.$dirty && !loading.is()}\">\n" +
    "\n" +
    "    <div class=\"controls input-group col-sm-9\">\n" +
    "      <span class=\"input-group-addon\"><i class=\"icon-envelope-alt\"></i></span>\n" +
    "      <input ng-model=\"user.email\"\n" +
    "      name=\"email\"\n" +
    "      class=\"form-control\"\n" +
    "      required\n" +
    "      data-require-unique\n" +
    "      />\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"feedback col-sm-3\">\n" +
    "       <spinner msg=\"Checking\"></spinner>\n" +
    "\n" +
    "       <div class=\"help-block error\"\n" +
    "       ng-show=\"userEmailForm.email.$error.requireUnique\n" +
    "               && userEmailForm.email.$dirty\n" +
    "               && !loading.is()\">\n" +
    "       Address is already in use.\n" +
    "       </div>\n" +
    "       <div class=\"help-block success one-line\"\n" +
    "       ng-show=\"userEmailForm.email.$valid\n" +
    "               && userEmailForm.email.$dirty\n" +
    "               && !loading.is()\">\n" +
    "       Looks good!\n" +
    "       </div>\n" +
    "       <div class=\"help-block\"\n" +
    "       ng-show=\"userEmailForm.email.$pristine\n" +
    "               && !loading.is()\">\n" +
    "       This is your current email.\n" +
    "       </div>\n" +
    "    </div>\n" +
    "\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"form-group submit\">\n" +
    "  <div class=\" col-xs-10\">\n" +
    "    <save-buttons valid=\"userEmailForm.$valid\"></save-buttons>\n" +
    "  </div>\n" +
    "  </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/linked-accounts-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/linked-accounts-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Linked accounts</h1>\n" +
    "   <p>Pull in products and metrics from elsewhere</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate name=\"userProfileForm\"\n" +
    "      class=\"form-horizontal linked-accounts-settings\"\n" +
    "      ng-submit=\"onSave()\"\n" +
    "      ng-controller=\"linkedAccountsSettingsCtrl\">\n" +
    "\n" +
    "   <div class=\"form-group linked-account\">\n" +
    "      <label class=\"control-label col-sm-3 two-lines\">Wordpress.com API key</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <input ng-model=\"user.wordpress_api_key\" name=\"wordpress_api_key\" class=\"form-control\">\n" +
    "         <p>If you've already imported a <a href=\"http://wordpress.com\">Wordpress.com</a> blog, this key lets us display your readership counts.</p>\n" +
    "         <p>You can find your WordPress.com API key <a href='http://akismet.com/resend/' target='_blank'>here, via Akismet.</a></p>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <!--\n" +
    "   <div class=\"form-group linked-account\">\n" +
    "      <label class=\"control-label col-sm-3\">Twitter</label>\n" +
    "      <div class=\"is-linked col-sm-9\" ng-if=\"user.twitter_account_id\">\n" +
    "         <span class=\"account-id\">{{ user.twitter_account_id }}</span>\n" +
    "         <a class=\"remove-account\"><i class=\"icon-trash\">remove</i></a>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "   -->\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-offset-3 col-sm-7\">\n" +
    "         <save-buttons valid=\"userProfileForm.$valid\"></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/notifications-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/notifications-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Notifications</h1>\n" +
    "   <p>Change how often you get emails about new impacts</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"notifications-form-container\">\n" +
    "   <form novalidate name=\"userNotificationsForm\"\n" +
    "         class=\"form-horizontal custom-url\"\n" +
    "         ng-submit=\"onSave()\"\n" +
    "         ng-controller=\"NotificationsSettingsCtrl\">\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "         <div class=\"radio\">\n" +
    "           <label>\n" +
    "             <input type=\"radio\"\n" +
    "                    name=\"notifications-options\"\n" +
    "                    id=\"notifications-as-they-happen\"\n" +
    "                    ng-model=\"user.notification_email_frequency\"\n" +
    "                    value=\"as_they_happen\">\n" +
    "             <h3>As they happen</h3>\n" +
    "              <p>Whenever your research makes new impacts, we'll let you know right away.</p>\n" +
    "           </label>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"radio\">\n" +
    "           <label>\n" +
    "             <input type=\"radio\"\n" +
    "                    name=\"notifications-options\"\n" +
    "                    id=\"notifications-every-week-or-two\"\n" +
    "                    ng-model=\"user.notification_email_frequency\"\n" +
    "                    value=\"every_week_or_two\">\n" +
    "             <h3>Every week or two</h3>\n" +
    "              <p>Get a digest of all your latest impacts a few times each month.</p>\n" +
    "           </label>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"radio\">\n" +
    "           <label>\n" +
    "             <input type=\"radio\"\n" +
    "                    name=\"notifications-options\"\n" +
    "                    id=\"notifications-monthly\"\n" +
    "                    ng-model=\"user.notification_email_frequency\"\n" +
    "                    value=\"monthly\">\n" +
    "              <h3>Monthly</h3>\n" +
    "              <p>Get a report on your biggest research impacts that month.</p>\n" +
    "           </label>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"radio\">\n" +
    "           <label>\n" +
    "             <input type=\"radio\"\n" +
    "                    name=\"notifications-options\"\n" +
    "                    id=\"notifications-none\"\n" +
    "                    ng-model=\"user.notification_email_frequency\"\n" +
    "                    value=\"none\">\n" +
    "              <h3>None</h3>\n" +
    "              <p>Don't get any impact reports.</p>\n" +
    "           </label>\n" +
    "         </div>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "      <div class=\"form-group submit\">\n" +
    "         <div class=\" col-xs-10\">\n" +
    "            <save-buttons valid=\"userNotificationsForm.$valid\"></save-buttons>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "   </form>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("settings/password-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/password-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Password</h1>\n" +
    "   <p>Change your account password.</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate\n" +
    "      name=\"userPasswordForm\"\n" +
    "      class=\"change-password form-horizontal\"\n" +
    "      ng-submit=\"onSave()\"\n" +
    "      ng-controller=\"passwordSettingsCtrl\"\n" +
    "      >\n" +
    "\n" +
    "   <div class=\"form-group current-password\" ng-class=\"{'has-error': wrongPassword}\">\n" +
    "      <label class=\"control-label col-sm-4\">Current password</label>\n" +
    "      <div class=\"controls col-sm-6\">\n" +
    "         <input ng-model=\"user.currentPassword\" name=\"currentPassword\" type=\"password\" class=\"form-control\" required ng-show=\"!showPassword\">\n" +
    "         <input ng-model=\"user.currentPassword\" name=\"currentPassword\" type=\"text\" class=\"form-control\" required ng-show=\"showPassword\">\n" +
    "      </div>\n" +
    "      <div class=\"controls col-sm-2 show-password\">\n" +
    "         <pretty-checkbox value=\"showPassword\" text=\"Show\"></pretty-checkbox>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group new-password\">\n" +
    "      <label class=\"control-label col-sm-4\">New password</label>\n" +
    "      <div class=\"controls col-sm-6\">\n" +
    "         <input ng-model=\"user.newPassword\"\n" +
    "                name=\"newPassword\"\n" +
    "                type=\"password\"\n" +
    "                ng-show=\"!showPassword\"\n" +
    "                class=\"form-control\"\n" +
    "                required>\n" +
    "\n" +
    "         <input ng-model=\"user.newPassword\"\n" +
    "                name=\"newPassword\"\n" +
    "                type=\"text\"\n" +
    "                ng-show=\"showPassword\"\n" +
    "                class=\"form-control\"\n" +
    "                required>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-offset-4 col-sm-6\">\n" +
    "         <save-buttons></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/profile-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/profile-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Profile</h1>\n" +
    "   <p>Modify what's displayed in your profile.</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate name=\"userProfileForm\" class=\"form-horizontal\" ng-submit=\"onSave()\" ng-controller=\"profileSettingsCtrl\">\n" +
    "\n" +
    "   <div class=\"form-group photo\">\n" +
    "      <label class=\"control-label col-sm-3\">Photo</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <div class=\"my-picture\">\n" +
    "            <a href=\"http://www.gravatar.com\" >\n" +
    "               <img class=\"gravatar\" ng-src=\"//www.gravatar.com/avatar/{{ user.email_hash }}?s=110&d=mm\" data-toggle=\"tooltip\" class=\"gravatar\" rel=\"tooltip\" title=\"Modify your icon at Gravatar.com\" />\n" +
    "            </a>\n" +
    "            <p>You can change your profile image at <a href=\"http://www.gravatar.com\">Gravatar.com</a></p>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group\">\n" +
    "      <label class=\"control-label col-sm-3\">First name</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <input ng-model=\"user.given_name\" name=\"givenname\" class=\"form-control\">\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group\">\n" +
    "      <label class=\"control-label col-sm-3\">Surname</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <input ng-model=\"user.surname\" name=\"surname\" class=\"form-control\">\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-offset-3 col-sm-7\">\n" +
    "         <save-buttons valid=\"userProfileForm.$valid\"></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/settings.tpl.html",
    "<div class=\"wrapper settings\">\n" +
    "   <div class=\"settings-nav \">\n" +
    "      <ul nav-list nav>\n" +
    "         <li ng-repeat=\"pageDescr in pageDescriptions\">\n" +
    "            <a ng-class=\"{selected: isCurrentPath(pageDescr.urlPath)}\"\n" +
    "               href=\"{{ pageDescr.urlPath }}\">\n" +
    "               {{ pageDescr.displayName }}\n" +
    "               <i class=\"icon-chevron-right\"></i>\n" +
    "            </a>\n" +
    "         </li>\n" +
    "      </ul>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"settings-input\" ng-include='include'></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("settings/subscription-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/subscription-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Subscription</h1>\n" +
    "\n" +
    "   <p class=\"expl\">Update your payment information.</p>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"upgrade-form-container\"  ng-controller=\"subscriptionSettingsCtrl\">\n" +
    "\n" +
    "   <div class=\"cancelled\" ng-if=\"planStatus('cancelled')\">\n" +
    "      <h1>Your account is cancelled!</h1>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"current-plan-status paid\" ng-if=\"isSubscribed()\">\n" +
    "      <span class=\"setup\">\n" +
    "         Your Impactstory subscription has been active\n" +
    "         since {{ paidSince() }}.\n" +
    "      </span>\n" +
    "      <span class=\"thanks\">Thanks for helping to keep Impactstory nonprofit and open source!</span>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"current-plan-status trial\" ng-if=\"isTrialing()\">\n" +
    "      <span class=\"setup\" ng-if=\"daysLeftInTrial()>0\">Your Impactstory trial ends in {{ daysLeftInTrial() }} days</span>\n" +
    "      <span class=\"setup\" ng-if=\"daysLeftInTrial()==0\">Your Impactstory trial ends today!</span>\n" +
    "\n" +
    "      <div class=\"email-example\">\n" +
    "         <img src=\"/static/img/card-example.png\" alt=\"Impactstory notification email\"/>\n" +
    "      </div>\n" +
    "      <div class=\"pitch\">\n" +
    "         <p>Your research is making impacts all the time.\n" +
    "         And with Impactstory, you can see and share them all&mdash;\n" +
    "            everything from citations to downloads to tweets\n" +
    "         and more&mdash;on your profile and delivered straight to your inbox. </p>\n" +
    "         <p>By extending your free trial today, you'll keep benefiting from your impact profile and\n" +
    "            email notifications&mdash;and   you'll be helping to keep\n" +
    "         Impactstory a sustainable, open-source nonprofit. And all for less than than the\n" +
    "         cost of a coffee once a month.</p>\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   <form stripe-form=\"handleStripe\"\n" +
    "         name=\"upgradeForm\"\n" +
    "         novalidate\n" +
    "         ng-if=\"isTrialing()\"\n" +
    "         class=\"form-horizontal upgrade-form\">\n" +
    "\n" +
    "      <div class=\"form-title trial\">\n" +
    "         <h3>Continue your subscription</h3>\n" +
    "         <h4>If you ever decide you're not getting your money's worth, we'll refund it all. No questions asked. Simple as that.</h4>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "      <!-- plan -->\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"col-sm-3 control-label\" for=\"plan-options\">Billing period</label>\n" +
    "         <div class=\"col-sm-9\" id=\"plan-options\">\n" +
    "            <div class=\"radio\">\n" +
    "               <label>\n" +
    "                  <input type=\"radio\" name=\"plan\" value=\"base-monthly\" ng-model=\"subscribeForm.plan\">\n" +
    "                  $5 per month\n" +
    "               </label>\n" +
    "            </div>\n" +
    "            <div class=\"radio\">\n" +
    "               <label>\n" +
    "                  <input type=\"radio\" name=\"plan\" value=\"base-yearly\" ng-model=\"subscribeForm.plan\">\n" +
    "                  $45 per year <strong>(saves 25%)</strong>\n" +
    "               </label>\n" +
    "            </div>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <!-- name on card -->\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"col-sm-3 control-label\" for=\"card-holder-name\">Name</label>\n" +
    "         <div class=\"col-sm-9\">\n" +
    "            <input type=\"text\"\n" +
    "                   class=\"form-control\"\n" +
    "                   name=\"card-holder-name\"\n" +
    "                   id=\"card-holder-name\"\n" +
    "                   placeholder=\"Card Holder's Name\">\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <!-- card number -->\n" +
    "      <div class=\"form-group\">\n" +
    "        <label class=\"col-sm-3 control-label\" for=\"card-number\">Card Number</label>\n" +
    "        <div class=\"col-sm-9\">\n" +
    "          <input type=\"text\"\n" +
    "                 class=\"form-control\"\n" +
    "                 name=\"card-number\"\n" +
    "                 id=\"card-number\"\n" +
    "                 ng-model=\"number\"\n" +
    "                 payments-validate=\"card\"\n" +
    "                 payments-format=\"card\"\n" +
    "                 payments-type-model=\"type\"\n" +
    "                 ng-class=\"type\"\n" +
    "                 placeholder=\"Credit Card Number\">\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <!-- expiration date -->\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"col-sm-3 control-label\" for=\"card-expiry\">Expiration</label>\n" +
    "         <div class=\"col-sm-3\">\n" +
    "            <input type=\"text\"\n" +
    "                   class=\"form-control\"\n" +
    "                   name=\"card-expiry\"\n" +
    "                   id=\"card-expiry\"\n" +
    "                   ng-model=\"expiry\"\n" +
    "                   payments-validate=\"expiry\"\n" +
    "                   payments-format=\"expiry\"\n" +
    "                   placeholder=\"MM/YY\">\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <!-- CVV -->\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"col-sm-3 control-label\" for=\"cvv\">Security code</label>\n" +
    "        <div class=\"col-sm-3\">\n" +
    "          <input type=\"text\"\n" +
    "                 class=\"form-control\"\n" +
    "                 name=\"cvv\"\n" +
    "                 id=\"cvv\"\n" +
    "                 ng-model=\"cvc\"\n" +
    "                 payments-validate=\"cvc\"\n" +
    "                 payments-format=\"cvc\"\n" +
    "                 payments-type-model=\"type\"\n" +
    "                 placeholder=\"CVV\">\n" +
    "        </div>\n" +
    "        <div class=\"col-sm-2 cvv-graphic\">\n" +
    "           <img src=\"static/img/cvv-graphic.png\" alt=\"cvv graphic\"/>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <!-- CVV -->\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"col-sm-3 control-label\" for=\"cvv\">Coupon code</label>\n" +
    "        <div class=\"col-sm-9\">\n" +
    "          <input type=\"text\"\n" +
    "                 class=\"form-control\"\n" +
    "                 name=\"coupon-code\"\n" +
    "                 id=\"coupon-code\"\n" +
    "                 ng-model=\"subscribeForm.coupon\"\n" +
    "                 placeholder=\"If you have a coupon, it goes here\">\n" +
    "        </div>\n" +
    "        <div class=\"col-sm-2\">\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "         <div class=\"col-sm-offset-3 col-sm-9\">\n" +
    "               <button type=\"submit\"\n" +
    "                       ng-show=\"!loading.is('subscribe')\"\n" +
    "                       class=\"btn btn-success\">\n" +
    "                  Subscribe me!\n" +
    "               </button>\n" +
    "               <div class=\"working\" ng-show=\"loading.is('subscribe')\">\n" +
    "                  <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                  <span class=\"text\">Subscribing you to Impactstory&hellip;</span>\n" +
    "               </div>\n" +
    "         </div>\n" +
    "         <div class=\"col-sm-offset-3 col-sm-9 money-help\" ng-hide=\"loading.is('subscribe')\">\n" +
    "            Trouble affording $5/mo? No worries, we've been through some lean times\n" +
    "            ourselves. So we've got a <a ng-click=\"showFeeWaiverDetails=!showFeeWaiverDetails\">no-questions-asked fee waiver for you.</a>\n" +
    "\n" +
    "            <div class=\"fee-waiver-details\" ng-show=\"showFeeWaiverDetails\">\n" +
    "               <br>\n" +
    "               To get your waiver, just <a href=\"mailto:team@impactstory.org\">drop us a line</a> showing us how you’re linking to your Impactstory profile\n" +
    "               in your email signature and we’ll send you a coupon for a free account.\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </form>\n" +
    "\n" +
    "   <div class=\"subscriber-buttons\" ng-if=\"isSubscribed()\">\n" +
    "      <button ng-click=\"editCard()\" class=\"btn btn-primary edit-credit-card\">\n" +
    "         <i class=\"icon-credit-card left\"></i>\n" +
    "         Change my credit card info\n" +
    "      </button>\n" +
    "      <button ng-click=\"cancelSubscription()\" class=\"btn btn-danger\">\n" +
    "         <i class=\"icon-warning-sign left\"></i>\n" +
    "         Cancel subscription\n" +
    "      </button>\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("signup/signup.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup.tpl.html",
    "<div class=\"signup-page\">\n" +
    "   <div class=\"signup-main-page\">\n" +
    "      <div class=\"form-container\">\n" +
    "         <h1>Reveal your full scholarly impact.</h1>\n" +
    "         <h2>Try Impactstory <strong>free</strong> for 30 days:</h2>\n" +
    "         <form novalidate\n" +
    "               name=\"signupForm\"\n" +
    "               ng-controller=\"signupFormCtrl\"\n" +
    "               ng-submit=\"signup()\"\n" +
    "               id=\"main-signup-form\"\n" +
    "               class=\"form-horizontal signup-form\">\n" +
    "\n" +
    "            <div class=\"inputs\">\n" +
    "               <div class=\"form-group\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-given-name\">First name</label>\n" +
    "                  <input ng-model=\"newUser.givenName\"\n" +
    "                         placeholder=\"First name\"\n" +
    "                         type=\"text\"\n" +
    "                         id=\"signup-given-name\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         autofocus=\"autofocus\"\n" +
    "                         required />\n" +
    "               </div>\n" +
    "\n" +
    "               <div class=\"form-group\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-surname\">Last name</label>\n" +
    "                  <input ng-model=\"newUser.surname\"\n" +
    "                         placeholder=\"Last name\"\n" +
    "                         id=\"signup-surname\"\n" +
    "                         type=\"text\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         required />\n" +
    "               </div>\n" +
    "\n" +
    "\n" +
    "               <div class=\"form-group\" ng-class=\"{'has-error': emailTaken()}\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-email\">Email</label>\n" +
    "                  <input ng-model=\"newUser.email\"\n" +
    "                         placeholder=\"Email\"\n" +
    "                         id=\"signup-email\"\n" +
    "                         type=\"email\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         required />\n" +
    "                  <div class=\"help-block\" ng-show=\"emailTaken()\">Sorry, that email is taken.</div>\n" +
    "               </div>\n" +
    "\n" +
    "               <div class=\"form-group\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-password\">Password</label>\n" +
    "                  <input ng-model=\"newUser.password\"\n" +
    "                         placeholder=\"Password\"\n" +
    "                         id=\"signup-password\"\n" +
    "                         type=\"password\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         required />\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"submit-button\">\n" +
    "               <button ng-disabled=\"signupForm.$invalid\"\n" +
    "                       ng-hide=\"loading.is('signup')\"\n" +
    "                       class=\"btn btn-primary btn-xlarge\">\n" +
    "                  Uncover my impact<i class=\"icon-arrow-right\"></i>\n" +
    "               </button>\n" +
    "               <div class=\"working\" ng-show=\"loading.is('signup')\">\n" +
    "                  <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                  <span class=\"text\">Creating your profile...</span>\n" +
    "               </div>\n" +
    "\n" +
    "            </div>\n" +
    "         </form>\n" +
    "\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "   <div class=\"signup-sidebar\">\n" +
    "      <div class=\"testimonials-container\">\n" +
    "         <div class=\"testimonial\">\n" +
    "            <img src=\"/static/img/people/luo.png\"/>\n" +
    "            <q class=\"text\">I don't need my CV now, Impactstory tells my story!</q>\n" +
    "            <cite>\n" +
    "               <span class=\"name\">Ruibang Luo,</span>\n" +
    "               <span class=\"inst\">Hong Kong University</span>\n" +
    "            </cite>\n" +
    "         </div>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("update/update-progress.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("update/update-progress.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h3 id=\"finding-impact-data-header\">Finding impact data</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body update\">\n" +
    "   <div class=\"intro\" ng-if=\"status.getNumUpdating()\">\n" +
    "      <br>We're scouring the web to discover the impacts of all your research products...\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"intro dedup\" ng-if=\"!status.getNumUpdating()\"><br>\n" +
    "      <i class=\"icon-refresh icon-spin\"></i>\n" +
    "      Now removing duplicates...\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"update-progress animated fadeOutUp\" ng-if=\"status.getNumUpdating()\">\n" +
    "      <div class=\"products not-done\">\n" +
    "         <div class=\"content\">\n" +
    "            <span class=\"count still-working\">{{ status.getNumUpdating() }}</span>\n" +
    "            <span class=\"descr\">products updating</span>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <progressbar value=\"status.getPercentComplete()\" type=\"info\" class=\"progress-striped active\">\n" +
    "      </progressbar>\n" +
    "\n" +
    "      <div class=\"products done\">\n" +
    "         <div class=\"content\">\n" +
    "            <span class=\"count finished\">{{ status.getNumComplete()}}</span>\n" +
    "            <span class=\"descr\">products <br>done</span>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("user-message.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("user-message.tpl.html",
    "<div ng-class=\"['alert', 'alert-'+userMessage.get().type]\"\n" +
    "        class=\"animated fadeInDown fadeOutUp\"\n" +
    "        ng-if=\"userMessage.get().message && userMessage.showOnTop()\"\n" +
    "   <span class=\"wrapper\">\n" +
    "      <span class=\"text\" ng-bind-html=\"userMessage.get().message\"></span>\n" +
    "   </span>\n" +
    "   <button class=\"close\" ng-click=\"userMessage.remove()\">&times;</button>\n" +
    "</div>\n" +
    "");
}]);

angular.module('templates.common', ['forms/save-buttons.tpl.html']);

angular.module("forms/save-buttons.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("forms/save-buttons.tpl.html",
    "<div class=\"buttons-group save\">\n" +
    "   <div class=\"buttons\" ng-show=\"!loading.is('saveButton')\">\n" +
    "      <button\n" +
    "              class=\"btn btn-primary action\"\n" +
    "              ng-disabled=\"!isValid()\"\n" +
    "              type=\"submit\">\n" +
    "         {{ action }}\n" +
    "      </button>\n" +
    "      <a\n" +
    "              class=\"btn btn-default cancel\"\n" +
    "              ng-click=\"onCancel()\">\n" +
    "         Cancel\n" +
    "      </a>\n" +
    "   </div>\n" +
    "   <div class=\"working\" ng-show=\"loading.is('saveButton')\">\n" +
    "      <i class=\"icon-refresh icon-spin\"></i>\n" +
    "      <span class=\"text\">{{ actionGerund }}...</span>\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
}]);
