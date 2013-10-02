angular.module( 'signup', [
    'services.slug',
    'resources.users',
    'importers.allTheImporters',
    'importers.importer'
    ])
  .factory("Signup", function($rootScope, $location, NewProfile, UsersAbout, UsersProducts){

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
        if (NewProfile.url_slug) {
          console.log("now is the part where we make that user.")
          Users.save(
            {id: NewProfile.url_slug, idType: "url_slug"},
            function(value, headers){
              console.log("i'm saved!", value, headers)
            }
          )
        }

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

  .factory("NewProfile", function(){
    var newProfile = {}
    return {}


  })

.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when("/signup/:step", {
      templateUrl: 'signup/signup.tpl.html',
      controller: 'signupCtrl'
    })
    .when('/signup', {redirectTo: '/signup/name'});

}])

  .controller('signupCtrl', function($scope, Signup, NewProfile){
    Signup.init()

    $scope.signupSteps = Signup.signupSteps();
    $scope.isStepCurrent = Signup.onSignupStep;
    $scope.isStepCompleted = Signup.isBeforeCurrentSignupStep;
    $scope.goToNextStep = Signup.goToNextSignupStep;

    $scope.user = NewProfile

    $scope.include =  Signup.getTemplatePath();
    $scope.inputCtrl =  Signup.getTemplatePath();
    $scope.pristineOk =  true;


  })

  .controller( 'signupNameCtrl', function ( $scope, Signup ) {
  })

  .controller( 'signupUrlCtrl', function ( $scope, Signup, NewProfile, Slug) {

    NewProfile.url_slug = Slug.make(NewProfile.firstName, NewProfile.surname)
    console.log($scope.signupForm)


  })

  .controller( 'signupProductsCtrl', function ( $scope, Signup, AllTheImporters ) {
    $scope.importers = AllTheImporters.get()
  $scope.pristineOk =  true;

  })

  .controller( 'signupPasswordCtrl', function ( $scope, Signup ) {
  })

  .controller( 'signupCreatingCtrl', function ( $scope, Signup ) {
  })

;
