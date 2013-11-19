angular.module('security.login.form', [
    'services.localizedMessages',
    'services.i18nNotifications',
    'security.login.resetPassword',
    'ui.bootstrap'
  ])

// The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
// This controller and its template (login/form.tpl.html) are used in a modal dialog box by the security service.
.controller('LoginFormController', function($scope, security, localizedMessages, $modalInstance, $modal, i18nNotifications) {
  // The model for this form 
  $scope.user = {};
  $scope.notifications = i18nNotifications


  console.log("notifications!", $scope.notifications)

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
  $scope.showForgotPasswordModal = function(){
    console.log("launching the forgot password modal.")
    $modalInstance.dismiss('cancel');

    var forgotPasswordModal = $modal.open({
      templateUrl: "security/login/reset-password-modal.tpl.html",
      controller: "ResetPasswordModalCtrl",
      windowClass: "creds forgot-password"
    })
  }

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };


});