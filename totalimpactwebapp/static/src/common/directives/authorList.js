angular.module("directives.authorList", [])
  .directive("authorList", function(
    ProfileAboutService
    ){

    var truncateLen = 3

    function truncatedAuthList(authsList, ownerSurname, truncateLen){
      if (!truncateLen){
        truncateLen = 9999999999
      }
      if (!authsList){
        authsList = []
      }
      var truncatedList

      var profileOwnerNameIndex = _.findIndex(authsList, function(auth){
        return auth.indexOf(ownerSurname) > -1
      })


      if (profileOwnerNameIndex < 0) {
        // profile owner doesn't seem to be an author. doh. do nothing.
        truncatedList = authsList.slice()
      }
      else if (profileOwnerNameIndex + 1 <= truncateLen) {
        // profile owner is in the first n authors where n is the preferred
        // truncate length. good.
        truncatedList = authsList.slice(0, truncateLen)
      }
      else {
        // profile owner is pretty deep in the author list, so we need to
        // make it longer so that they'll still show up. truncate it right after
        // they're shown tho.
        truncatedList = authsList.slice(0, profileOwnerNameIndex + 1)
      }

//      console.log("this is the auths list", authsList)
//      console.log("this is the truncated list", truncatedList)


      return {
        list: truncatedList,
        numTruncated: authsList.length - truncatedList.length,
        ownerIndex: profileOwnerNameIndex
      }

    }

    return {
      restrict: 'E',
      templateUrl: 'directives/author-list.tpl.html',
      scope: {
        authors: "=authors"
      },
      link: function(scope, elem, attr, ctrl){
        var truncateLen

        if (typeof attr.truncateLen === "undefined") {
          truncateLen = 3
        }
        else if (attr.truncateLen === false) {
          truncateLen = 9999999
        }
        else {
          truncateLen = attr.truncateLen
        }

        console.log("the author list again!", scope.authors)


//        scope.truncatedAuthsList = truncatedAuthList(attr.authors, ProfileAboutService.data.surname, truncateLen)

        scope.$watch("ProfileAboutService.data.surname", function(newVal, oldVal){
          scope.truncatedAuthsList = truncatedAuthList(scope.authors, newVal, truncateLen)
        })
      }
    }
  });