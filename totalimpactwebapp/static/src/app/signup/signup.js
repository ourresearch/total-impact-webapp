angular.module( 'signup', [
    'services.slug',
    'services.page',
    'resources.users',
    'update.update',
    'security.service',
    'tips',
    'importers.allTheImporters',
    'importers.importer'
    ])
  .factory("Signup", function($location){

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
      signupSteps: function(){
        return signupSteps;
      },
      onSignupStep: function(step){
        return step == getCurrentStep()
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

  .controller('signupCtrl', function($scope, Signup, Page, security){
    Page.setUservoiceTabLoc("bottom")
    Page.setTemplates("signup/signup-header", "")
//    security.logout()
    $scope.input = {}

    $scope.include =  Signup.getTemplatePath();
    $scope.nav = { // defined as an object so that controllers in child scopes can override...
      goToNextStep: function(){
        console.log("we should be overriding me.")
      }
    }


  })

  .controller( 'signupNameCtrl', function ( $scope, $location, Signup, Slug ) {
    analytics.track("Signup: name")
    $scope.nav.goToNextStep = function(){

      var slug = Slug.make($scope.input.givenName, $scope.input.surname)
      $scope.givenName = $scope.input.givenName
      $scope.surname = $scope.input.surname

      $location.path("signup/" + slug + "/url")
        .search("givenName", $scope.input.givenName)
        .search("surname", $scope.input.surname)
    }

  })

  .controller( 'signupUrlCtrl', function ( $scope, $http, Users, TipsService, Slug, $location, security) {
    var nameRegex = /\/signup\/(.+?)\/url/
    var slug = nameRegex.exec($location.path())[1]

    $scope.input.url_slug = slug
    analytics.track("Signup: url")


    $scope.nav.goToNextStep = function(){
      var logMsg = "saving user for the first time"
      var givenName = $location.search()["givenName"]
      var surname = $location.search()["surname"]

      Users.save(
        {id: $scope.input.url_slug, idType: "url_slug", log:logMsg},
        {
          givenName: givenName,
          surname: surname,
          url_slug: $scope.input.url_slug,
          tips: TipsService.keysStr()
        },
        function(resp, headers){
          console.log("got response back from save user", resp)
          security.clearCachedUser()
          $location.path("signup/" + $scope.input.url_slug + "/products/add")
          $location.search("")  // clear the names from the url

          // so mixpanel will start tracking this user via her userid from here
          // on out.
          analytics.alias(resp.user.id)
        }
      )
    }
  })

  .controller( 'signupProductsCtrl', function($location, $scope, Signup, AllTheImporters, security ) {
    var m = /\/signup\/([-\w\.]+)\//.exec($location.path())
    analytics.track("Signup: products")

    $scope.importers = AllTheImporters.get()
    $scope.nav.goToNextStep = function(){
      $location.path("signup/" + m[1] + "/password")
    }
  })

  .controller( 'signupPasswordCtrl', function ($scope, $location, security, UsersAbout, UsersPassword, Update) {
    var url_slug = /\/signup\/([-\w\.]+)\//.exec($location.path())[1]
    analytics.track("Signup: password")

    var redirectCb = function(){
      $location.path("/" + url_slug)
      analytics.track("First profile view")
    }

    $scope.nav.goToNextStep = function(){
      var emailLogMsg = "saving the email on signup"
      var pwLogMsg = "saving the password on signup"

      analytics.track("Completed signup")

      UsersAbout.patch(
        {"id": url_slug, idType:"url_slug", log: emailLogMsg},
        {about: {email: $scope.input.email}},
        function(resp) {
          console.log("we set the email", resp)
        }
      )

      UsersPassword.save(
        {"id": url_slug, idType:"url_slug"},
        {newPassword: $scope.input.password, log: pwLogMsg},
        function(data){
          console.log("we set the password; showing the 'updating' modal.")
          security.clearCachedUser()
          Update.showUpdate(url_slug, redirectCb)
        }
      )

    }
  })

.controller("signupHeaderCtrl", function($scope, Signup, Page) {

  Page.setTitle("signup")

  $scope.signupSteps = Signup.signupSteps();
  $scope.isStepCurrent = Signup.onSignupStep;
  $scope.isStepCompleted = Signup.isBeforeCurrentSignupStep;

})

;
