angular.module('services.userMessage', [])
  .factory('$rootScope', function ($interpolate, $rootScope) {

    var messageKey = null
    var persistAfterNextRouteChange = false
    var interpolateParams = {}

    var messages = {
      'login.error.invalidPassword':["Whoops! We recognize your email address but it looks like you've got the wrong password.", 'danger'],
      'login.error.invalidUser':["Sorry, we don't recognize that email address.", 'danger'],
      'login.error.serverError': ["Uh oh, looks like we've got a system error...feel free to let us know, and we'll fix it.", 'danger'],
      'logout.success': ["You've logged out.", 'info'],

      'settings.password.change.success': ["Password changed.", 'success'],
      'settings.password.change.error.unauthenticated': ["Sorry, looks like you typed your password wrong.", 'danger'],
      'settings.profile.change.success': ["Your profile's been updated.", 'success'],
      'settings.url.change.success': ["Your profile URL has been updated.", 'success'],
      'settings.email.change.success': ["Your email has been updated to {{email}}.", 'success'],
      'passwordReset.error.invalidToken': ["Looks like you've got an expired password reset token in the URL.", 'danger'],
      'passwordReset.ready': ["You're temporarily logged in. You should change your password now.", 'warning'],

      'browser.error.oldIE': ["Warning: you're browsing using an out-of-date version of Internet Explorer.  Many ImpactStory features won't work. <a href='http://windows.microsoft.com/en-us/internet-explorer/download-ie'>Update</a>", 'warning'],
      'dedup.success': ["We've successfully merged <span class='count'>{{ numDuplicates }}</span> duplicated products.", 'info']
    };


    $rootScope.$on('$routeChangeSuccess', function () {
      if (persistAfterNextRouteChange){
        persistAfterNextRouteChange = false
      }
      else {
        messageKey = null
        interpolateParams = {}
      }
    });



    return {
      setMessage: function(key, persist, params){
        messageKey = key
        persistAfterNextRouteChange = !!persist
        interpolateParams = params
      },

      getMessage: function(){
        if (!messageKey) {
          return null
        }
        var msg = messages["messageKey"]
        return {
          message: $interpolate(msg[0])(interpolateParams),
          type: msg[1]
        }
      }

    }


  })
