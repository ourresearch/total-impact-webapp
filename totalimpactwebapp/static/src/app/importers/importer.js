angular.module('importers.importer', [
  'directives.forms'
])
angular.module('importers.importer')
.factory('Importer', function(){

 return {

 }

})


.controller('importerCtrl', function($scope){
  $scope.onSave = function() {
    $scope.loading = true;
    console.log("hey man, i saved a thing!");

  }
})