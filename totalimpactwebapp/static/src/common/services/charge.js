angular.module('services.charge', [])
  .factory("Charge", function(){
    var handler = StripeCheckout.configure({
      key: 'pk_test_CR4uaJdje6LJ02H4m6Mdcuor',
      image: '//gravatar.com/avatar/9387b461360eaf54e3fa3ce763c656f4/?s=120&d=mm',
      allowRememberMe: false,
      token: function(token, args) {
        // Use the token to create the charge with a server-side script.
        // You can access the token ID with `token.id`
        console.log("doin' stuff with the token!")
      }
    });


    return {
      open:function(args){
        handler.open(args)
      }
    }




  })