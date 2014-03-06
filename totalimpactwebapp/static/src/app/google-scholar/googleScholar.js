angular.module("googleScholar", [
 "security"

])
.factory("GoogleScholar", function($modal, UsersAbout){

  return {
    showImportModal: function(){
      $modal.open({
        templateUrl: "google-scholar/google-scholar-modal.tpl.html",
        controller: "GoogleScholarModalCtrl",
        resolve: {
          currentUser: function(security){
            security.clearCachedUser()
            return security.requestCurrentUser()
          }
        }
      })
    }


  }


  })

.controller("GoogleScholarModalCtrl", function($scope, currentUser){
  console.log("modal controller activated!")
  $scope.currentUser = currentUser



  })