angular.module( 'signup', [
    'services.slug',
    'services.page',
    'resources.users',
    'update.update',
    'security.service'
    ])

.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when("/signup", {
      templateUrl: 'signup/signup.tpl.html',
      controller: 'signupCtrl',
      resolve:{
        userNotLoggedIn: function(security){
          return security.testUserAuthenticationLevel("loggedIn", false)
        }
      }
    })
}])

  .controller('signupCtrl', function($scope, Page, security){

    Page.setUservoiceTabLoc("bottom")
    Page.showHeader(false)
    Page.showFooter(false)

  })

  .controller( 'signupFormCtrl', function ( $scope, Slug, Users ) {
    $scope.newUser = {}
    $scope.signup = function(){
      console.log("sign me up!")
      var slug = Slug.make($scope.newUser.given_name, $scope.newUser.surname)
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
