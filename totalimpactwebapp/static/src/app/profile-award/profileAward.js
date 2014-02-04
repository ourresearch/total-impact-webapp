<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
angular.module('profileAward.profileAward', [])
=======
angular.module('profileAward', [])
>>>>>>> Stashed changes
=======
angular.module('profileAward', [])
>>>>>>> Stashed changes
=======
angular.module('profileAward', [])
>>>>>>> Stashed changes

  .factory('ProfileAward', function() {
    return {
      test: function foo(){}
    }

})

  .controller('ProfileAwardCtrl', function ($scope, ProfileAward) {
    console.log("controller ran")

  })

