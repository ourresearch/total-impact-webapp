angular.module('importers.importer', [
  'directives.forms',
  'directives.onRepeatFinished',
  'services.loading',
  'resources.users',
  'resources.products',
  'update.update',
  'profile'
])
angular.module('importers.importer')
.factory('Importer', function(
    $q,
    Loading,
    Products,
    UsersProducts,
    UsersLinkedAccounts,
    UsersAbout){

    var waitingOn = {}
    var tiidsAdded = []

    var onImportCompletion = function(){console.log("onImportCompletion(), override me.")}

    var finish = function(importJobName){
      waitingOn[importJobName] = false;
      if (!_.some(_.values(waitingOn))) { // we're not waiting on anything...
        Loading.finish('saveButton')
        onImportCompletion()
      }
    }

    var start = function(importJobName){
      Loading.start("saveButton")
      waitingOn[importJobName] = true
    }


    var saveImporterInput = function(url_slug, importerObj) {

      var deferred = $q.defer()

      var usernameInput = _.find(importerObj.inputs, function(input){
        return input.saveUsername
      })

      var about = {}
      about[usernameInput.saveUsername] = usernameInput.cleanupFunction(usernameInput.value)

      // hack to use the api endpoint
      var accountType = usernameInput.saveUsername.replace("_id", "")

      var patchData = {'about': about}

      start("saveExternalUsernames")
      console.log("saving usernames", patchData)
      UsersAbout.patch(
        {id:url_slug},
        patchData,
        function(resp){
          finish("saveExternalUsernames")

          console.log("telling webapp to update " + accountType)
          UsersLinkedAccounts.update(
            {id: url_slug, account: accountType},
            {},
            function(resp){
              // we've kicked off a slurp for this account type. we'll add
              // as many products we find in that account, then dedup.
              // we'll return the list of new tiids
              console.log("update started for " + accountType + ". ", resp)
              deferred.resolve(resp)
            },
            function(updateResp){
              deferred.reject({
                msg: "attempt to slurp in products from linked account failed",
                resp: updateResp
              })
            }

          )
        },
        function(patchResp){
          deferred.reject({
            failure: "PATCH to add external account failed; didn't even try slurping.",
            resp: patchResp
          })
        }
      )
      return deferred.promise
    }






    return {
      'saveImporterInput': saveImporterInput,
      setOnImportCompletion: function(callback){
        onImportCompletion = callback
      },
      getTiids: function(){return tiidsAdded}
    }

})


.controller('importerCtrl', function(
    $scope,
    $routeParams,
    $location,
    Products,
    UserProfile,
    UsersProducts,
    Importer,
    Loading,
    Update){


  var importCompleteCallback = function(){

    // define vars
    var slug = getUserSlug()
    Importer.setOnImportCompletion(
      function(){
        // close the window
        $scope.importWindowOpen = false;
        $scope.products = Importer.getTiids();

        Update.showUpdate(slug, function(){
          $location.path("/"+slug)
          analytics.track(
            "Imported products",
            {
              "Importer name": Importer.displayName,
              "Number of products": $scope.products.length
            }
          )
        })
        $scope.importerHasRun = true
      }
    )
  }


  $scope.showImporterWindow = function(){
    if (!$scope.importerHasRun) { // only allow one import for this importer.

      analytics.track("Opened an importer", {
        "Importer name": Importer.displayName
      })

      $scope.importWindowOpen = true;
      $scope.importer.userInput = null  // may have been used before; clear it.
    }
  }

  $scope.products = []
  $scope.currentTab = 0;
  $scope.userInput = {}
  $scope.importerHasRun = false


  $scope.setCurrentTab = function(index){$scope.currentTab = index}

  $scope.onCancel = function(){
    $scope.importWindowOpen = false;
  }

  $scope.onImport = function(){
    console.log(
      _.sprintf("calling /importer/%s updating '%s' with userInput:",
        $scope.importer.endpoint,
        $routeParams.url_slug),
      $scope.importer
    )

    Importer.saveImporterInput($routeParams.url_slug, $scope.importer).then(
      function(resp){
        console.log("success at saving inputs!", resp)
      },
      function(resp){
        console.log("failure at saving inputs :(", resp)
      }
    )
  }
})


  .directive("ngFileSelect",function(){
    return {
      link: function($scope, el, attrs){
        el.bind("change", function(e){
          var reader = new FileReader()
          reader.onload = function(e){
            $scope.input.value = reader.result
          }

          var file = (e.srcElement || e.target).files[0];
          reader.readAsText(file)
        })
      }
    }
  })
