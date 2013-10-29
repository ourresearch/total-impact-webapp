angular.module("profileProduct", [
    'resources.users',
    'product.product',
    'ui.bootstrap',
    'security'
  ])



  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider.when("/:url_slug/product/:tiid", {
      templateUrl:'profile-product/profile-product-page.tpl.html',
      controller:'ProfileProductPageCtrl'
    });

  }])

  .controller('ProfileProductPageCtrl', function ($scope, $routeParams, security, UsersProduct, Product) {

    $scope.product = UsersProduct.get({
      id: $routeParams.url_slug,
      tiid: $routeParams.tiid,
      idType: "url_slug"
    },
    function(data){
      console.log("data", data)
      $scope.biblio = Product.makeBiblio(data)
      $scope.awards = Product.makeAwards(data)
    }

    )
  })
