
angular.module('deadProfile', []).config(function ($routeProvider) {


    $routeProvider.when("/:url_slug/expired", {
      templateUrl: "dead-profile/dead-profile.tpl.html",
      controller: "DeadProfileCtrl"
    })


})


.controller("DeadProfileCtrl", function(){
    console.log("dead profile ctrl")
  })