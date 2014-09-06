angular.module('profileSidebar', [
    'security',
    'resources.users',
    'services.profileService'
])
  .controller("profileSidebarCtrl", function($scope, $rootScope, ProfileService, security){

    ProfileService.getCached().then(
      function(resp){
        $scope.profile = resp
      }
    )





  })