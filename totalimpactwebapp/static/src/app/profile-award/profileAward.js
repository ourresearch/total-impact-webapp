angular.module('profileAward.profileAward', [])

  .factory('ProfileAward', function() {
    return {
      test: function foo(){}
    }

})

  .controller('ProfileAwardCtrl', function ($scope, ProfileAward) {
    console.log("controller ran")

  })

