angular.module("googleScholar", [
 "security"

])
.factory("GoogleScholar", function($modal, UsersAbout){
  var bibtex = ""

  return {
    setBibtex: function(newBibtex){
      bibtex = newBibtex
      console.log("new bibtex just got set!")
    },
    getBibtex: function(){
      console.log("getting bibtex!", bibtex)
      return bibtex
    },
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

  .controller("GoogleScholarModalCtrl", function($scope, GoogleScholar, currentUser){
    console.log("modal controller activated!")
    $scope.currentUser = currentUser

    $scope.setFileContents = GoogleScholar.setBibtex
    $scope.getBibtex = GoogleScholar.getBibtex


    $scope.submitFile = function(){

      console.log("submitting these file contents: ", GoogleScholar.getBibtex())
    }




  })