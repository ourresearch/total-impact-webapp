angular.module( 'signup', [
    ])
  .factory("Signup", function($rootScope, $location){

    var signupSteps = [
      "name",
      "url",
      "products",
      "password",
      "creating"
    ]
    var currentSignupStepRegex = /^\/signup\/(\w+)$/;
    var getIndexOfCurrentStep = function(){
       var res = currentSignupStepRegex.exec($location.path())
       if (res && res[1]) {
         return _.indexOf(signupSteps, res[1])
       }
       else {
         return -1;
       }
     }

    return {
      init: function(){
        $rootScope.showHeaderAndFooter = false;
      },
      signupSteps: function(){
        return signupSteps;
      },
      onSignupStep: function(step){
        return $location.path().indexOf("/signup/"+step.toLowerCase()) === 0;
      },
      goToNextSignupStep: function() {
        var path = "/signup/" + signupSteps[getIndexOfCurrentStep() + 1]
        console.log("redirecting to this path: ", path)
        return $location.path(path)
      },
      isBeforeCurrentSignupStep: function(stepToCheck) {
        var indexOfStepToCheck = _.indexOf(signupSteps, stepToCheck)
        return getIndexOfCurrentStep() > -1 && indexOfStepToCheck < getIndexOfCurrentStep()

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
      templateUrl: 'signup/signup-url.tpl.html',
      controller: 'signupUrlCtrl'
    })
    .when('/signup/products', {
        templateUrl: 'signup/signup-products.tpl.html',
        controller: 'signupProductsCtrl'
    })
    .when('/signup/password', {
        templateUrl: 'signup/signup-password.tpl.html',
        controller: 'signupPasswordCtrl'
    })
    .when('/signup/creating', {
        templateUrl: 'signup/signup-creating.tpl.html',
        controller: 'signupCreatingCtrl'
    })
    .when('/signup', {redirectTo: '/signup/name'});

}])

  .controller('signupHeaderCtrl', function($scope, Signup){
      $scope.signupSteps = Signup.signupSteps();
      $scope.isStepCurrent = Signup.onSignupStep;
      $scope.isStepCompleted = Signup.isBeforeCurrentSignupStep;
  })

  .controller( 'signupNameCtrl', function ( $scope, Signup ) {
    Signup.init()
    $scope.goToNextStep = Signup.goToNextSignupStep
  })

  .controller( 'signupUrlCtrl', function ( $scope, Signup ) {
    Signup.init()
    $scope.goToNextStep = Signup.goToNextSignupStep
  })

  .controller( 'signupProductsCtrl', function ( $scope, Signup ) {
    Signup.init()
    $scope.goToNextStep = Signup.goToNextSignupStep

   })

  .controller( 'signupPasswordCtrl', function ( $scope, Signup ) {
    Signup.init()
    $scope.goToNextStep = Signup.goToNextSignupStep
   })

  .controller( 'signupCreatingCtrl', function ( $scope, Signup ) {
    Signup.init()
   })

;
