/**
 * Created with PyCharm.
 * User: jay
 * Date: 11/18/13
 * Time: 3:21 PM
 * To change this template use File | Settings | File Templates.
 */
angular.module('passwordReset', [
    'resources.users',
    'services.loading',
    'directives.spinner',
    'services.i18nNotifications',
    'security',
    'directives.forms'])

  .config(function ($routeProvider) {

  $routeProvider.when('/reset-password/:resetToken',
  {
    templateUrl:'password-reset/password-reset.tpl.html',
    controller: "passwordResetCtrl"
  }
  )
})

.controller("passwordResetCtrl", function($routeParams, UsersPassword){

  console.log("reset token", $routeParams.resetToken)
})