angular.module('product.product', ["tips"])
angular.module('product.product')



  .factory('Product', function() {
    return {
      test: function foo(){}
    }

})

  .controller('productCtrl', function ($scope, Product) {

//    if ($scope.product.genre == "blog"){
//      $scope.how_we_found_these = "how_we_found_these_blog_posts"
//    }
//
//    if ($scope.product.genre == "twitter"){
//      $scope.how_we_found_these = "how_we_found_these_tweets"
//    }


//    $scope.upload_wordpress_key = function(){
//      var wpHeading =  ($scope.product.account_biblio && $scope.product.account_biblio.hosting_platform == "wordpress.com")
//      var wpKeySet = security.getCurrentUser("wordpress_api_key")
//      if (wpHeading && !wpKeySet){
//        return "upload_wordpress_key"
//      }
//      else {
//        return null
//      }
//    }

  })

























