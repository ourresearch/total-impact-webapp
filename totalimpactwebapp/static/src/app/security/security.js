// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security.service', [
    'services.userMessage',
    'services.tiMixpanel',
    'security.login',         // Contains the login form template and controller
    'ui.bootstrap'     // Used to display the login form as a modal dialog.
  ])

  .factory('security', function($http,
                                $q,
                                $location,
                                $modal,
                                TiMixpanel,
                                UserMessage) {
    var useCachedUser = true
    var currentUser = null
    setCurrentUser(globalCurrentUser)
    var userJustSignedUp

    console.log("logging in from object: ", currentUser)
    TiMixpanel.registerFromUserObject(currentUser)



    // Redirect to the given url (defaults to '/')
    function redirect(url) {
      url = url || '/';
      $location.path(url);
    }

    // Login form dialog stuff
    var loginDialog = null;
    function openLoginDialog(redirectTo) {
      console.log("openLoginDialog() fired.")
      var viewportWidth = $(window).width()

      if (viewportWidth <= responsiveDesignBreakpoints.tablet[1] ) {
        // looks like we are On Mobile here. too bad for you, user.
        alert("Sorry! We're working on it, but login isn't supported on this mobile device yet.")

      }
      else {
        loginDialog = $modal.open({
          templateUrl: "security/login/form.tpl.html",
          controller: "LoginFormController",
          windowClass: "creds"
        });
        loginDialog.result.then();
      }
    }

    function setCurrentUser(newCurrentUser){

      // when i log in, if i’m trialing, i see a modal
      // when i show up, if i’m logged in, and i’m trialing, i see a modal
      if (!currentUser && newCurrentUser && newCurrentUser.is_trialing){
//        showDaysLeftModal(newCurrentUser)
        showDaysLeftModal(newCurrentUser)
        console.log("this user is trialing. days left:", newCurrentUser.days_left_in_trial)
      }

      return currentUser = newCurrentUser

    }


    var currentUrlSlug = function(){
      var m = /^(\/signup)?\/([-\w\.]+)\//.exec($location.path())
      var current_slug = (m) ? m[2] : false;
      console.log("current slug is", current_slug)
      return current_slug
    }

    function showDaysLeftModal(currentUser){
      if ($location.path() == "/settings/subscription" || userJustSignedUp){
        return false
      }

      $modal.open({
        templateUrl: "security/days-left-modal.tpl.html",
        controller: "daysLeftModalCtrl",
        resolve: {
          user: function($q){
            return $q.when(currentUser)
          }
        }
      })
    }


    // The public API of the service
    var service = {

      currentUser: currentUser,  // helpful for setting $watch on

      showLogin: function() {
        openLoginDialog();
      },

      login: function(email, password) {
        return $http.post('/profile/current/login', {email: email, password: password})
          .success(function(data, status) {
            setCurrentUser(data.user)
            console.log("user just logged in: ", currentUser)
            TiMixpanel.identify(currentUser.id)
            TiMixpanel.registerFromUserObject(currentUser)
          })
      },

      currentUserOwnsProfile: function(profileSlug){
        var deferred = $q.defer()

        service.requestCurrentUser().then(
          function(user){
            if (user && user.url_slug && user.url_slug == profileSlug){
              deferred.resolve(true)
            }
            else {
              deferred.resolve(false)
            }
          }
        )

        return deferred.promise
      },

      testUserAuthenticationLevel: function(level, falseToNegate){

        var negateIfToldTo  = function(arg){
          return (falseToNegate === false) ? !arg : arg
        }

        var makeErrorMsg = function(msg){
          if (falseToNegate === false) { // it was supposed to NOT be this level, but it was.
            return msg
          }
          return "not" + _.capitalize(level) // it was supposed to be this level, but wasn't.
        }

        var levelRules = {
          anon: function(user){
            return !user
          },
          partlySignedUp: function(user){
            return (user && user.url_slug && !user.email)
          },
          loggedIn: function(user){
            return (user && user.url_slug && user.email)
          },
          ownsThisProfile: function(user){
//          return true

            return (user && user.url_slug && user.url_slug == currentUrlSlug())

          }
        }


        var deferred = $q.defer()
        service.requestCurrentUser().then(
          function(user){
            var shouldResolve = negateIfToldTo(levelRules[level](user))

            if (shouldResolve){
              deferred.resolve(level)
            }
            else {
              deferred.reject(makeErrorMsg(level))
            }

          }
        )
        return deferred.promise
      },

      // Ask the backend to see if a user is already authenticated - this may be from a previous session.
      requestCurrentUser: function() {
        if (useCachedUser) {
          return $q.when(currentUser);

        } else {
          return service.refreshCurrentUser()
        }
      },

      refreshCurrentUser: function(){
        console.log("logging in from cookie")
        return $http.get('/profile/current')
          .success(function(data, status, headers, config) {
            useCachedUser = true
            setCurrentUser(data.user)
            console.log("successfully logged in from cookie.")
            TiMixpanel.identify(currentUser.id)
            TiMixpanel.registerFromUserObject(currentUser)
          })
          .then(function(){return currentUser})
      },


      logout: function() {
        console.log("logging out user.", currentUser)
        service.clearCachedUser()
        $http.get('/profile/current/logout').success(function(data, status, headers, config) {
          UserMessage.set("logout.success")
          TiMixpanel.clearCookie()

        });
      },




      userIsLoggedIn: function(){
        var deferred = $q.defer();

        service.requestCurrentUser().then(
          function(user){
            if (!user){
              deferred.reject("userNotLoggedIn")
              deferred.reject("userNotLoggedIn")
            }
            else {
              deferred.resolve(user)
            }
          }
        )
        return deferred.promise
      },


      hasNewMetrics: function(){
        return currentUser && currentUser.has_diff
      },


      redirectToProfile: function(){
        service.requestCurrentUser().then(function(user){
          redirect("/" + user.url_slug)
        })
      },

      clearCachedUser: function(){
        setCurrentUser(null)
        userJustSignedUp = false
        useCachedUser = false
      },

      isLoggedIn: function(url_slug){
        return currentUser && currentUser.url_slug && currentUser.url_slug==url_slug
      },

      isLoggedInPromise: function(url_slug){
        var deferred = $q.defer();

        service.requestCurrentUser().then(
          function(userObj){
            if (!userObj){
              deferred.reject("user not logged in")
            }
            else if (userObj.url_slug == url_slug ) {
              deferred.resolve("user is logged in!")
            }
            else {
              deferred.reject("user not logged in")
            }
          }
        )
        return deferred.promise
      },

      getCurrentUser: function(attr){
        if (currentUser && attr) {
          return currentUser[attr]
        }
        else {
          return currentUser
        }

      },

      setUserJustSignedUp:function(trueOrFalse){
        userJustSignedUp = trueOrFalse
      },

      getCurrentUserSlug: function() {
        if (currentUser) {
          return currentUser.url_slug
        }
        else {
          return null
        }
      },

      setCurrentUser: function(user){
        setCurrentUser(user)
      },

      // Is the current user authenticated?
      isAuthenticated: function(){
        return !!currentUser;
      }

    };

    return service;
  })


.controller("daysLeftModalCtrl", function($scope, user){

    console.log("daysleftmodalctrl running",user)
    $scope.user = user
    $scope.days = listLiveDays()


    function listLiveDays(){
      var days = []
      _.each(_.range(30), function(dayNumber){
        if (dayNumber < user.days_left_in_trial) {
          days.push({
            stillLive: true
          })
        }
        else {
          days.push({
            stillLive: false
          })
        }
      })
      return days
    }


})


