angular.module('importers.importer', [
  'directives.forms',
  'services.loading',
  'resources.users',
  'resources.products',
  'update.update',
  'profile'
])
angular.module('importers.importer')
.factory('Importer', function($cacheFactory, Loading, Products, UsersProducts, UsersAbout){
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

    // save external usernames
    _.each(importerObj.inputs, function(input){
      if (input.saveUsername){
        saveExternalUsername(url_slug, importerObj.endpoint, input.cleanedValue)
      }
    })

    // to save products, we need a dict of name:cleanedValue pairs.
    var allInputValues = {}
    _.each(importerObj.inputs, function(input){
      allInputValues[input.name] = input.cleanedValue
    })

    // finally, save products
    saveProducts(url_slug, importerObj.endpoint, allInputValues)
  }


  var saveProducts = function(url_slug, importerName, userInput){

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

  var saveExternalUsername = function(url_slug, importerName, externalUsername){

    var patchData = {about:{}}
    patchData.about[importerName + "_id"] = externalUsername

    console.log("trying to save this patch data: ", patchData)

    start("saveExternalUsernames")
    console.log("saving usernames")
    UsersAbout.patch(
      {id:url_slug},
      patchData,
      function(){
        finish("saveExternalUsernames")
      }
    )
  }

  var cleanInput = function(userInput, inputObjects){
    var cleanedUserInput = _.map(userInput, function(userInputValue, inputName) {

      var relevantInputObject = _.first(_.where(inputObjects, {name:inputName}))
      if (!relevantInputObject){
        return userInputValue  // change nothing.
      }
      else {
        var relevantFunction = relevantInputObject.inputCleanupFunction || function(x) {return(x)}
        return(relevantFunction(userInputValue))
      }

    })
    console.log(cleanedUserInput)
    return(_.object(_.keys(userInput), cleanedUserInput))
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
