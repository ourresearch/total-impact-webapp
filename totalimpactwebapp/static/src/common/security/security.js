// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security.service', [
  'services.i18nNotifications',
  'security.login',         // Contains the login form template and controller
  'ui.bootstrap'     // Used to display the login form as a modal dialog.
])

.factory('security', function($http, $q, $location, $modal, i18nNotifications) {
  var useCachedUser = false
  var currentUser

  // Redirect to the given url (defaults to '/')
  function redirect(url) {
    url = url || '/';
    console.log("in security, redirectin' to " + url)
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
      return $http.post('/user/login', {email: email, password: password})
        .success(function(data, status) {
            console.log("success in security.login()")
            currentUser = data.user;
        })
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
        return service.loginFromCookie()
      }
    },

    loginFromCookie: function(){
      return $http.get('/user/current')
        .success(function(data, status, headers, config) {
          useCachedUser = true
          currentUser = data.user;

        })
        .then(function(){return currentUser})
    },


    logout: function(redirectTo) {
      currentUser = null;
      $http.get('/user/logout').success(function(data, status, headers, config) {
        console.log("logout message: ", data)
        i18nNotifications.pushForCurrentRoute("logout.success", "success")
//        redirect(redirectTo);
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




    redirectToProfile: function(){
      service.requestCurrentUser().then(function(user){
        console.log("redirect to profile.")
        redirect("/" + user.url_slug)
      })
    },

    clearCachedUser: function(){
      currentUser = null
      useCachedUser = false
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
    },
    
    // Is the current user an adminstrator?
    isAdmin: function() {
      return !!(currentUser && currentUser.admin);
    }
  };

  return service;
});