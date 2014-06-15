angular.module("services.tiMixpanel", [])
.factory("TiMixpanel", function($cookieStore, $q, $timeout){

    var getFromCookie = function(keyToGet){
      var deferred = $q.defer()
      if (_.isUndefined(mixpanel.cookie)){
        $timeout(
          function(){return getFromCookie(keyToGet)},
          1
        )
      }
      else {
        deferred.resolve(mixpanel.cookie.props[keyToGet])
      }
      return deferred.promise
    }

    return {

      // purely wrappers around mixpanel methods

      track: function(obj){
        return mixpanel.track(obj)
      },
      alias: function(myAlias){
        return mixpanel.alias(myAlias)
      },
      identify: function(myId){
        return mixpanel.alias(myId)
      },
      register: function(obj){
        return mixpanel.register(obj)
      },
      registerOnce: function(obj){
        return mixpanel.register_once(obj)
      },
      clearCookie: function(){
        return mixpanel.cookie.clear()
      },



      // methods just for tiMixpanel, not wrappers around mixpanel methods.

      get: getFromCookie
    }

  })