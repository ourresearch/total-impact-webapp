angular.module( 'infopages', [
    'security'
    ])

    .config(['$routeProvider', function($routeProvider, security) {
        $routeProvider

            .when('/', {
                      templateUrl: 'infopages/landing.tpl.html',
                      controller: 'landingPageCtrl',
                      resolve:{
                        allowed: function(security){
                          return security.testUserAuthenticationLevel("anon")
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

    .controller( 'landingPageCtrl', function landingPageCtrl ( $scope ) {
                     $scope.thisControllerBeRunning = true

                 })

    .controller( 'faqPageCtrl', function faqPageCtrl ( $scope ) {
                     $scope.thisControllerBeRunning = true

                 })

    .controller( 'aboutPageCtrl', function aboutPageCtrl ( $scope ) {
                     $scope.thisControllerBeRunning = true

                 })

;
