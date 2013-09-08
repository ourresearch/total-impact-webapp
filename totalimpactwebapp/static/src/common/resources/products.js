angular.module('resources.products', []);
angular.module('resources.products').factory('Products', ['$http', function ($http) {

  var Products = {};

  Products.forUser = function(userId, successcb, errorcb) {
    $http.get("/user/"+userId+"/products")
      .success(function(data, status){

        successcb(data, status)






      })
      .error(function(data, status){ errorcb(data, status)})
  };

  Products.isProductOwner = function (userId) {
    return this.productOwner === userId;
  };
  Products.canActAsProductOwner = function (userId) {
    return !this.isScrumMaster(userId) && !this.isDevTeamMember(userId);
  };
  Products.isScrumMaster = function (userId) {
    return this.scrumMaster === userId;
  };
  Products.canActAsScrumMaster = function (userId) {
    return !this.isProductOwner(userId);
  };
  Products.isDevTeamMember = function (userId) {
    return this.teamMembers.indexOf(userId) >= 0;
  };
  Products.canActAsDevTeamMember = function (userId) {
    return !this.isProductOwner(userId);
  };

  Products.getRoles = function (userId) {
    var roles = [];
    if (this.isProductOwner(userId)) {
      roles.push('PO');
    } else {
      if (this.isScrumMaster(userId)){
        roles.push('SM');
      }
      if (this.isDevTeamMember(userId)){
        roles.push('DEV');
      }
    }
    return roles;
  };

  return Products;
}]);
