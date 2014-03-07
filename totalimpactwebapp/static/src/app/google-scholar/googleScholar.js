angular.module("googleScholar", [
 "security",
 "resources.users"

])
.factory("GoogleScholar", function($modal, UsersProducts, security){
  var bibtex = ""
  var bibtexArticlesCount = function(){
    var matches = bibtex.match(/^@/gm)
    if (matches) {
      return matches.length
    }
    else {
      return 0
    }
  }

  return {
    bibtexArticlesCount: bibtexArticlesCount,
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
    },
    sendToServer: function(){
      console.log(
        "sending this bibtex to /importers/bibtex: ",
        bibtex.substring(0, 50) + "..."
      )

      analytics.track("Uploaded Google Scholar", {
        "Number of products": bibtexArticlesCount()
      })

      UsersProducts.patch(
        {id: security.getCurrentUser("url_slug")},
        {bibtex: bibtex},
        function(resp){
          console.log("successfully uploaded bibtex!", resp)
        },
        function(resp){
          console.log("bibtex import failed :(")
        }
      )
    }


  }


  })

  .controller("GoogleScholarModalCtrl", function($scope, GoogleScholar, currentUser){
    console.log("modal controller activated!")
    $scope.currentUser = currentUser

    $scope.googleScholar = GoogleScholar

    $scope.$on("fileLoaded", function(event, result){
      GoogleScholar.setBibtex(result)
      $scope.fileLoaded = true
      $scope.$apply()
    })



  })
