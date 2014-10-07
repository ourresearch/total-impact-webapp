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
    UsersLinkedAccounts,
    Users){

    var tiidsAdded = []

    var unlinkAccount = function(url_slug, accountObj){
      var deferred = $q.defer()

      var about = {}
      about[accountObj.accountHost + "_id"] = null



      Loading.start("saveButton")
      console.log("unlinking account " + accountObj.accountHost)
      Users.patch(
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
      Users.patch(
        {id:url_slug},
        {about: about},

        function(patchResp){
          // ok the userAbout object has this username in it now. let's slurp.

          console.log("telling webapp to update " + accountObj.accountHost)
          UsersLinkedAccounts.update(
            {id: url_slug, account: accountObj.accountHost},
            {},

            // got products back for this linked account
            function(updateResp){
              // we've kicked off a slurp for this account type. we'll add
              // as many products we find in that account, then dedup.
              // we'll return the list of new tiids

              console.log("update started for " + accountObj.accountHost + ". ", updateResp)
              Loading.finish("saveButton")
              deferred.resolve({
                updateResp: updateResp,
                patchResp: patchResp
              })
            },

            // ruh-roh, this linked account had no products with it.
            function(updateResp){

              // unlink this account from the user, since it's useless.
              about[accountObj.accountHost + "_id"] = null
              Users.patch(
                {id:url_slug},
                {about:about}
              ).$promise.then(function(resp){
                // now that this is cleaned out of the user, we can finish up.
                Loading.finish("saveButton")
                deferred.reject({
                  msg: "attempt to slurp in products from linked account failed",
                  resp: updateResp
                })
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
    Products,
    GoogleScholar,
    UserProfile,
    ProfileService,
    ProfileAboutService,
    Account,
    security,
    Page,
    Loading,
    TiMixpanel){

    Page.setName("addAccounts")

  $scope.showAccountWindow = function(){
    $scope.accountWindowOpen = true;
    TiMixpanel.track("Opened an account window", {
      "Account name": $scope.account.displayName
    })

  }

  $scope.isLinked = function(){
    return !!$scope.account.username.value
  }



  $scope.isLinked = !!$scope.account.username.value

  $scope.setCurrentTab = function(index){$scope.currentTab = index}

  $scope.googleScholar = GoogleScholar

  $scope.showImportModal = function(){
    GoogleScholar.showImportModal()
    $scope.accountWindowOpen = false
  }


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
        security.refreshCurrentUser() // the current user looks different now, no account

      }
    )
  }

  $scope.onLink = function(){
    console.log(
      _.sprintf("calling /profile/%s/linked-accounts/%s with userInput:",
        $routeParams.url_slug,
        $scope.account.accountHost),
      $scope.account
    )

    $scope.accountWindowOpen = false

    console.log("linking an account other than google scholar")
    Loading.start($scope.account.accountHost)
    Account.saveAccountInput($routeParams.url_slug, $scope.account)
      .then(

      // linked this account successfully
      function(resp){
        console.log("successfully saved linked account", resp)

        if ($scope.account.accountHost == "google_scholar"){
          GoogleScholar.showImportModal()
        }

        $scope.isLinked = true
        TiMixpanel.track("Linked an account", {
          "Account name": $scope.account.displayName
        })


         // make sure everyone can see the new linked account
        ProfileAboutService.get($routeParams.url_slug, true)
        ProfileService.get($routeParams.url_slug)
        security.refreshCurrentUser().then(
          function(resp){
            console.log("update the client's current user with our new linked account", resp)
            Loading.finish($scope.account.accountHost)
          }
        )
      },

      // couldn't link to account
      function(resp){
        console.log("failure at saving inputs :(", resp)
        Loading.finish($scope.account.accountHost)
        alert("Sorry, we weren't able to link this account. You may want to fill out a support ticket.")
      }
    )
  }
})
