angular.module( 'update.update', [
    'emguo.poller',
    'resources.users'
  ])
  .factory("Update", function($modal,
                              $timeout,
                              $q,
                              poller,
                              UsersUpdateStatus){

    var status = {}
    var modalInstance
    var pollingInterval = 100
    var deferred = $q.defer()

    var tick = function(url_slug){
      UsersUpdateStatus.get({id:url_slug}).$promise.then(function(resp){
          if (resp.percent_complete == 100){
            deferred.resolve("Update finished!")
            modalInstance.close()
          }
          else {
            $timeout(tick, pollingInterval)
          }
        }
      )
    }

    var showUpdateModal = function(url_slug){

      UsersUpdateStatus.get({id:url_slug}).$promise.then(
        function(resp) {
          console.log("showUpdateModal", resp)
          status = resp

          if (status.percent_complete < 100){
            // open the modal
            modalInstance = $modal.open({
              templateUrl: 'update/update-progress.tpl.html',
              controller: 'updateProgressModalCtrl',
              backdrop:"static",
              keyboard: false
            });

            // start polling
            tick(url_slug)
          }
          else {
            // nothing to see here, this profile is all up to date.
            deferred.reject("Everything is already up to date.")
          }
        }
      )

      return deferred.promise

    }




    return {
      showUpdateModal: showUpdateModal,
      status: function(){
        return status
      }
    }
  })
  .controller("updateProgressModalCtrl", function($scope, Update){
    $scope.update = Update
  })
