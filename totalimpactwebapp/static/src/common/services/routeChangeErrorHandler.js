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
      console.log("handling route change error.", event, current, previous, rejection)
      var path = $location.path()
      if (rejection == "signupFlowOutOfOrder") {
        $location.path("/signup/name")
      }
      else if (rejection == "notLoggedIn"){
        // do something more useful later...popup login dialog, maybe.
        $location.path("/")
      }
      else if (rejection == "loggedIn"){
        // you've got a profile, homey. go there.
        security.redirectToProfile()
      }
      else if (rejection == "notOwnsThisProfile"){
        $location.path("/") // do something more useful later
      }

    }

    return {
      'handle': handle
    }
  })
