// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security.service', [
  'services.i18nNotifications',
  'security.retryQueue',    // Keeps track of failed requests that need to be retried once the user logs in
  'security.login',         // Contains the login form template and controller
  'ui.bootstrap'     // Used to display the login form as a modal dialog.
])

.factory('security', function($http, $q, $location, $modal, i18nNotifications) {
  var loadedUserFromServer = false

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
    var m = /^(\/signup)?\/(\w+)\//.exec($location.path())
    var current_slug = (m) ? m[2] : false;
    console.log("current slug is", current_slug)
    return current_slug
  }

  var getResetToken = function(){
    var re = /reset_token=(.+)/
    m = re.exec($location.path())
    return (m) ? m[1] : false
  }

  // The public API of the service
  var service = {

    // Show the modal login dialog
    showLogin: function() {
      openLoginDialog();
    },

    // Attempt to authenticate a user by the given email and password
    login: function(email, password) {
      var request = $http.post('/user/login', {email: email, password: password})
      request
        .success(function(data, status) {
            service.currentUser = data.user;
            service.redirectToProfile()
          })
        .error(function(data, status, headers, config){
          console.log("oh crap, an error: ", status);
        }
      );

      return request;

    },

    loginFromToken: function(token){
      return $http.post("/user/login/token", {token: m[1]}).then(
        function(resp){
          service.currentUser = resp.data.user
          i18nNotifications.pushForCurrentRoute('passwordReset.ready', 'success');

        },
        function(resp){
          i18nNotifications.pushForCurrentRoute('passwordReset.error.invalidToken', 'danger');
        }
      )
    },


    loginFromCookie: function(){
      return $http.get('/user/current').then(function(response) {
        loadedUserFromServer = true
        service.currentUser = response.data.user;
        return service.currentUser;
      });
    },


    // Logout the current user and redirect
    logout: function(redirectTo) {
      $http.post('/user/logout').then(function() {
        service.currentUser = null;
        redirect(redirectTo);
      });
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
          return (user && user.url_slug && user.url_slug == currentUrlSlug())

        }
      }

      var deferred = $q.defer()
      service.requestCurrentUser().then(
        function(user){
          console.log("in testUserAuthenticationLevel. Here's the user", user)
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
      console.log("requsting current user")

      if (loadedUserFromServer) {
        console.log("we've already checked with the server. returning what we got", service.currentUser)
        return $q.when(service.currentUser);

      } else {
        console.log("we're updating currentUser by checking on the server.")
        var resetToken = getResetToken()

        if (resetToken) {
          console.log("logging in user from token then loading: ", resetToken)
          return service.loginFromToken(resetToken)
        }
        else {
          console.log("loading user from cookie")
          return service.loginFromCookie()
        }



      }
    },

    userIsLoggedIn: function(){
      var deferred = $q.defer();

      service.requestCurrentUser().then(
        function(user){
          if (!user){
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

    // Information about the current user
    currentUser: null,

    // Is the current user authenticated?
    isAuthenticated: function(){
      return !!service.currentUser;
    },
    
    // Is the current user an adminstrator?
    isAdmin: function() {
      return !!(service.currentUser && service.currentUser.admin);
    }
  };

  return service;
});