angular.module('services.tour', [])
  .factory("Tour", function($modal){
    return {
      start: function(userAbout){
//        $(".tour").popover({trigger: "click"}).popover("show")

        $modal.open({
          templateUrl: "profile/tour-start-modal.tpl.html",
          controller: "profileTourStartModalCtrl",
          resolve: {
            userAbout: function($q){
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
