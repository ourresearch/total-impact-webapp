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
      if (rejection == "notAnon"){
        security.redirectToProfile()
      }
      else if (rejection == "signupFlowOutOfOrder") {
        $location.path("/signup/name")
      }
      else if (rejection == "userNotLoggedIn"){
        // do something more useful later
        $location.path("/")
      }
      else if (rejection == "userHasAnEmail"){
        // if you've got an email, you're done signing up and have a profile. go there.
        $location.path("/"+security.currentUser.url_slug)
      }
      else if (rejection == "userDoesNotOwnThisProfile"){
        $location.path("/") // do something more useful later
      }

    }

    return {
      'handle': handle
    }
  })
