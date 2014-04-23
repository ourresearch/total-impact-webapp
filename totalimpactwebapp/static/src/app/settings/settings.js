angular.module('settings', [
    'resources.users',
    'services.loading',
    'update.update',
    'directives.spinner',
    'settings.pageDescriptions',
    'services.userMessage',
    'security',
    'angularPayments',
    'directives.forms'])

  .config(function ($routeProvider) {

    $routeProvider.when('/settings/:page',
      {
        templateUrl:'settings/settings.tpl.html',
        controller: "settingsCtrl",
        resolve:{
          authenticatedUser:function (security) {
            return security.requestCurrentUser();
          },
          allowed: function(security){
            return security.testUserAuthenticationLevel("loggedIn")
          }
        }
      }
    )
  })

  .controller('settingsCtrl', function ($scope, $location, authenticatedUser, SettingsPageDescriptions, $routeParams, Loading) {

    $scope.resetUser = function(){
      $scope.user = angular.copy(authenticatedUser)
    }
    $scope.loading = Loading
    $scope.home = function(){
      $location.path('/' + authenticatedUser.url_slug);
    }
    $scope.isCurrentPath = function(path) {
      return path == $location.path();
    }

    $scope.onCancel = function(){
      $scope.resetUser();
      $scope.home();
    }

    $scope.testClick = function(formCtrl){
      formCtrl.$setPristine()
    }

    var currentPageDescr = SettingsPageDescriptions.getDescrFromPath($location.path());
    console.log(currentPageDescr)

    $scope.resetUser()
    Loading.finish()
    $scope.include =  currentPageDescr.templatePath;
    $scope.authenticatedUser = authenticatedUser;
    $scope.pageDescriptions = SettingsPageDescriptions.get();

  })

  .controller('profileSettingsCtrl', function ($scope, UsersAbout, security, UserMessage, Loading) {
    $scope.onSave = function() {
      Loading.start('saveButton')
      UsersAbout.patch(
        {id: $scope.user.url_slug},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set('settings.profile.change.success', true);
          $scope.home();
        }
      )
    };
  })

  .controller('passwordSettingsCtrl', function ($scope, $location, UsersPassword, security, UserMessage, Loading) {

    $scope.showPassword = false;
    var resetToken =  $location.search()["reset_token"]
    $scope.requireCurrentPassword = !resetToken

    $scope.onSave = function() {
      Loading.start('saveButton')

      UsersPassword.save(
        {id: $scope.user.url_slug},
        $scope.user,
        function(resp) {
          UserMessage.set('settings.password.change.success', true);
          $scope.home()
        },
        function(resp) {
          UserMessage.set('settings.password.change.error.unauthenticated');
          Loading.finish('saveButton')
          $scope.resetUser();  // reset the form
          $scope.wrongPassword = true;
          scroll(0,0)
        }
      )
    };
  })



  .controller('urlSettingsCtrl', function ($scope, UsersAbout, security, $location, UserMessage, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      UsersAbout.patch(
        {id: $scope.user.id, idType:"id"},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set('settings.url.change.success', true);
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })



  .controller('upgradeSettingsCtrl', function ($scope, UsersAbout, security, $location, UserMessage, Loading, UsersCreditCard) {


    $scope.planStatus = function(){
      var su = security.currentUser.subscription
      if (su.user_has_card && _.contains(["active", "trialing", "past_due"], su.status)) {
        // paid user with working premium plan
        return "paid"
      }
      else if (!su.user_has_card && su.status == "trialing") {
        // trial user with working premium plan
        return "trial"
      }
      else {
        // on the free plan
        return "free"
      }
    }

    $scope.handleStripe = function(status, response){
        console.log("calling handleStripe()")
        if(response.error) {
          console.log("ack, there was an error!", status, response)
        } else {
          console.log("yay, the charge worked!", status, response)
          UsersCreditCard.save(
            {id: $scope.user.url_slug, stripeToken: response.id},
            {},
            function(resp){
              console.log("success!", resp)
            },
            function(resp){
              console.log("failure!", resp)
            }
          )
        }
      }
  })


  .controller('emailSettingsCtrl', function ($scope, UsersAbout, security, $location, UserMessage, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      UsersAbout.patch(
        {id: $scope.user.url_slug, log:"changing email from settings"},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set(
            'settings.email.change.success',
            true,
            {email: resp.about.email}
          );
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })


  // not currently using this...LinkedAccounts page is hidden.
  .controller('linkedAccountsSettingsCtrl', function ($scope, UsersAbout, security, $location, UserMessage, Loading, Update, UsersProducts) {


    $scope.onSave = function() {
      var url_slug = security.getCurrentUserSlug()

      console.log("saving linked account info. sending this: ", $scope.user)
      Loading.start('saveButton')

      UsersAbout.patch(
        {id: url_slug},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set('settings.wordpress_api_key.add.success', true);

          Update.setUpdateStarted(false)
          Update.showUpdate(url_slug, function(){
            $location.path("/" + url_slug)
          })

          UsersProducts.refresh({id: url_slug}, {}, function(){
            Update.setUpdateStarted(true)
          })
        }
      )
    };
  })


