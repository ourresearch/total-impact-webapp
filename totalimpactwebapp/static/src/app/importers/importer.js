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
.factory('Importer', function($cacheFactory, $q, Loading, Products, UsersProducts, UsersAbout){
    var waitingOn = {}
    var tiidsAdded = []
    var $httpDefaultCache = $cacheFactory.get('$http')

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
      // clear the cache. this clear EVERYTHING, we can be smarter later.
      $httpDefaultCache.removeAll()

      // clean the values
      _.each(importerObj.inputs, function(input){
        input.cleanedValue = input.cleanupFunction(input.value)
      })

      saveExternalUsernames(url_slug, importerObj.inputs)
      saveProducts(url_slug, importerObj.endpoint, importerObj.inputs)

    }


    var saveProducts = function(url_slug, importerName, userInputObjs){

      // make a simple dict of cleaned input values.
      var userInput = {}
      _.each(userInputObjs, function(input){
        userInput[input.name] = input.cleanedValue
      })

      console.log("saveProducts()", url_slug, importerName, userInput)
      start("saveProducts")
      Products.save(
        {'importerName': importerName}, // define the url
        userInput, // the post data, from user input
        function(resp, headers){  // run when the server gives us something back.
          var tiids;

          if (resp.error){
            tiids = []
          }
          else {
            tiids = _.keys(resp.products)
          }

          console.log("importer got us some tiids:", tiids);
          tiidsAdded = tiids

          // add the new products to the user's profile on the server
          UsersProducts.patch(
            {id: url_slug},  // the url
            {"tiids": tiids},  // the POST data
            function(){
              finish("saveProducts")
            }
          )
        }
      )
    }


    var saveExternalUsernames = function(url_slug, userInputObjs){

      var about = {}
      _.each(userInputObjs, function(input){
        if (input.saveUsername){
          about[input.saveUsername] = input.cleanedValue
        }
      })

      var patchData = {'about': about}
      console.log("trying to save this patch data: ", patchData)

      start("saveExternalUsernames")
      console.log("saving usernames")
      UsersAbout.patch(
        {id:url_slug},
        patchData,
        function(resp){
          finish("saveExternalUsernames")
          console.log("done saving external usernames.")
        }
      )
    }



    return {
      'saveImporterInput': saveImporterInput,
      setOnImportCompletion: function(callback){
        onImportCompletion = callback
      },
      getTiids: function(){return tiidsAdded}
    }

})


.controller('importerCtrl', function($scope, $location, Products, UserProfile, UsersProducts, Importer, Loading, Update){

  var getUserSlug = function(){
    var re = /\/(\w+)\/products/
    var res = re.exec($location.path())
    return res[1]
  }
  $scope.showImporterWindow = function(){
    if (!$scope.importerHasRun) { // only allow one import for this importer.
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

    // define vars
    var slug = getUserSlug()
    Importer.setOnImportCompletion(
      function(){
        // close the window
        $scope.importWindowOpen = false;
        $scope.products = Importer.getTiids();

        // redirectAfterImport or not (inherits this from parent scope)
        if ($scope.redirectAfterImport) { // inherited from parent scope
          Update.showUpdate(slug, function(){$location.path("/"+slug)})
        }
        $scope.importerHasRun = true
      }
    )

    // ok, let's do this
    console.log(
      _.sprintf("calling /importer/%s updating '%s' with userInput:", $scope.importer.endpoint, slug),
      $scope.importer
    )

    Importer.saveImporterInput(slug, $scope.importer)
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
