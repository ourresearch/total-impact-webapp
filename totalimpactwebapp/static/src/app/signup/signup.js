angular.module( 'signup', [
    ])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider

            .when('/name', {
                templateUrl: 'user-real-name.tpl.html',
                controller: 'nameCtrl'
            })
            .when('/import-products', {
                templateUrl: 'import-products.tpl.html',
                controller: 'importProductsCtrl'
            })
            .when('/register', {
                templateUrl: 'register.tpl.html',
                controller: 'registerCtrl'
            })

            .otherwise({redirectTo: '/name'});

    }])

    .controller( 'nameCtrl', function signupCtrl ( $scope ) {
        $scope.thisControllerBeRunning = true

     })

    .controller( 'importProductsCtrl', function importProductsCtrl ( $scope ) {
        $scope.thisControllerBeRunning = true

     })

    .controller( 'registerCtrl', function registerCtrl ( $scope ) {
        $scope.thisControllerBeRunning = true

     })

;
