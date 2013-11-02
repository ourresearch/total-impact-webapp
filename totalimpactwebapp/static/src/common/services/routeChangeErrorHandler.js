angular.module('services.routeChangeErrorHandler', [
  'signup', // for the NewProfile factory
  'security'
])
  .factory("RouteChangeErrorHandler", function(NewProfile, security, $location){


    var restrictPageFromLoggedInUsers = function(path, event){
      var restrictedPathRegexes = [
        /^\/signup\//,   // signup page. you're already signed up, dude.
        /^\/$/           // landing page.
      ]
    }

    var handle = function(event, current, previous, rejection){
      console.log("handlin' it:", event, current, previous, rejection)
    }

    return {
      'handle': handle
    }
  })
