angular.module('services.routeChangeErrorHandler', [
  'security'
])
  .factory("RouteChangeErrorHandler", function(security, $location){


    var restrictPageFromLoggedInUsers = function(path, event){
      var restrictedPathRegexes = [
        /^\/signup\//,   // signup page. you're already signed up, dude.
        /^\/$/           // landing page.
      ]
    }

    var handle = function(event, current, previous, rejection){
      var path = $location.path()
      if (path == "/" && rejection == "userLoggedIn"){
        $location.path("/"+security.currentUser.url_slug)
      }
      else if (path.indexOf("/signup"===0) && rejection == "userLoggedIn") {
        $location.path("/"+security.currentUser.url_slug)
      }
      else if (rejection == "signupFlowOutOfOrder") {
        $location.path("/signup/name")
      }

    }

    return {
      'handle': handle
    }
  })
