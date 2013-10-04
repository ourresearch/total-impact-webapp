angular.module('importers.importer', [
  'directives.forms',
  'services.loading',
  'resources.products'
])
angular.module('importers.importer')
.factory('Importer', function(){

})


.controller('importerCtrl', function($scope, Products, NewProfile, UsersProducts, Importer, Loading){

  $scope.showImporterWindow = function(){
    if (!$scope.importerHasRun) { // only allow one import for this importer.
      $scope.importWindowOpen = true;
    }
  }
  $scope.hideImportWindow = function(){
    $scope.importWindowOpen = false;
  }
  $scope.products = []
  $scope.importerHasRun = false

  $scope.onCancel = function(){
    console.log("onCancel!")
    $scope.importWindowOpen = false;
  }
  $scope.onImport = function(){
    Loading.start()
    var profileId = NewProfile.getId()
    console.log("now calling /importer/" + $scope.importer.name)
    console.log("here's the profile ID we'll update:", profileId)

    // import the new products
    Products.save(
      {importerName: $scope.importer.name},
      {input: $scope.importer.input},
      function(resp, headers){
        var tiids;

        if (resp.error){
          tiids = []
        }
        else {
          tiids = _.keys(resp.products)
        }

        // store our new products in this importer's scope
        $scope.products = tiids;

        // add the new products to the user's profile on the server
        UsersProducts.patch(
          {id: profileId},
          {"tiids": tiids},
          function(){
            Loading.finish()
          }
        )

        // close the window
        $scope.hideImportWindow()
        $scope.importerHasRun = true
      }
    )
  }
  Loading.finish()
})
