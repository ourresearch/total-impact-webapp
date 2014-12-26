angular.module('fansPage', [
  ])

.config(function($routeProvider) {
  $routeProvider

  .when('/:url_slug/fans', {
    templateUrl: 'fans/fans-page.tpl.html',
    controller: 'FansPageCtrl'
  })
})

.controller("FansPageCtrl", function(
    $scope,
    FansService,
    Page){

    console.log("fans page controller ran.")
    $scope.FansService = FansService


  })