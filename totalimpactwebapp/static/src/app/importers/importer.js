angular.module('importers.importer', [
  'directives.forms'
])
angular.module('importers.importer')
.factory('Importer', function(){

 return {

 }

})


.controller('importerCtrl', function($scope){

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
    console.log("we're going to make a call to /import/"
                  + $scope.importer.name + "/"
                  + $scope.importer.input)
  }
  $scope.loading = {}
})
