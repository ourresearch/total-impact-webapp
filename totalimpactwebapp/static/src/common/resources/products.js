angular.module('resources.products', []);
angular.module('resources.products').factory('Products', ['$http', function ($http) {

  var Products = {};

  Products.forUser = function(userId, successcb, errorcb) {
    var url = "/user/"+userId+"/products";
    var scb = successcb || angular.noop;
    var ecb = errorcb || angular.noop;

    return $http.get(url)
      .then(function(response){
        console.log("got some response data back, it seems: ", response);
        scb(response, status)
        return response.data.items

      })
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
