angular.module( 'update.update', [
    'emguo.poller',
    'resources.users'
  ])
  .factory("Update", function($modal,
                              UsersUpdateStatus){

    var updateStatus = {}

    var showUpdateModal = function(url_slug){
      UsersUpdateStatus.get({id:url_slug}).$promise.then(
        function(resp) {
          console.log("showUpdateModal", resp)
        }
      )

//      var modalInstance = $modal.open({
//        templateUrl: 'update/update-progress.tpl.html',
//        controller: 'updateProgressModalCtrl',
//        backdrop:"static",
//        keyboard: false
//      });

    }


    return {
      showUpdateModal: showUpdateModal,
      updateStatus: updateStatus
    }
  })
  .controller("updateProgressModalCtrl", function($scope, Update){
    $scope.updateStatus = Update.updateStatus
  })
