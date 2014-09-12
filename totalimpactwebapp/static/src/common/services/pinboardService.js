angular.module('services.pinboardService', [
  'resources.users'
])
  .factory("PinboardService", function($q, $timeout, Update, Page, Users){
    var pins = []

    function pin(type, id){
      var myPin = {
        type: type,
        id: id,
        timestamp: moment.utc().toISOString()
      }
      pins.push(myPin)
    }


    return {
      pins: pins,
      pin: pin
    }


  })