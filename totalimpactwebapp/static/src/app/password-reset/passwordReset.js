angular.module('passwordReset', [
    'resources.users',
    'services.loading',
    'services.page',
    'directives.spinner',
    'services.i18nNotifications',
    'security',
    'directives.forms'])

  .config(function ($routeProvider) {

  $routeProvider.when('/reset-password/:resetToken',
  {
    templateUrl:'password-reset/password-reset.tpl.html'
  }
  )
})

.controller("passwordResetFormCtrl", function($scope, $location, $routeParams, Loading, Page, UsersPassword, i18nNotifications, security){
  Page.setTemplates('password-reset/password-reset-header', false)
  console.log("reset token", $routeParams.resetToken)

  $scope.password = ""
  $scope.onSave = function(){
    console.log("submitting password to change", $scope.password)
    Loading.start("saveButton")
    UsersPassword.save(
      {id: $routeParams.resetToken, idType:"reset_token"},
      {newPassword: $scope.password},
      function(resp) {
        i18nNotifications.pushForNextRoute('settings.password.change.success', 'success');
        $location.path("/")
        security.showLogin()
      },
      function(resp) {
        i18nNotifications.pushForCurrentRoute('settings.password.change.error.unauthenticated', 'danger');
        Loading.finish('saveButton')
        $scope.password = "";  // reset the form
      }
    )
  }
  $scope.onCancel = function(){
    $location.path("/")
  }
})