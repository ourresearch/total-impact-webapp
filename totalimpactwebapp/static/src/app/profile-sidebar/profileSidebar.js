angular.module('profileSidebar', [
    'security',
    'resources.users',
    'services.profileService'
])
  .controller("profileSidebarCtrl", function($scope, ProfileService, security){
    console.log("profileSidebarCtrl ran")

    $scope.profile = ProfileService



  })