angular.module('accounts.account', [
  'directives.forms',
  'directives.onRepeatFinished',
  'services.loading',
  'resources.users',
  'resources.products',
  'update.update',
  'profile'
])
.factory('Account', function(
    $q,
    Loading,
    Products,
    UsersProducts,
    UsersLinkedAccounts,
    UsersAbout){

    var tiidsAdded = []

    var saveAccountInput = function(url_slug, accountObj) {

      var deferred = $q.defer()

      var usernameInput = _.find(accountObj.inputs, function(input){
        return input.saveUsername
      })

      var about = {}
      about[usernameInput.saveUsername] = usernameInput.cleanupFunction(usernameInput.value)

      // hack to use the api endpoint
      var accountType = usernameInput.saveUsername.replace("_id", "")

      var patchData = {'about': about}

      Loading.start("saveButton")
      console.log("saving usernames", patchData)
      UsersAbout.patch(
        {id:url_slug},
        patchData,
        function(resp){

          console.log("telling webapp to update " + accountType)
          UsersLinkedAccounts.update(
            {id: url_slug, account: accountType},
            {},
            function(resp){
              // we've kicked off a slurp for this account type. we'll add
              // as many products we find in that account, then dedup.
              // we'll return the list of new tiids
              console.log("update started for " + accountType + ". ", resp)
              Loading.finish("saveButton")
              deferred.resolve(resp)
            },
            function(updateResp){
              deferred.reject({
                msg: "attempt to slurp in products from linked account failed",
                resp: updateResp
              })
            }

          )
        },
        function(patchResp){
          deferred.reject({
            failure: "PATCH to add external account failed; didn't even try slurping.",
            resp: patchResp
          })
        }
      )
      return deferred.promise
    }






    return {
      'saveAccountInput': saveAccountInput,
      getTiids: function(){return tiidsAdded}
    }

})


.controller('accountCtrl', function(
    $scope,
    $routeParams,
    $location,
    Products,
    UserProfile,
    UsersProducts,
    Account,
    Loading,
    Update){



  $scope.showAccountWindow = function(){
    analytics.track("Opened an account window", {
      "Account name": Account.displayName
    })

    $scope.accountWindowOpen = true;
    $scope.account.userInput = null  // may have been used before; clear it.
  }

  $scope.products = []
  $scope.currentTab = 0;
  $scope.userInput = {}
  $scope.accountHasRun = false


  $scope.setCurrentTab = function(index){$scope.currentTab = index}

  $scope.onCancel = function(){
    $scope.accountWindowOpen = false;
  }

  $scope.onLink = function(){
    console.log(
      _.sprintf("calling /importer/%s updating '%s' with userInput:",
        $scope.account.endpoint,
        $routeParams.url_slug),
      $scope.account
    )

    Account.saveAccountInput($routeParams.url_slug, $scope.account).then(

      // linked this account successfully
      function(resp){
        console.log("successfully saved linked account", resp)




      },
      function(resp){
        console.log("failure at saving inputs :(", resp)
      }
    )
  }
})


  .directive("ngFileSelect",function(){
    return {
      link: function($scope, el, attrs){
        el.bind("change", function(e){
          var reader = new FileReader()
          reader.onload = function(e){
            $scope.input.value = reader.result
          }

          var file = (e.srcElement || e.target).files[0];
          reader.readAsText(file)
        })
      }
    }
  })
