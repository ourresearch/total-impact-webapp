angular.module('services.localizedMessages', []).factory('localizedMessages', function ($interpolate) {


  var i18nmessages = {
    'errors.route.changeError':'Route change error',
    'crud.user.save.success':"A user with id '{{id}}' was saved successfully.",
    'crud.user.remove.success':"A user with id '{{id}}' was removed successfully.",
    'crud.user.remove.error':"Something went wrong when removing user with id '{{id}}'.",
    'crud.user.save.error':"Something went wrong when saving a user...",
    'crud.project.save.success':"A project with id '{{id}}' was saved successfully.",
    'crud.project.remove.success':"A project with id '{{id}}' was removed successfully.",
    'crud.project.save.error':"Something went wrong when saving a project...",
    'login.reason.notAuthorized':"You do not have the necessary access permissions.  Do you want to login as someone else?",
    'login.reason.notAuthenticated':"You must be logged in to access this part of the application.",
    'login.error.invalidCredentials': "Login failed.  Please check your credentials and try again.",
    'login.error.serverError': "There was a problem with authenticating: {{exception}}.",
    'test.first': "This is a test of the notification system...",
    'settings.password.change.success': "Password changed.",
    'settings.password.change.error.unauthenticated': "Sorry, looks like you typed your password wrong.",
    'settings.profile.change.success': "Your profile's been updated.",
    'settings.url.change.success': "Your profile URL has been updated.",
    'settings.email.change.success': "Your email has been updated to {{email}}."

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