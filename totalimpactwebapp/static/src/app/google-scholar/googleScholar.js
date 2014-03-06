angular.module("googleScholar", [
 "security"
])
.factory("GoogleScholar", function($modal, security){

  return {
    openImportModal: function(){
      $modal.open({
        templateUrl: "google-scholar/google-scholar-modal.tpl.html",
        controller: "google-scholar/googleScholar.js"
      })
    }


  }


  })

.controller("GoogleScholarModalCtrl", function($modal){




  })