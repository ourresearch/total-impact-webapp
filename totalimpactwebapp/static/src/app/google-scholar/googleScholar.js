angular.module("googleScholar", [
 "security",
 "resources.users"

])
.factory("GoogleScholar", function($modal,
                                   $q,
                                   UsersProducts,
                                   Loading,
                                   TiMixpanel,
                                   security){
  var bibtex = ""
  var tiids = []
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

      Loading.start("bibtex")

      TiMixpanel.track("Uploaded Google Scholar", {
        "Number of products": bibtexArticlesCount()
      })

      return UsersProducts.patch(
        {id: security.getCurrentUser("url_slug")},
        {bibtex: bibtex},
        function(resp){
          console.log("successfully uploaded bibtex!", resp)
          Loading.finish("bibtex")

        },
        function(resp){
          console.log("bibtex import failed :(")
          Loading.finish("bibtex")
          alert("Sorry, we weren't able to load your Google Scholar data! " +
            "Could you fill out a support ticket for us (click the orange tab " +
            "on the right of your screen). That way we can fix it right away.")
        }
      )
    },
    getTiids: function(){
      return tiids
    }
  }

  })

  .controller("GoogleScholarModalCtrl", function($scope, GoogleScholar, currentUser, Loading){
    console.log("google scholar modal controller activated!")
    $scope.currentUser = currentUser
    $scope.googleScholar = GoogleScholar
    $scope.loading = Loading

    $scope.sendToServer = function(){
      GoogleScholar.sendToServer().$promise.then(function(resp){
        console.log("finished with the upload, here's the resp", resp)
        $scope.importComplete = true
//        $scope.importedProductsCount = resp.data.products.length
        $scope.importedProductsCount = null
      })
    }

    $scope.$on("fileLoaded", function(event, result){
      GoogleScholar.setBibtex(result)
      $scope.fileLoaded = true
      $scope.$apply()
    })



  })
