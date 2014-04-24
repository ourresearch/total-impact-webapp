angular.module('services.userMessage', [])
  .factory('UserMessage', function ($interpolate, $rootScope) {


    var currentMessageObject
    var persistAfterNextRouteChange
    var showOnTop = true

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
      'settings.subscription.delete.success': ["We've cancelled your subscription to Premium.", 'success'],


      'passwordReset.error.invalidToken': ["Looks like you've got an expired password reset token in the URL.", 'danger'],
      'passwordReset.success': ["Your password was reset.", 'success'],


      'profile.removeProduct.success': ["'<em>{{title}}</em>' has been deleted from your profile.", 'info'],

      'browser.error.oldIE': ["Warning: you're browsing using an out-of-date version of Internet Explorer.  Many ImpactStory features won't work. <a href='http://windows.microsoft.com/en-us/internet-explorer/download-ie'>Update</a>", 'warning'],
      'dedup.success': ["We've successfully merged <span class='count'>{{ numDuplicates }}</span> duplicated products.", 'info']
    };

    var clear = function(){
      currentMessageObject = null
    }

    $rootScope.$on('$routeChangeSuccess', function () {
      if (persistAfterNextRouteChange){
        persistAfterNextRouteChange = false
      }
      else {
        clear()
      }
    });




    return {
      set: function(key, persist, interpolateParams){
        persistAfterNextRouteChange = persist

        var msg = messages[key]
        currentMessageObject = {
          message: $interpolate(msg[0])(interpolateParams),
          type: msg[1]
        }
      },

      showOnTop: function(yesOrNo){
        if (typeof yesOrNo !== "undefined") {
          console.log("setting showontop to ", yesOrNo)
          clear()
          showOnTop = !!yesOrNo
        }
        else {
          return showOnTop
        }
      },

      get: function(){
        return currentMessageObject
      },

      remove: function(){
        clear()
      }

    }


  })
