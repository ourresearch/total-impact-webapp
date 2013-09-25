angular.module("profileProduct", [
    'resources.users',
    'product.product',
    'ui.bootstrap',
    'security'
  ])



  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider.when("/:url_slug/product/:tiid", {
      templateUrl:'profile/profile.tpl.html',
      controller:'ProfileProductCtrl'
    });

  }])

  .controller('ProfileProductCtrl', function ($scope, $routeParams, $http, security, UsersAbout, UsersProducts, Product) {


  })
