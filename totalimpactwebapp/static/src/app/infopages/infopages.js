angular.module( 'infopages', [
    'security',
    'services.page'
    ])

    .config(['$routeProvider', function($routeProvider, security) {
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
            .when('/faq', {
                      templateUrl: 'infopages/faq.tpl.html',
                      controller: 'faqPageCtrl'
                  })
            .when('/about', {
                      templateUrl: 'infopages/about.tpl.html',
                      controller: 'aboutPageCtrl'
                  })
  }])

    .controller( 'landingPageCtrl', function landingPageCtrl ( $scope, Page ) {
                  Page.setTitle("Share the full story of your research impact.")
                 })

    .controller( 'faqPageCtrl', function faqPageCtrl ( $scope, Page, $http ) {
                   Page.setTitle("FAQ")
                   $http.get("/providers").then(
                     function(resp){
                       $scope.providers = resp
                     },
                     function(resp){console.log("/providers failed.")}
                   )

                 })

    .controller( 'aboutPageCtrl', function aboutPageCtrl ( $scope, Page ) {
                   Page.setTitle("about")

                 })

;
