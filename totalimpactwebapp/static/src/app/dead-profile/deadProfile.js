
angular.module('deadProfile', []).config(function ($routeProvider) {


    $routeProvider.when("/:url_slug/expired", {
      templateUrl: "dead-profile/dead-profile.tpl.html",
      controller: "DeadProfileCtrl"
    })


})


.controller("DeadProfileCtrl", function($scope, $location, $rootScope, $routeParams, security){
    console.log("dead profile ctrl")
    $scope.showLogin = security.showLogin
    if ($rootScope.adminMode){
      $location.path($routeParams.url_slug)
      $location.search("admin", null)
    }
  })