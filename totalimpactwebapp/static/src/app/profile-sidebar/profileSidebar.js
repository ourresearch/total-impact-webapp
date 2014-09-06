angular.module('profileSidebar', [
    'security',
    'resources.users',
    'services.profileService'
])
  .controller("profileSidebarCtrl", function($scope, $routeParams, ProfileService, security){
    console.log("profileSidebarCtrl ran")

    console.log("route params", $routeParams)

    $scope.profile = ProfileService
    $scope.isCurrent = function(menuString){
    }



  })