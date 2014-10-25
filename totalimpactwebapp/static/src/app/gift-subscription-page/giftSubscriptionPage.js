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
    Page.setTitle("Buy subscriptions")
    var calculateCost = function(numSubscriptions){
      return numSubscriptions * 60
    }

    var donate = function(token){
      console.log("this is where the donate function works. sends this token: ", token)
      $http.post("/donate",
        {stripe_token: token},
        function(resp){}
      )
    }

    var clearForm = function(){
      $scope.formData = {}
      $scope.name = null
      $scope.number = null
      $scope.expiry = null
      $scope.cvc = null
    }


    var buyCoupons = function(stripeToken){
      console.log("buying teh coupons.")
      $http.post(
        "/coupons",
        {
          stripeToken: stripeToken,
          cost:calculateCost($scope.formData.numSubscriptions),
          email: $scope.formData.email
        })
      .success(
        function(resp){
          console.log("we done bought us some coupons!", resp)
          window.scrollTo(0,0)
          UserMessage.setStr("Success! Check your email for your coupon code.", "success")
          Loading.finish("subscribe")
        })
      .error(
        function(resp){
          console.log("buyCoupons() fail")
          UserMessage.setStr("Sorry, something went wrong with your order!", "danger")
      })
      .finally(function(resp){
        clearForm()
      })
    }

    $scope.formData = {}
    $scope.cost = function(){
      return calculateCost($scope.formData.numSubscriptions)
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
        buyCoupons(response.id)
      }
    }

  })

