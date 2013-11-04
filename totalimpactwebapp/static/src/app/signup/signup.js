angular.module( 'signup', [
    'services.slug',
    'resources.users',
    'update.update',
    'security.service',
    'importers.allTheImporters',
    'importers.importer',
    'profile'
    ])
  .factory("Signup", function($rootScope, $location, Users, UserProfile, Update, $q){

    var signupSteps = [
      "name",
      "url",
      "products",
      "password"
    ]


    var getCurrentStep = function(capitalize){
      var ret = "name"
      _.each(signupSteps, function(stepName){

        if ($location.path().indexOf("/"+stepName) > 0){
          ret = stepName
        }
      })

      if (capitalize){
        ret = ret.charAt(0).toUpperCase() + ret.slice(1)
      }

      return ret

    }
    var getIndexOfCurrentStep = function(){
       return _.indexOf(signupSteps, getCurrentStep())
    }

//
//    var showUpdateModalThenRedirectWhenDone = function(){
//       Update.showUpdate(
//         NewProfile.getId(),
//         function(){
//           $location.path("/" + NewProfile.getSlug())
//           NewProfile.reset()
//         })
//     }


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

//      currentSignupStepPromise: function(){
//        var deferred = $q.defer()
//        if (getIndexOfCurrentStep() > 0 && !_.size(NewProfile.about)) {
//          deferred.reject("signupFlowOutOfOrder")
//        }
//        else {
//          deferred.resolve(getIndexOfCurrentStep())
//        }
//        return deferred.promise
//      },

//      goToNextSignupStep: function() {
//        if (NewProfile.readyToCreateOnServer()) {
//          Users.save(
//            {id: NewProfile.about.url_slug, idType: "url_slug"},
//            NewProfile.about,
//            function(resp, headers){
//              NewProfile.setId(resp.user.id)
//
//          })
//        }
//
//        NewProfile.setEmail()
//        NewProfile.setPassword()
//
//        var nextPage = signupSteps[getIndexOfCurrentStep() + 1]
//        if (typeof nextPage === "undefined") {
//          showUpdateModalThenRedirectWhenDone()
//        }
//        else {
//          $location.path("/signup/" + nextPage)
//        }
//      },

      isBeforeCurrentSignupStep: function(stepToCheck) {
        var indexOfStepToCheck = _.indexOf(signupSteps, stepToCheck)
        return getIndexOfCurrentStep() > -1 && indexOfStepToCheck < getIndexOfCurrentStep()
      },
      getTemplatePath: function(){
        return "signup/signup-" + getCurrentStep() + '.tpl.html';
      },
      getControllerName: function(){
        return "signup" + getCurrentStep(true) + "Ctrl";
      }
    }
  })

.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when("/signup/*rest", {
      templateUrl: 'signup/signup.tpl.html',
      controller: 'signupCtrl',
      resolve:{
        currentUser: function(security){
          return security.noUserLoggedIn()
        }
      }
    })
    .when('/signup', {redirectTo: '/signup/name'})


}])

  .controller('signupCtrl', function($scope, Signup){
                
    Signup.init()

    $scope.input = {}

    $scope.signupSteps = Signup.signupSteps();
    $scope.isStepCurrent = Signup.onSignupStep;
    $scope.isStepCompleted = Signup.isBeforeCurrentSignupStep;

    $scope.include =  Signup.getTemplatePath();
    $scope.signupFormCtrl =  Signup.getControllerName();
    $scope.nav = { // defined as an object so that controllers in child scopes can override...
      goToNextStep: function(){
        console.log("go to next step!")
      }
    }


  })

  .controller( 'signupNameCtrl', function ( $scope, Signup, $location ) {
    $scope.nav.goToNextStep = function(){
      $location.path("signup/" + $scope.input.givenName + "/" + $scope.input.surname + "/url")
    }

  })

  .controller( 'signupUrlCtrl', function ( $scope, Users, Slug, UserProfile, $location) {
    var nameRegex = /\/signup\/(.+?)\/(.+?)\/url/
    var res = nameRegex.exec($location.path())

    $scope.givenName = res[1]
    $scope.input.url_slug = Slug.make(res[1], res[2])

    $scope.nav.goToNextStep = function(){
      Users.save(
        {id: $scope.input.url_slug, idType: "url_slug"}, // url
        {
          givenName: res[1],
          surname: res[2],
          url_slug: $scope.input.url_slug
        },
        function(resp, headers){}
      )
      $location.path("signup/" + $scope.input.url_slug + "/products/add")
    }


  })

  .controller( 'signupProductsCtrl', function ( $scope, Signup, AllTheImporters ) {
    $scope.importers = AllTheImporters.get()
    $scope.pristineOk =  true;

  })

  .controller( 'signupPasswordCtrl', function ( $scope, Signup ) {
  })


;
