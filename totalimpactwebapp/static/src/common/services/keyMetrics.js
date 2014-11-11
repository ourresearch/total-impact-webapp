angular.module('services.keyMetrics', [
  'resources.users',
  'services.pinboard'
])
  .factory("KeyMetrics", function(ProfileKeyMetrics, Pinboard, security){
    var data = {list:[]}
    var ret = Pinboard.makeInterface(data, ProfileKeyMetrics)

    return ret
  })
