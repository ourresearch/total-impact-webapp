angular.module('security.login.form', [
    'services.localizedMessages',
    'directives.forms',
    'services.page',
    'services.loading',
    'services.i18nNotifications',
    'security.login.resetPassword',
    'ui.bootstrap'
  ])

// The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
// This controller and its template (login/form.tpl.html) are used in a modal dialog box by the security service.
.controller('LoginFormController', function($scope, security, localizedMessages, $modalInstance, $modal, i18nNotifications, Page, Loading) {
  var reportError = function(status){
    var key
    if (status == 401) {
      key = "login.error.invalidPassword"
    }
    else if (status == 404) {
      key = "login.error.invalidUser"
    }
    else {
      key = "login.error.serverError"
    }
    i18nNotifications.pushForCurrentRoute(key, "danger")

  }
  var dismissModal = function(){
    i18nNotifications.removeAll()
    Page.setNotificationsLoc("header")
    $modalInstance.dismiss('cancel');
    Loading.finish('login')
  }

  console.log("setting notifications to modal")
  Page.setNotificationsLoc("modal")
  $scope.user = {};
  $scope.notifications = i18nNotifications
  $scope.loading = Loading



  $scope.login = function () {
    // Clear any previous security errors
    i18nNotifications.removeAll()
    Loading.start('login')

    // Try to login
    security.login($scope.user.email, $scope.user.password)
      .success(function(data, status){
        dismissModal()
        security.redirectToProfile()
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