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
    console.log("show that window, yo! here is the importer: ", $scope.importer)
    $scope.importWindowOpen = true;
  }
  $scope.hideImportWindow = function(){
    $scope.importWindowOpen = false;
  }
  $scope.products = []

  $scope.onCancel = function(){
    $scope.importWindowOpen = false;
  }
  $scope.onImport = function(){
    Loading.start()
    var profileId = NewProfile.about.id
    console.log("now calling /importer/" + $scope.importer.name)
    console.log("here's the profile ID we'll update:", profileId)

    // import the new products
    Products.save(
      {importerName: $scope.importer.name},
      {input: $scope.importer.input},
      function(resp){
        var tiids = _.keys(resp.products)

        // store our new products in the Importer service to keep track of 'em
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
      },
      function() {
        console.log("crap, something didn't work.")
      }
    )
  }
  Loading.finish()
})
