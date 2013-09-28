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
    var getCurrentStep = function(){
      var res = currentSignupStepRegex.exec($location.path())
      if (res && res[1]) {
        return res[1];
      }
      else {
        return undefined;
      }

    }
    var getIndexOfCurrentStep = function(){
       return _.indexOf(signupSteps, getCurrentStep())
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
      },
      getTemplatePath: function(){
        return "signup/signup-" + getCurrentStep() + '.tpl.html';
      }
    }
  })

.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when("/signup/:step", {
      templateUrl: 'signup/signup.tpl.html',
      controller: 'signupCtrl'
    })
    .when('/signup', {redirectTo: '/signup/name'});

}])

  .controller('signupCtrl', function($scope, Signup){
    Signup.init()

    $scope.signupSteps = Signup.signupSteps();
    $scope.isStepCurrent = Signup.onSignupStep;
    $scope.isStepCompleted = Signup.isBeforeCurrentSignupStep;
    $scope.goToNextStep = Signup.goToNextSignupStep;

    $scope.include =  Signup.getTemplatePath();
    $scope.inputCtrl =  Signup.getTemplatePath();


  })

  .controller( 'signupNameCtrl', function ( $scope, Signup ) {
  })

  .controller( 'signupUrlCtrl', function ( $scope, Signup ) {
  })

  .controller( 'signupProductsCtrl', function ( $scope, Signup ) {

  })

  .controller( 'signupPasswordCtrl', function ( $scope, Signup ) {
  })

  .controller( 'signupCreatingCtrl', function ( $scope, Signup ) {
  })

;
