angular.module('passwordReset', [
    'resources.users',
    'services.loading',
    'services.page',
    'services.userMessage',
    'directives.spinner',
    'security',
    'directives.forms'])

  .config(function ($routeProvider) {

  $routeProvider.when('/reset-password/:resetToken',
  {
    templateUrl:'password-reset/password-reset.tpl.html'
  }
  )
})

.controller("passwordResetFormCtrl", function($scope, $location, $routeParams, Loading, Page, UsersPassword, UserMessage, security){
  console.log("reset token", $routeParams.resetToken)

  $scope.password = ""
  $scope.onSave = function(){
    console.log("submitting password to change", $scope.password)
    Loading.start("saveButton")
    UsersPassword.save(
      {id: $routeParams.resetToken, id_type:"reset_token"},
      {newPassword: $scope.password},
      function(resp) {
        UserMessage.set('passwordReset.success');
        $location.path("/")
        security.showLogin()
      },
      function(resp) {
        UserMessage.set('passwordReset.error.invalidToken', true);
        Loading.finish('saveButton')
        $scope.password = "";  // reset the form
      }
    )
  }
  $scope.onCancel = function(){
    $location.path("/")
  }
})