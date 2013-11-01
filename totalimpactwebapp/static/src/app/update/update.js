angular.module( 'update.update', [
    'resources.users'
  ])
  .factory("Update", function($rootScope, $location, UsersProducts, $timeout){

    var updateStatus = {
      numDone: 0,
      numNotDone:0
    }
    var firstCheck = true

    var keepPolling = function(userId, onFinish){
      console.log("here's the onFinish we got, at beginning of keepPolling: ", onFinish)


      if (firstCheck || updateStatus.numNotDone > 0) {
        firstCheck = false
        UsersProducts.query(
          {id: userId},
          function(resp){
            updateStatus.numDone = numDone(resp, true)
            updateStatus.numNotDone = numDone(resp, false)

            console.log("polling: ", updateStatus)
            console.log("here's the onFinish, right after polling:", onFinish)

            $timeout(function(){keepPolling(userId, onFinish)}, 500);
          })
      }
      else {

        onFinish()
      }
    }

    var numDone = function(products, completedStatus){
       console.log("numDone input: ", products)

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


    return {
      update: function(userId, onFinish){
        console.log("here's teh onFinish we get at first: ", onFinish)
        keepPolling(userId, onFinish)
      },
      'updateStatus': updateStatus
    }


  })
