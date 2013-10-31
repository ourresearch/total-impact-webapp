angular.module('security.login.form', ['services.localizedMessages', 'ui.bootstrap'])

// The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
// This controller and its template (login/form.tpl.html) are used in a modal dialog box by the security service.
.controller('LoginFormController', function($scope, security, localizedMessages, $modalInstance) {
  // The model for this form 
  $scope.user = {};

  // Any error message from failing to login
  $scope.authError = null;

  $scope.login = function () {
    // Clear any previous security errors
    $scope.authError = null;

    // Try to login
    security.login($scope.user.email, $scope.user.password).then(function(loggedIn) {

      console.log("this is what we got from the security.login promise: ", loggedIn)

      if (loggedIn) {
        $modalInstance.close($scope.user);
      }
      else {
        // If we get here then the login failed due to bad credentials
        console.log("we fired an authError")
        $scope.authError = localizedMessages.get('login.error.invalidCredentials');
      }
    },
    function(x) {
      // If we get here then there was a problem with the login request to the server
        console.log("server error")
      $scope.authError = localizedMessages.get('login.error.serverError', { exception: x });
    });


  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };


});