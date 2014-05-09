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
      'settings.premium.delete.success': ["We've cancelled your subscription to Premium.", 'success'],
      'settings.premium.subscribe.success': ["Congratulations: you're now subscribed to Impact Premium!", 'success'],
      'settings.premium.subscribe.error': ["Sorry, looks like there was an error! Please check your credit card info.", 'danger'],
      'settings.notifications.as_they_happen.success': ["As-they-happen notifications are coming soon! We've changed your settings so that you'll get them as soon as we launch. In the meantime, we'll still send you emails every week or two. Can't wait? Got ideas? Drop us a line at <a href='http://twitter.com/impactstory'>@impactstory<a/> or <a href='mailto:team@impactstory.org'>team@impactstory.org</a>!", 'warning'],
      'settings.notifications.every_week_or_two.success':["Notification settings updated! You'll be getting emails every week or two with your latest impacts.", "success"],
      'settings.notifications.monthly.success':["Monthly notifications are coming soon! But we've changed your settings so you'll get monthly emails as soon as they're available. <br> Can't wait? Got ideas? Drop us a line at <a href='http://twitter.com/impactstory'>@impactstory<a/> or <a href='mailto:team@impactstory.org'>team@impactstory.org</a>!", "warning"],
      'settings.notifications.none.success':["We've unsubscribed you from notification emails. If you've got any suggestions for how these emails could be more useful for you, we'd love to hear them! <br> Drop us a line at <a href='http://twitter.com/impactstory'>@impactstory<a/> or <a href='mailto:team@impactstory.org'>team@impactstory.org</a>", "success"],

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
