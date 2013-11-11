angular.module( 'signup', [
    'services.slug',
    'resources.users',
    'update.update',
    'security.service',
    'importers.allTheImporters',
    'importers.importer'
    ])
  .factory("Signup", function($rootScope, $location){

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

    return {
      init: function(){
        $rootScope.showHeader = false;
        $rootScope.showFooter = false;
      },
      signupSteps: function(){
        return signupSteps;
      },
      onSignupStep: function(step){
        return $location.path().indexOf("/signup/"+step.toLowerCase()) === 0;
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
    .when('/signup/:url_slug/products/add', {
              templateUrl: 'signup/signup.tpl.html',
              controller: 'signupCtrl',
              resolve:{
              userOwnsThisProfile: function(security){
                return security.testUserAuthenticationLevel("ownsThisProfile")
              }
            }
          })
    .when('/signup/:url_slug/password', {
            templateUrl: 'signup/signup.tpl.html',
            controller: 'signupCtrl',
            resolve:{
              userOwnsThisProfile: function(security){
                return security.testUserAuthenticationLevel("ownsThisProfile")
              }
            }
          })
    .when("/signup/*rest", {
      templateUrl: 'signup/signup.tpl.html',
      controller: 'signupCtrl',
      resolve:{
        userNotLoggedIn: function(security){
          return security.testUserAuthenticationLevel("loggedIn", false)
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
    $scope.nav = { // defined as an object so that controllers in child scopes can override...
      goToNextStep: function(){
        console.log("we should be overriding me.")
      }
    }


  })

  .controller( 'signupNameCtrl', function ( $scope, Signup, $location ) {
    $scope.nav.goToNextStep = function(){
      $location.path("signup/" + $scope.input.givenName + "/" + $scope.input.surname + "/url")
    }

  })

  .controller( 'signupUrlCtrl', function ( $scope, $http, Users, Slug, $location) {
    var  nameRegex = /\/(\w+)\/(\w+)\/url/
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
        function(resp, headers){
          console.log("got response back from save user", resp)
          $location.path("signup/" + $scope.input.url_slug + "/products/add")

        }
      )
    }
  })

  .controller( 'signupProductsCtrl', function($location, $scope, Signup, AllTheImporters, security ) {
    var m = /\/signup\/(\w+)\//.exec($location.path())

    $scope.importers = AllTheImporters.get()
    $scope.nav.goToNextStep = function(){
      $location.path("signup/" + m[1] + "/password")
    }
  })

  .controller( 'signupPasswordCtrl', function ($scope, $location, security, UsersAbout, UsersPassword, Update) {
    var url_slug = /\/signup\/(\w+)\//.exec($location.path())[1]
    var redirectCb = function(){
      $location.path("/" + url_slug)
      security.requestCurrentUser()
    }

    $scope.nav.goToNextStep = function(){
      UsersAbout.patch(
        {"id": url_slug, idType:"url_slug"},
        {about: {email: $scope.input.email}},
        function(resp) {
          console.log("we set the email", resp)
        }
      )
      UsersPassword.save(
        {"id": url_slug, idType:"url_slug"},
        {newPassword: $scope.input.password},
        function(data){
          console.log("we set the password; showing the 'updating' modal.")
          Update.showUpdate(url_slug, redirectCb)
        }
      )
    }
  })


;
