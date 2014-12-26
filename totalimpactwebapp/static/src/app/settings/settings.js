angular.module('settings', [
    'resources.users',
    'services.loading',
    'update.update',
    'directives.spinner',
    'settings.pageDescriptions',
    'services.userMessage',
    'services.tiMixpanel',
    'security',
    'angularPayments',
    'directives.forms'])

  .config(function ($routeProvider) {

    $routeProvider.when('/settings/:page',
      {
        templateUrl:'settings/settings.tpl.html',
        controller: "settingsCtrl",
        resolve:{
          currentUser:function (security) {
            var currentUser = security.requestCurrentUser()
            console.log("checking the current user in /settings/:page resolve", currentUser)
            return currentUser
          }
        }
      }
    )
  })

  .controller('settingsCtrl', function ($scope,
                                        $location,
                                        currentUser,
                                        SettingsPageDescriptions,
                                        ProfileAboutService,
                                        ProfileProducts,
                                        $routeParams,
                                        Page,
                                        Loading) {

    if (currentUser || $routeParams.page === "subscription"){
      var currentPageDescr = SettingsPageDescriptions.getDescrFromPath($location.path());
      $scope.include =  currentPageDescr.templatePath;
    }
    else {
      console.log("there ain't no current user; redirecting to landing page.")
      $location.path("/")
    }

    $scope.authenticatedUser = currentUser;
    $scope.pageDescriptions = SettingsPageDescriptions.get();

    Page.setName("settings")
    $scope.resetUser = function(){
      $scope.user = angular.copy(currentUser)
    }
    $scope.loading = Loading
    $scope.home = function(){
      $location.path('/' + currentUser.url_slug);
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

    $scope.resetUser()
    Loading.finish()





  })

  .controller('profileSettingsCtrl', function ($scope, Users, security, UserMessage, Loading, ProfileAboutService) {
    $scope.onSave = function() {

      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.url_slug},
        {about: $scope.user},
        function(resp) {
          ProfileAboutService.get($scope.user.url_slug)
          security.setCurrentUser(resp.about) // update the current authenticated user.
          UserMessage.set('settings.profile.change.success');
          $scope.home();
        }
      )
    };
  })


  .controller('NotificationsSettingsCtrl', function ($scope, Users, security, UserMessage, Loading, ProfileAboutService) {
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
          ProfileAboutService.get($scope.user.url_slug)

          UserMessage.set(messageKey);
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
          UserMessage.set('settings.password.change.success');
          $scope.home()
        },
        function(resp) {
          UserMessage.set('settings.password.change.error.unauthenticated', true);
          Loading.finish('saveButton')
          $scope.resetUser();  // reset the form
          $scope.wrongPassword = true;
          scroll(0,0)
        }
      )
    };
  })



  .controller('urlSettingsCtrl', function ($scope, Users, security, $location, UserMessage, Loading, ProfileAboutService) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.id, id_type:"id"},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          ProfileAboutService.get($scope.user.url_slug)

          UserMessage.set('settings.url.change.success');
          $location.path('/' + resp.about.url_slug)
        }
      )
    };
  })

  .controller('EmbedSettingsCtrl', function ($scope, $location, Users, security, $location, UserMessage, Loading) {

    var baseUrl = $location.protocol() + "://"
    baseUrl += $location.host()
    if ($location.port() === 5000){ // handle localhost special
      baseUrl += (":5000")
    }
    $scope.baseUrl = baseUrl
  })



  .controller('subscriptionSettingsCtrl', function ($scope,
                                                    Users,
                                                    security,
                                                    $location,
                                                    UserMessage,
                                                    Loading,
                                                    TiMixpanel,
                                                    ProfileAboutService,
                                                    ProfileProducts,
                                                    PinboardService,
                                                    UsersSubscription) {


    // important! this is how we get stuff out of the form from here
    $scope.subscribeForm = {
      plan: "base-yearly",
      coupon: null
    }

    $scope.isTrialing = function(){
      return security.getCurrentUser("is_trialing")
    }

    $scope.isSubscribed = function(){
      return security.getCurrentUser("is_subscribed")
    }

    $scope.isLive = function(){
      return security.getCurrentUser("is_live")
    }


    $scope.daysLeftInTrial = function(){
      return security.getCurrentUser("days_left_in_trial")
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
          ProfileAboutService.get($scope.user.url_slug)

          UserMessage.set("settings.subscription.delete.success")

          // @todo refresh the page
        },
        function(resp){
          console.log("there was a problem; subscription not cancelled", resp)
        }
      )
    }

    var subscribeUser = function(url_slug, plan, token, coupon) {
      console.log("running subscribeUser()", url_slug, plan, token, coupon)
      return UsersSubscription.save(
        {id: url_slug},
        {
          token: token,
          plan: plan,
          coupon: coupon
        },
        function(resp){
          console.log("we subscribed a user, huzzah!", resp)
          security.refreshCurrentUser() // refresh the currentUser from server
          ProfileAboutService.get($scope.user.url_slug).then(
            function(){
              ProfileProducts.get($scope.user.url_slug)
              PinboardService.get($scope.user.url_slug, true)

              window.scrollTo(0,0)
              UserMessage.set("settings.subscription.subscribe.success")
              Loading.finish("subscribe")
            }
          )

          TiMixpanel.track("User subscribed")


        },
        function(resp){
          console.log("we failed to subscribe a user.", resp)
          UserMessage.set("settings.subscription.subscribe.error", true)
          Loading.finish("subscribe")
        }
      )
    }

    $scope.handleStripe = function(status, response){

      console.log("handleStripe() returned stuff from Stripe:", response)

      Loading.start("subscribe")
      console.log("in handleStripe(), got a response back from Stripe.js's call to the Stripe server:", status, response)
      if (response.error && !$scope.subscribeForm.coupon) {

        console.log("got an error instead of a token, and there ain't no coupon to fall back on.")
        UserMessage.set("settings.subscription.subscribe.error")

      }

      else if (response.error && $scope.subscribeForm.coupon){
        console.log("got an error instead of a token--but that's ok, we've got a coupon!")
        subscribeUser($scope.user.url_slug, $scope.subscribeForm.plan, null, $scope.subscribeForm.coupon)
      }

      else {
        console.log("yay, Stripe CC token created successfully! Now let's save the card.")
        subscribeUser($scope.user.url_slug, $scope.subscribeForm.plan, response.id, $scope.subscribeForm.coupon)

      }
    }
  })


  .controller('emailSettingsCtrl', function ($scope, Users, security, $location, UserMessage, Loading, ProfileAboutService) {

     $scope.onSave = function() {
      Loading.start('saveButton')
      Users.patch(
        {id: $scope.user.url_slug, log:"changing email from settings"},
        {about: $scope.user},
        function(resp) {
          security.setCurrentUser(resp.about) // update the current authenticated user.
          ProfileAboutService.get($scope.user.url_slug)

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



