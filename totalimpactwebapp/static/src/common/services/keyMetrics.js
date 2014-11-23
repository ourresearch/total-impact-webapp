angular.module('services.keyMetrics', [
  'resources.users',
  'services.pinboard'
])
  .factory("KeyMetrics", function(ProfileKeyMetrics, Pinboard, Loading){
    var data = {
      name: "KeyMetrics",
      list:[]
    }
    var ret = Pinboard.makeInterface(data, ProfileKeyMetrics)
    return ret
  })
