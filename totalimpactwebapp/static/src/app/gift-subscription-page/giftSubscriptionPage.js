angular.module( 'giftSubscriptionPage', [
    'security',
    'services.page',
    'services.tiMixpanel'
  ])

  .config(function($routeProvider) {
    $routeProvider

    .when('/buy-subscriptions', {
      templateUrl: 'gift-subscription-page/gift-subscription-page.tpl.html',
      controller: 'landingPageCtrl'
    })
  })

  .controller("giftSubscriptionPageCtrl", function(){
    console.log("gift-subscription-page controller ran.")
  })