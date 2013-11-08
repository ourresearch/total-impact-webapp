angular.module('importers.importer', [
  'directives.forms',
  'services.loading',
  'resources.users',
  'resources.products',
  'update.update',
  'profile'
])
angular.module('importers.importer')
.factory('Importer', function(){

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
    }
  }
  $scope.hideImportWindow = function(){
    $scope.importWindowOpen = false;
  }
  $scope.products = []
  $scope.importerHasRun = false

  $scope.onCancel = function(){
    $scope.importWindowOpen = false;
  }
  $scope.onImport = function(){
    Loading.start()
    var slug = getUserSlug()
    console.log("now calling /importer/" + $scope.importer.endpoint)
    console.log("here's the profile slug we'll update:", slug)

    // import the new products
    Products.save(
      {importerName: $scope.importer.endpoint}, // define the url
      {input: $scope.importer.input}, // the post data, from user input
      function(resp, headers){  // run when the server gives us something back.
        var tiids;

        if (resp.error){
          tiids = []
        }
        else {
          tiids = _.keys(resp.products)
        }

        // store our new products in this importer's scope, so we can display count to user
        console.log("here are the tiids:", tiids);
        $scope.products = tiids;

        // add the new products to the user's profile on the server
        UsersProducts.patch(
          {id: slug, idType:"url_slug"},  // the url
          {"tiids": tiids},  // the POST data
          function(){
            Loading.finish()
          }
        )

        // close the window
        $scope.hideImportWindow()
        Update.showUpdate(slug, function(){$location.path("/"+slug)})
        $scope.importerHasRun = true
      }
    )
  }
  Loading.finish()
})
