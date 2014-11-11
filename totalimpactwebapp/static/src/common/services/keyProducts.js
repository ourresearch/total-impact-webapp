angular.module('services.keyProducts', [
  'resources.users',
  'services.pinboard'
])
.factory("KeyProducts", function(ProfileKeyProducts, Pinboard, security){
    var data = {list:[]}
    var ret = Pinboard.makeInterface(data, ProfileKeyProducts)

    return ret
  })
