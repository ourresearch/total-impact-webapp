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
    var isCrunching = false

    var clearServiceVariables = function(){
      status = {}
      url_slug = null
      deferred = null
      modalInstance = null
    }

    var tick = function(){
      UsersUpdateStatus.get({id:url_slug}).$promise.then(
        function(resp){
          console.log("tick() got /refresh-status response back from server", resp)
          status = resp

          if (resp.refresh_state == "progress bar") {
              $timeout(tick, pollingInterval)
          }
          else if (resp.refresh_state == "crunching") {
              // there could be a bunch of different refresh states, ignoring them for now
              // just telling crunching for all post-100% refresh states
              console.log("tick() is at 100% progress bar complete, now crunching numbers")
              status.isCrunching = true
              $timeout(tick, pollingInterval)
          }
          else if (resp.refresh_state == "all done") {
            console.log("tick() is at all done"),
            modalInstance.close()
            deferred.resolve("Update finished!")
            clearServiceVariables()
          } 

        },
        function(resp){
          console.log("failed to get /refresh-status; trying again.", resp)
          $timeout(tick, pollingInterval)
        }
      )
    }

    var showUpdateModal = function(url_slug_arg, profile_is_refreshing){
      deferred = $q.defer()
      url_slug = url_slug_arg

      if (!profile_is_refreshing){
        deferred.reject("Everything is already up to date.")
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
      isCrunching: function(){
        return status.isCrunching
      }
    }
  })
  .controller("updateProgressModalCtrl", function($scope, Update){
    $scope.status = Update
  })
