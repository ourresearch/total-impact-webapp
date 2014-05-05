angular.module( 'infopages', [
    'security',
    'services.page',
    'directives.fullscreen',
    'services.charge'
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
      .when('/collection/:cid', {
        templateUrl: 'infopages/collection.tpl.html',
        controller: 'collectionPageCtrl'
      })
      .when('/item/*', {
        templateUrl: 'infopages/collection.tpl.html',
        controller: 'collectionPageCtrl'
      })
  }])

  .controller( 'landingPageCtrl', function landingPageCtrl ( $scope, Page ) {
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

  .controller( 'faqPageCtrl', function faqPageCtrl ( $scope, Page, providersInfo, Charge) {
    Page.setTitle("FAQ")
    $scope.providers = providersInfo
    console.log("faq page controller running")
    $scope.openDonateModal = function(){

      Charge.open({
        name: 'Donate to Impactstory',
        description: '$10 per month',
        amount: 10
      });

    }
  })

  .controller( 'aboutPageCtrl', function aboutPageCtrl ( $scope, Page ) {
    Page.setTitle("about")

  })

  .controller('advisorsPageCtrl', function($scope, Page) {
    Page.setTitle("advisors")

  })

  .controller( 'collectionPageCtrl', function aboutPageCtrl ( $scope, Page ) {
    Page.setTitle("Collections are retired")

  });

