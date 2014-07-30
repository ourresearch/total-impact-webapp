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
    var currentUser = globalCurrentUser || null
    console.log("logging in from object: ", currentUser)
    TiMixpanel.registerFromUserObject(currentUser)



    // Redirect to the given url (defaults to '/')
    function redirect(url) {
      url = url || '/';
      $location.path(url);
    }

    // Login form dialog stuff
    var loginDialog = null;
    function openLoginDialog() {
      console.log("openLoginDialog() fired.")
      loginDialog = $modal.open({
        templateUrl: "security/login/form.tpl.html",
        controller: "LoginFormController",
        windowClass: "creds"
      });
      loginDialog.result.then();
    }



    var currentUrlSlug = function(){
      var m = /^(\/signup)?\/([-\w\.]+)\//.exec($location.path())
      var current_slug = (m) ? m[2] : false;
      console.log("current slug is", current_slug)
      return current_slug
    }


    // The public API of the service
    var service = {

      showLogin: function() {
        openLoginDialog();
      },

      login: function(email, password) {
        return $http.post('/profile/current/login', {email: email, password: password})
          .success(function(data, status) {
            console.log("user just logged in: ", currentUser)
            currentUser = data.user;
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

      subscriptionStatus: function(statusToTest){
        var actualStatus
        if (!currentUser.subscription){
          // not actually sure what we're going to do with cancelled subscriptions.
          actualStatus = "cancelled"
        }
        else if (!currentUser.subscription.user_has_card) {
          // trial user with working premium plan
          actualStatus = "trial"
        }
        else {
          // paid user with working premium plan
          actualStatus = "paid"
        }
        return actualStatus == statusToTest
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
            currentUser = data.user;
            console.log("successfully logged in from cookie.")
            TiMixpanel.identify(currentUser.id)
            TiMixpanel.registerFromUserObject(currentUser)
          })
          .then(function(){return currentUser})
      },


      logout: function() {
        console.log("logging out user.", currentUser)
        currentUser = null;
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
        currentUser = null
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

      getCurrentUserSlug: function() {
        if (currentUser) {
          return currentUser.url_slug
        }
        else {
          return null
        }
      },

      setCurrentUser: function(user){
        currentUser = user
      },

      // Is the current user authenticated?
      isAuthenticated: function(){
        return !!currentUser;
      }

    };

    return service;
  });