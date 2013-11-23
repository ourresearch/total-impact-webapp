angular.module("profile", [
  'resources.users',
  'product.product',
  'services.page',
  'ui.bootstrap',
  'security',
  'profile.addProducts'
])


.factory('UserProfile', function(UsersAbout, security, Slug, Page){
  var about = {}

  return {


    filterProducts: function(products, filterBy) {
      var productsWithMetrics = _.filter(products, function(x){return _.size(x.metrics); });
      var productsWitoutMetrics = _.filter(products, function(x){return x.metrics && _.size(x.metrics)==0; });

      if (filterBy == "withMetrics") {
        return productsWithMetrics;
      }
      else if (filterBy === "withoutMetrics") {
        return productsWitoutMetrics;
      }
      else {
        return productsWithMetrics.concat(productsWitoutMetrics);
      }
    },
    loadUser: function($scope, slug) {
      return UsersAbout.get(
        {
          id: slug,
          idType: "url_slug"
        },
        function(resp) { // success
          Page.setTitle(resp.about.given_name + " " + resp.about.surname)
        },
        function(resp) { // fail
          if (resp.status == 404) {
            $scope.userExists = false;
            $scope.slug = slug;
          }
        }
      );
    },
    slugIsCurrentUser: function(slug){
      if (!security.currentUser) return false;
      return (security.currentUser.url_slug == slug);
    },
    makeSlug: function(){
      about.url_slug = Slug.make(about.givenName, about.surname)
    },
    readyToCreateOnServer: function(){
      return about.url_slug && !id;
    },

    reset:function(){
      about = {}
    },

    setId: function(newId){id = newId},
    getId: function(){return id},
    getSlug: function(){return about.url_slug},
    "about": about
  }
})


.controller('ProfileCtrl', function ($scope, $routeParams, $http, UsersProducts, Product, UserProfile, Page)
  {

    var userSlug = $routeParams.url_slug;
    var loadingProducts = true
    $scope.loadingProducts = function(){
      return loadingProducts
    }
    $scope.userExists = true;
    $scope.showProductsWithoutMetrics = false;
    $scope.filterProducts =  UserProfile.filterProducts;

    $scope.user = UserProfile.loadUser($scope, userSlug);
    $scope.currentUserIsProfileOwner = UserProfile.slugIsCurrentUser(userSlug);



    $scope.getSortScore = function(product) {
      return Product.getSortScore(product) * -1;
    }

    $scope.getGenre = function(product) {
      return Product.getGenre(product);
    }


    $scope.products = UsersProducts.query({
      id: userSlug,
      includeHeadingProducts: true,
      idType: "url_slug"
    },
      function(resp){loadingProducts = false},
      function(resp){loadingProducts = false}
    );

})
  .directive("backToProfile",function($location){
   return {
     restrict: 'A',
     replace: true,
     template:"<a ng-show='url_slug' class='back-to-profile' href='/{{ url_slug }}'><i class='icon-chevron-left'></i>back to profile</a>",
     link: function($scope,el){
       var re = /^\/(\w+)\/\w+/
       var m = re.exec($location.path())
       var slug = null

       if (!m || m[1] == "embed"){
         $scope.url_slug = null
       }
       else {
         $scope.url_slug = m[1]
       }
     }
   }
  })



