angular.module( 'signup', [
    'services.slug',
    'services.page',
    'services.tiMixpanel',
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
        },
        notOnMobile: function($q, $rootScope, $location){
          console.log("trying to resolve /signup")
          var deferred = $q.defer()
          if ($rootScope.isOnMobile()){
            alert("Sorry! Creating new profiles isn't yet supported on your mobile device.")
            $location.path("/")
            deferred.reject()
          }
          else {
            deferred.resolve()
          }
          return deferred.promise
        }
      }
    })
}])

  .controller('signupCtrl', function($scope, $location, $rootScope, Page){

  })

  .controller( 'signupFormCtrl', function ($scope,
                                           $location,
                                           security,
                                           Slug,
                                           Users,
                                           TiMixpanel,
                                           Loading) {
    var emailThatIsAlreadyTaken = "aaaaaaaaaaaa@foo.com"

    $scope.newUser = {}
    $scope.emailTaken = function(){
      return $scope.newUser.email === emailThatIsAlreadyTaken
    }

    $scope.signup = function(){
      var slug = Slug.make($scope.newUser.givenName, $scope.newUser.surname)
      Loading.start("signup")
      Users.save(
        {id: slug},
        {
          givenName: $scope.newUser.givenName,
          surname: $scope.newUser.surname,
          email: $scope.newUser.email,
          password: $scope.newUser.password
        },
        function(resp, headers){
          security.clearCachedUser()
          security.setUserJustSignedUp(true)
          $location.path(resp.user.url_slug + "/accounts")

          // so mixpanel will start tracking this user via her userid from here
          // on out.
          TiMixpanel.alias(resp.user.id)
          TiMixpanel.track("Signed up new user")
        },
        function(resp){
          if (resp.status === 409) {
            Loading.finish("signup")
            emailThatIsAlreadyTaken = angular.copy($scope.newUser.email)
            console.log("oops, email already taken...")
            console.log("resp", resp)
          }
        }
      )

    }
  })
