angular.module('profileSidebar', [
    'security',
    'resources.users',
    'services.profileService'
])
  .controller("profileSidebarCtrl", function($scope, $rootScope, ProfileService, Page, security){

    $scope.page = Page
    ProfileService.getCached().then(
      function(resp){
        $scope.profile = resp
      }
    )





  })