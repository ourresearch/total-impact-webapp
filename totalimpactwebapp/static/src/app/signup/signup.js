angular.module( 'signup', [
    ])
  .factory("Signup", function($rootScope){
    return {
      init: function(){
        $rootScope.showHeaderAndFooter = false;
      },
      signupSteps: function(){
        return [
          "Name",
          "Url",
          "products",
          "register",
          "create"
        ]
      }
    }
  })

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/signup/name', {
        templateUrl: 'signup/signup-name.tpl.html',
        controller: 'signupNameCtrl'
    })
    .when('/signup/url', {
        templateUrl: 'signup-url.tpl.html',
        controller: 'signupUrlCtrl'
    })
    .when('/signup/products', {
        templateUrl: 'signup-products.tpl.html',
        controller: 'signupProductsCtrl'
    })
    .when('/signup/register', {
        templateUrl: 'register.tpl.html',
        controller: 'signupRegisterCtrl'
    })
    .when('/signup', {redirectTo: '/signup/name'});

}])

  .controller('signupHeaderCtrl', function($scope, Signup){
      $scope.signupSteps = Signup.signupSteps();
  })

  .controller( 'signupNameCtrl', function ( $scope, Signup ) {
     Signup.init();
   })

  .controller( 'signupUrlCtrl', function ( $scope ) {
      $scope.thisControllerBeRunning = true

   })

  .controller( 'signupProductsCtrl', function ( $scope ) {
      $scope.thisControllerBeRunning = true

   })

  .controller( 'signupRegisterCtrl', function ( $scope ) {
      $scope.thisControllerBeRunning = true

   })

;
