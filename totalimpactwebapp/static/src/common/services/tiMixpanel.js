angular.module("services.tiMixpanel", [])
.factory("TiMixpanel", function($cookieStore){
    var superProperties = {
      local: {},
      user: {}
    }
    var currentUser = "anon"

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


      // wrappers around mixpanel methods, that also maintain (essentially) a
      // shadow version of the mixpanel cookie so we can access it easier

      register: function(obj){
        _.extend(superProperties, obj) // new values win conflicts (overwrite)
        $cookieStore.set("tiMixpanel", superProperties)
        return mixpanel.register(obj)
      },
      registerOnce: function(obj){
        _.defaults(superProperties, obj) // old values win conflicts
        return mixpanel.register_once(obj)
      },
      registerOnceRandom: function(key, potentialValues){
        if (typeof superProperties[key] === "undefined") {
          var sampled = _.sample(potentialValues)

          var objToRegister = {}
          objToRegister[key] = sampled
          mixpanel.register_once(objToRegister)
          return sampled
        }
        else {
          // this key has already been set, leave it alone.
          return false
        }
      },


      // methods just for tiMixpanel, not wrappers around mixpanel methods.

      get: function(key){
        return superProperties[key]
      },
      clear: function(){
        for (var k in superProperties) delete superProperties[k];
        return true
      }
    }

  })