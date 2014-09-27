angular.module('security.login.form', [
    'directives.forms',
    'services.page',
    'services.loading',
    'services.userMessage',
    'security.login.resetPassword',
    'ui.bootstrap'
  ])

// The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
// This controller and its template (login/form.tpl.html) are used in a modal dialog box by the security service.
.controller('LoginFormController', function($scope,
                                            security,
                                            $modalInstance,
                                            $modal,
                                            UserMessage,
                                            Page,
                                            Loading) {
  var reportError = function(status){
    var key
    if (status == 401) {
      UserMessage.set("login.error.invalidPassword", true)
    }
    else if (status == 404) {
      UserMessage.set("login.error.invalidUser", true)
    }
    else {
      UserMessage.set("login.error.serverError", true)
    }

  }
  var dismissModal = function(){
    UserMessage.remove()
    UserMessage.showOnTop(true)
    $modalInstance.dismiss('cancel');
    Loading.finish('login')
  }

  UserMessage.showOnTop(false)
  $scope.user = {};
  $scope.loading = Loading
  $scope.userMessage = UserMessage



  $scope.login = function () {
    // Clear any previous security errors
    Loading.start('login')

    // Try to login
    security.login($scope.user.email, $scope.user.password)
      .success(function(data, status){
        dismissModal()
      })
      .error(function(data, status){
        console.log("login error!", status)
        Loading.finish('login')
        reportError(status)
      })
  };
  $scope.showForgotPasswordModal = function(){
    console.log("launching the forgot password modal.")
    dismissModal()

    var forgotPasswordModal = $modal.open({
      templateUrl: "security/login/reset-password-modal.tpl.html",
      controller: "ResetPasswordModalCtrl",
      windowClass: "creds forgot-password"
    })
  }

  $scope.cancel = function () {
    dismissModal()
  };


});