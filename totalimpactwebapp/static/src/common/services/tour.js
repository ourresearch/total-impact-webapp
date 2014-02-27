angular.module('services.tour', [])
  .factory("Tour", function($modal){
    return {
      start: function(userAboutDict){
        console.log("start tour!")
        $(".tour").popover({trigger: "click"}).popover("show")

        $modal.open({
          templateUrl: "profile/tour-start-modal.tpl.html",
          resolve: {
            userAbout: function($q){ // pass the userSlug to modal controller.
              return $q.when(userAbout)
            }
          }
        })
      }
    }
  })
  .controller("profileTourStartModalCtrl", function($scope, userAbout){
    $scope.userAbout = userAbout
  })
