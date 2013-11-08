angular.module( 'update.update', [
    'resources.users'
  ])
  .factory("Update", function($rootScope, $location, UsersProducts, $timeout, $modal){

    var updateStatus = {}

    var keepPolling = function(url_slug, onFinish){


      if (updateStatus.numNotDone > 0 || _.isNull(updateStatus.numNotDone)) {
        UsersProducts.query(
          {id: url_slug, idType:"url_slug"},
          function(resp){
            updateStatus.numDone = numDone(resp, true)
            updateStatus.numNotDone = numDone(resp, false)
            updateStatus.percentComplete = updateStatus.numDone * 100 / (updateStatus.numDone + updateStatus.numNotDone)

            $timeout(function(){keepPolling(url_slug, onFinish)}, 500);
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

    var update = function(url_slug, onFinish){
      // reset the updateStatus var defined up in the factory scope.
      updateStatus.numDone = null
      updateStatus.numNotDone = null
      updateStatus.percentComplete = null

      var modal = $modal.open({
        templateUrl: 'update/update-progress.tpl.html',
        controller: 'updateProgressModalCtrl',
        backdrop:"static",
        keyboard: false
      });

      keepPolling(url_slug, function(){
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
