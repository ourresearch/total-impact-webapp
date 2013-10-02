angular.module('importers.importer', [
  'directives.forms',
  'resources.products'
])
angular.module('importers.importer')
.factory('Importer', function(){
  return {

  }

})


.controller('importerCtrl', function($scope, Products){

  $scope.showImporterWindow = function(){
    console.log("show that window, yo! here is the importer: ", $scope.importer)
    $scope.importWindowOpen = true;
  }
  $scope.hideImportWindow = function(){
    $scope.importWindowOpen = false;
  }

  $scope.onSave = function() {
    $scope.loading = true;
    console.log("hey man, i saved a thing!");
  }

  $scope.onCancel = function(){
    $scope.importWindowOpen = false;
  }
  $scope.onImport = function(){
    console.log("now calling /importer/" + $scope.importer.name)
    Products.save(
      {importerName: $scope.importer.name},
      {input: $scope.input},
      function(){
        console.log("we got stuff!")
      },
      function() {
        console.log("crap, something didn't work.")
      }
    )
  }
  $scope.loading = {}
})
