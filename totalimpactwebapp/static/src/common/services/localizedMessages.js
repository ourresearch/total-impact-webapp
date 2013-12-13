angular.module('services.localizedMessages', []).factory('localizedMessages', function ($interpolate) {


  var i18nmessages = {

    'login.error.invalidPassword':"Whoops! We recognize your email address but it looks like you've got the wrong password.",
    'login.error.invalidUser':"Sorry, we don't recognize that email address.",
    'login.error.serverError': "Uh oh, looks like we've got a system error...feel free to let us know, and we'll fix it.",
    'logout.success': "You've logged out.",

    'test.first': "This is a test of the notification system...",
    'settings.password.change.success': "Password changed.",
    'settings.password.change.error.unauthenticated': "Sorry, looks like you typed your password wrong.",
    'settings.profile.change.success': "Your profile's been updated.",
    'settings.url.change.success': "Your profile URL has been updated.",
    'settings.email.change.success': "Your email has been updated to {{email}}.",
    'settings.wordpress_api_key.add.success': "We're now using your API key to get more metrics on your wordpress.com blogs!",
    'passwordReset.error.invalidToken': "Looks like you've got an expired password reset token in the URL.",
    'passwordReset.ready': "You're temporarily logged in. You should change your password now.",

    'browser.error.oldIE': "Warning: you're browsing using an out-of-date version of Internet Explorer.  Many ImpactStory features won't work. <a href='http://windows.microsoft.com/en-us/internet-explorer/download-ie'>Update</a>"

  };

  var handleNotFound = function (msg, msgKey) {
    return msg || '?' + msgKey + '?';
  };

  return {
    get : function (msgKey, interpolateParams) {
      var msg =  i18nmessages[msgKey];
      if (msg) {
        return $interpolate(msg)(interpolateParams);
      } else {
        return handleNotFound(msg, msgKey);
      }
    }
  };
});