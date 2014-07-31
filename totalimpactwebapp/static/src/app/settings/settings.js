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

    $scope.resetUser()
    Loading.finish()
    $scope.include =  currentPageDescr.templatePath;
    $scope.authenticatedUser = authenticatedUser;
    $scope.pageDescriptions = SettingsPageDescriptions.get();

  })

  .controller('profileSettingsCtrl', function ($scope, Users, security, UserMessage, Loading) {
    $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
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


  .controller('NotificationsSettingsCtrl', function ($scope, Users, security, UserMessage, Loading) {
    $scope.onSave = function() {
      var messageKey = "settings.notifications."
        + $scope.user.notification_email_frequency
        + ".success"


      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.url_slug},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set(messageKey, true);
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



  .controller('urlSettingsCtrl', function ($scope, Users, security, $location, UserMessage, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.id, id_type:"id"},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set('settings.url.change.success', true);
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })



  .controller('subscriptionSettingsCtrl', function ($scope, Users, security, $location, UserMessage, Loading, UsersCreditCard, UsersSubscription) {

    $scope.isTrialing = function(){
      return security.getCurrentUser("is_trialing")
    }

    $scope.isSubscribed = function(){
      return security.getCurrentUser("is_subscribed")
    }


    $scope.daysLeftInTrial = function(){
      return security.getCurrentUser("days_left_in_trial")
    }

    $scope.paidSince = function(){
      var su = security.getCurrentUser("subscription")
      return "July 2014"
    }

    $scope.editCard = function(){
      alert("Sorry--we're actually still working on the form for this! But drop us a line at team@impactstory.org and we'll be glad to modify your credit card information manually.")
    }

    $scope.cancelSubscription = function(){
      UsersSubscription.delete(
        {id: $scope.user.url_slug},
        {},
        function(resp){
          console.log("subscription successfully cancelled", resp)
          security.refreshCurrentUser() // refresh the currentUser from server
          UserMessage.set("settings.subscription.delete.success")

          // @todo refresh the page
        },
        function(resp){
          console.log("there was a problem; subscription not cancelled", resp)
        }
      )
    }

    $scope.handleStripe = function(status, response){
        Loading.start("subscribe")
        console.log("calling handleStripe()")
        if(response.error) {
          console.log("ack, there was an error!", status, response)
          UserMessage.set("settings.subscription.subscribe.error")

        } else {
          console.log("yay, token created successfully! Now let's save the card.", status, response)
          UsersCreditCard.save(
            {id: $scope.user.url_slug, stripeToken: response.id},
            {},
            function(resp){
              console.log("we saved this user's credit card, huzzah!", resp)
              security.refreshCurrentUser() // refresh the currentUser from server
              window.scrollTo(0,0)
              UserMessage.set("settings.subscription.subscribe.success")
              Loading.finish("subscribe")
              TiMixpanel.track("User subscribed!")


            },
            function(resp){
              console.log("failure!", resp)
              UserMessage.set("settings.subscription.subscribe.error")
              Loading.finish("subscribe")
            }
          )
        }
      }
  })


  .controller('emailSettingsCtrl', function ($scope, Users, security, $location, UserMessage, Loading) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
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



