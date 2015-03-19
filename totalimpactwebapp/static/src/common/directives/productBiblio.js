angular.module("directives.productBiblio", [])




  .directive("productBiblio", function(
    ProfileAboutService
    ){

    function truncatedAuthList(authsList, ownerSurname){
      var truncateLen = 3
      var truncatedList = authsList.slice() // make a copy to work on

      var profileOwnerNameIndex = _.findIndex(authsList, function(auth){
        return auth.indexOf(ownerSurname) > -1
      })


      if (profileOwnerNameIndex < 0) {
        // profile owner doesn't seem to be an author. doh. do nothing.
      }
      else if (profileOwnerNameIndex + 1 <= truncateLen) {
        // profile owner is in the first n authors where n is the preferred
        // truncate length. good.
        truncatedList.length = truncateLen
      }
      else {
        // profile owner is pretty deep in the author list, so we need to
        // make it longer so that they'll still show up. truncate it right after
        // they're shown tho.
        truncatedList.length = profileOwnerNameIndex + 1 // zero-indexed array
      }

      return {
        list: truncatedList,
        numTruncated: authsList.length - truncatedList.length,
        ownerIndex: profileOwnerNameIndex
      }

    }

    return {
     restrict: 'E',
     templateUrl: 'directives/product-biblio.tpl.html',
     link: function(scope, elem, attr, ctrl){
      console.log("i done ran!", attr.biblio)

      scope.$watch("ProfileAboutService.data.surname", function(newVal, oldVal){
        scope.truncatedAuthsList = truncatedAuthList(attr.biblio.authors_list)

      })
     }
    }
  });