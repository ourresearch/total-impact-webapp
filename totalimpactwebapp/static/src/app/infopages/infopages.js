angular.module( 'infopages', [
    ])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider

            .when('/', {
                      templateUrl: 'infopages/landing.tpl.html',
                      controller: 'landingPageCtrl'
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
