angular.module( 'update.update', [
    'resources.users'
  ])
  .factory("Update", function($rootScope, $location, UsersProducts, $timeout, $modal){

    var updateStatus = {
      numDone: null,
      numNotDone: null,
      percentComplete: null
    }
    var firstCheck = true

    var keepPolling = function(userId, onFinish){


      if (firstCheck || updateStatus.numNotDone > 0) {
        firstCheck = false
        UsersProducts.query(
          {id: userId},
          function(resp){
            updateStatus.numDone = numDone(resp, true)
            updateStatus.numNotDone = numDone(resp, false)
            updateStatus.percentComplete = updateStatus.numDone * 100 / (updateStatus.numDone + updateStatus.numNotDone)

            $timeout(function(){keepPolling(userId, onFinish)}, 500);
          })
      }
      else {

        onFinish()
      }
    }

    var numDone = function(products, completedStatus){
       var productsDone =  _.filter(products, function(product){
         return !product.currently_updating
       })

       if (completedStatus) {
         return productsDone.length
       }
       else {
         return products.length - productsDone.length
       }
    };

    var update = function(userId, onFinish){
      var modal = $modal.open({
        templateUrl: 'update/update-progress.tpl.html',
        controller: 'updateProgressModalCtrl',
        backdrop:"static",
        keyboard: false
      });

      keepPolling(userId, function(){
        modal.close()
        onFinish()
      })

    }


    return {
      showUpdate: update,
      'updateStatus': updateStatus
    }
  })
  .controller("updateProgressModalCtrl", function($scope, Update){
    $scope.updateStatus = Update.updateStatus
  })
