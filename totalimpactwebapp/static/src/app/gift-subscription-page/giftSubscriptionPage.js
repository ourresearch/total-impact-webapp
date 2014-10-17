angular.module( 'giftSubscriptionPage', [
    'security',
    'services.page',
    'services.tiMixpanel'
  ])

  .config(function($routeProvider) {
    $routeProvider

    .when('/buy-subscriptions', {
      templateUrl: 'gift-subscription-page/gift-subscription-page.tpl.html',
      controller: 'giftSubscriptionPageCtrl'
    })
  })

  .controller("giftSubscriptionPageCtrl", function($scope,
                                         $http,
                                         Page,
                                         TiMixpanel,
                                         Loading,
                                         UserMessage) {
    console.log("gift-subscription-page controller ran.")

    Page.setTitle("Donate")


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
          window.scrollTo(0,0)
          UserMessage.set("settings.subscription.subscribe.success")
          Loading.finish("subscribe")
          TiMixpanel.track("User subscribed")


        },
        function(resp){
          console.log("we failed to subscribe a user.", resp)
          UserMessage.set("settings.subscription.subscribe.error")
          Loading.finish("subscribe")
        }
      )
    }

    var donate = function(token){
      console.log("this is where the donate function works. sends this token: ", token)
      $http.post("/donate",
        {stripe_token: token},
        function(resp){}
      )
    }


    $scope.formData = {}
    $scope.cost = function(){
      return $scope.formData.numSubscriptions * 60
    }





    $scope.handleStripe = function(status, response){

      console.log("handleStripe() returned stuff from Stripe:", response)

      Loading.start("donate")
      console.log("in handleStripe(), got a response back from Stripe.js's call to the Stripe server:", status, response)
      if (response.error) {
        console.log("got an error instead of a token.")
        UserMessage.set("settings.subscription.subscribe.error")

      }
      else {
        console.log("yay, Stripe CC token created successfully! Now let's charge the card.")
        donate(response.id)
      }
    }

  })

