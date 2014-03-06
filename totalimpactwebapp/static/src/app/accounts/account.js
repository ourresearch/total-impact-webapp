angular.module('accounts.account', [
  'directives.forms',
  'directives.onRepeatFinished',
  'services.loading',
  'googleScholar',
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

    var unlinkAccount = function(url_slug, accountObj){
      var deferred = $q.defer()

      var about = {}
      about[accountObj.accountHost + "_id"] = null



      Loading.start("saveButton")
      console.log("unlinking account " + accountObj.accountHost)
      UsersAbout.patch(
        {id:url_slug},
        {about: about},
        function(resp){
          deferred.resolve(resp)
          Loading.finish("saveButton")

        },
        function(resp){
          deferred(reject(resp))
          Loading.finish("saveButton")
        })

      return deferred.promise
    }



    var saveAccountInput = function(url_slug, accountObj) {

      var deferred = $q.defer()

      var about = {}
      var cleanUsername = accountObj.usernameCleanupFunction(accountObj.username.value)
      about[accountObj.accountHost + "_id"] = cleanUsername


      Loading.start("saveButton")
      UsersAbout.patch(
        {id:url_slug},
        {about: about},

        function(resp){
          // ok the userAbout object has this username in it now. let's slurp.

          console.log("telling webapp to update " + accountObj.accountHost)
          UsersLinkedAccounts.update(
            {id: url_slug, account: accountObj.accountHost},
            {},
            function(resp){
              // we've kicked off a slurp for this account type. we'll add
              // as many products we find in that account, then dedup.
              // we'll return the list of new tiids

              console.log("update started for " + accountObj.accountHost + ". ", resp)
              Loading.finish("saveButton")
              deferred.resolve(resp)
            },
            function(updateResp){
              Loading.finish("saveButton")
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
      unlinkAccount: unlinkAccount,
      getTiids: function(){return tiidsAdded}
    }

})


.controller('accountCtrl', function(
    $scope,
    $routeParams,
    $location,
    $modal,
    Products,
    UserProfile,
    UsersProducts,
    Account,
    Loading,
    Update){



  $scope.showAccountWindow = function(){
    $scope.accountWindowOpen = true;
    analytics.track("Opened an account window", {
      "Account name": Account.displayName
    })

  }

  $scope.justAddedProducts =[]
  $scope.isLinked = !!$scope.account.username.value

  console.log("account.username", $scope.account.username)



  $scope.setCurrentTab = function(index){$scope.currentTab = index}

  $scope.onCancel = function(){
    $scope.accountWindowOpen = false;
  }

  $scope.unlink = function() {
    $scope.accountWindowOpen = false;
    $scope.isLinked = false

    Account.unlinkAccount($routeParams.url_slug, $scope.account).then(
      function(resp){
        console.log("finished unlinking!", resp)
        $scope.account.username.value = null
      }
    )
  }

  $scope.onLink = function(){
    console.log(
      _.sprintf("calling /importer/%s updating '%s' with userInput:",
        $scope.account.accountHost,
        $routeParams.url_slug),
      $scope.account
    )

    $scope.accountWindowOpen = false
    Loading.start($scope.account.accountHost)

    Account.saveAccountInput($routeParams.url_slug, $scope.account).then(

      // linked this account successfully
      function(resp){
        console.log("successfully saved linked account", resp)
        $scope.justAddedProducts = resp.products
        $scope.isLinked = true
        Loading.finish($scope.account.accountHost)

        if ($scope.account.accountHost == "google_scholar"){

        }




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
