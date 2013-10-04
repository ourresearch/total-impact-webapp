angular.module( 'signup', [
    'services.slug',
    'resources.users',
    'importers.allTheImporters',
    'importers.importer'
    ])
  .factory("Signup", function($rootScope, $location, NewProfile, Users){

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
        console.log("next step!")

        var path = "/signup/" + signupSteps[getIndexOfCurrentStep() + 1]

        if (NewProfile.readyToCreateOnServer()) {
          Users.save(
            {id: NewProfile.about.url_slug, idType: "url_slug"},
            NewProfile.about,
            function(resp, headers){
              console.log("i'm saved!", resp, headers)
              NewProfile.setId(resp.user.id)

              console.log("set NewProfile.getId(): ", NewProfile.getId())
          })
        }

        NewProfile.setCreds()

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

  .factory("NewProfile", function(Slug, UsersAbout){
    var about = {}
    var products = []
    var id
    return {
      makeSlug: function(){
        about.url_slug = Slug.make(about.givenName, about.surname)
      },
      readyToCreateOnServer: function(){
        return about.url_slug && !id;
      },
      setCreds: function() {
        if (!about.password || !about.email) {
          return false
        }
        UsersAbout.patch(
          {"id": id},
          {about: {email: about.email}},
          function(resp) {
            console.log("updated creds", resp)
          }
        )

      },
      setId: function(newId){id = newId},
      getId: function(){return id},
      "about": about
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

  .controller('signupCtrl', function($scope, Signup, NewProfile){
    Signup.init()

    $scope.signupSteps = Signup.signupSteps();
    $scope.isStepCurrent = Signup.onSignupStep;
    $scope.isStepCompleted = Signup.isBeforeCurrentSignupStep;
    $scope.goToNextStep = Signup.goToNextSignupStep;

    $scope.profileAbout = NewProfile.about

    $scope.include =  Signup.getTemplatePath();
    $scope.inputCtrl =  Signup.getTemplatePath();
    $scope.pristineOk =  true;


  })

  .controller( 'signupNameCtrl', function ( $scope, Signup ) {
  })

  .controller( 'signupUrlCtrl', function ( $scope, Signup, NewProfile) {

    NewProfile.makeSlug()
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
