angular.module( 'update.update', [
    'emguo.poller',
    'resources.users'
  ])
  .factory("Update", function($modal,
                              $timeout,
                              $q,
                              poller,
                              UsersProducts,
                              UsersUpdateStatus){

    var status = {}
    var url_slug
    var modalInstance
    var pollingInterval = 10  // 10ms...as soon as we get server resp, ask again.
    var deferred
    var isDeduping

    var clear = function(){
      status = {}
      url_slug = null
      deferred = null
      modalInstance = null
    }

    var tick = function(){
      UsersUpdateStatus.get({id:url_slug}).$promise.then(
        function(resp){
          console.log("tick() got /refresh_status response back from server", resp)
          status = resp
          if (resp.percent_complete == 100){
            console.log("tick() satisfied success criteria, calling dedup")
            status.isDeduping = true
            UsersProducts.dedup({id: url_slug}, {}).$promise.then(
              function(resp){
                console.log("dedup successful!", resp)
              },
              function(resp){
                console.log("dedup failed :(", resp)
              }
            ).finally(function(resp){
                console.log("cleaning up after dedup"),
                modalInstance.close()
                deferred.resolve("Update finished!")
                clear()
            })
          }

          else {
            $timeout(tick, pollingInterval)
          }
        },
        function(resp){
          console.log("failed to get /refresh_status; trying again.", resp)
          $timeout(tick, pollingInterval)
        }
      )
    }

    var showUpdateModal = function(url_slug_arg, profile_is_refreshing){
      deferred = $q.defer()
      url_slug = url_slug_arg

      if (!profile_is_refreshing) 
        deferred.reject("Everything is already up to date.")  {
        return deferred.promise
      }

      if (modalInstance){
        // we can only have one modal instance running at once...otherwise, it breaks.
        deferred.reject("there's already an update modal up.")
        return deferred.promise
      }

      modalInstance = $modal.open({
        templateUrl: 'update/update-progress.tpl.html',
        controller: 'updateProgressModalCtrl',
        backdrop:"static",
        keyboard: false
      });

      // start polling
      tick()

      return deferred.promise
    }



    return {
      showUpdateModal: showUpdateModal,
      status: status,
      getPercentComplete: function(){
        return status.percent_complete
      },
      getNumComplete: function(){
        return status.num_complete
      },
      getNumUpdating: function() {
        return status.num_refreshing
      },
      isDeduping: function(){
        return status.isDeduping
      }
    }
  })
  .controller("updateProgressModalCtrl", function($scope, Update){
    $scope.status = Update
  })
