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
    OurSortService,
    Page){
    Page.setName("fans")

    console.log("fans page controller ran.")
    $scope.FansService = FansService

    OurSortService.setChoices([
      {
        key: ["-about.followers", 'about.name'],
        name: "followers",
        urlName: "default"
      },
      {
        key: "about.name",
        name: "name",
        urlName: "name"
      }
    ])


  })
