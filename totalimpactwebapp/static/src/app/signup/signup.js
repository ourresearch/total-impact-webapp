angular.module( 'signup', [
    'services.slug',
    'resources.users',
    'security.service',
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
              NewProfile.setId(resp.user.id)

              console.log("set NewProfile.getId(): ", NewProfile.getId())
          })
        }

        NewProfile.setEmail()
        NewProfile.setPassword()

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

  .factory("NewProfile", function(Slug, UsersAbout, UsersPassword, security){
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
      setEmail: function() {
        if (about.email) {
          UsersAbout.patch(
            {"id": id},
            {about: {email: about.email}},
            function(resp) {
              console.log("updated creds", resp)
            }
          )
        }
      },

      setPassword: function(){
        if (about.password && about) {
          UsersPassword.save(
            {"id": id},
            {newPassword: about.password},
            function(data){ // runs on successful password set.
              console.log("we set the password successfully. logging the user in")
              var user = security.requestCurrentUser()
              console.log("we found this user: ", user)
            }
          )
        }
      },
      setId: function(newId){id = newId},
      getId: function(){return id},
      getSlug: function(){return about.url_slug},
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
  })

  .controller( 'signupProductsCtrl', function ( $scope, Signup, AllTheImporters ) {
    $scope.importers = AllTheImporters.get()
    $scope.pristineOk =  true;

  })

  .controller( 'signupPasswordCtrl', function ( $scope, Signup ) {
  })

  .controller( 'signupCreatingCtrl', function ( $scope, $timeout, $location, NewProfile, UsersProducts ) {

    var numDone = function(products, completedStatus){
      console.log("numDone input: ", products)

      var productsDone =  _.filter(products, function(product){
        return !product.currently_updating
      })

      if (completedStatus) {
        return productsDone.length
      }
      else {
        return products.length - productsDone.length
      }
    };


    (function tick() {
      console.log("running tick!");
      console.log("Tick! NewProfile.getId(): ", NewProfile.getId());


      UsersProducts.query(
        {id: NewProfile.getId()},
//        {id:183},
        function(resp){
          console.log("i got some products!", resp);

          if (numDone(resp, false) == 0) {
            var profilePath = "/"+NewProfile.getSlug();
            console.log("redirecting to path", profilePath);
            $location.path(profilePath);
            $timeout.cancel(signupPoll);
          }

          $scope.numDone = numDone(resp, true)
          $scope.numNotDone = numDone(resp, false)

          var signupPoll = $timeout(tick, 500);

        }
      )
    })();


  })

;
