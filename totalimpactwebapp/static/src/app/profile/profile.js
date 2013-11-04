angular.module("profile", [
  'resources.users',
  'product.product',
  'ui.bootstrap',
  'security',
  'profile.addProducts'
])


.factory('UserProfile', function(UsersAbout, security, Slug, UsersPassword){
  var about = {}

  return {


    filterProducts: function(products, filterBy) {
      var productsWithMetrics = _.filter(products, function(x){return _.size(x.metrics); });
      var productsWitoutMetrics = _.filter(products, function(x){return x.metrics && _.size(x.metrics)==0; });
      var pseudoProducts = _.filter(products, function(x){return !x.metrics; });

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
        function(resp) { // success callback. could set the 'about' var here, but don't think we need to
        },
        function(resp) {
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
    setEmail: function() {
      if (about.email) {
        UsersAbout.patch(
          {"id": id},
          {about: {email: about.email}},
          function(resp) {
            console.log("updated creds", resp)
          }
        )
      }
    },

    reset:function(){
      about = {}
    },

    setPassword: function(){
      if (about.password && about) {
        UsersPassword.save(
          {"id": id},
          {newPassword: about.password},
          function(data){ // runs on successful password set.
            console.log("we set the password successfully. logging the user in")
            var user = security.requestCurrentUser()
            console.log("we found this user: ", user)
          }
        )
      }
    },
    setId: function(newId){id = newId},
    getId: function(){return id},
    getSlug: function(){return about.url_slug},
    "about": about
  }
})



.config(['$routeProvider', function ($routeProvider) {

  $routeProvider.when("/:url_slug", {
    templateUrl:'profile/profile.tpl.html',
    controller:'ProfileCtrl'
  })
}])







.controller('ProfileCtrl', function ($scope, $routeParams, $http, UsersProducts, Product, UserProfile)
  {
    var userSlug = $routeParams.url_slug;
    $scope.userExists = true;
    $scope.showProductsWithoutMetrics = false;
    $scope.filterProducts =  UserProfile.filterProducts;

    $scope.user = UserProfile.loadUser($scope, userSlug);
    $scope.currentUserIsProfileOwner = UserProfile.slugIsCurrentUser(userSlug);



    $scope.getBadgeCount = function(product) {
      return Product.getBadgeCount(product) * -1;
    }

    $scope.getGenre = function(product) {
      return Product.getGenre(product);
    }

    $scope.products = UsersProducts.query({
      id: userSlug,
      includeHeadingProducts: true,
      idType: "url_slug"
    });

});


