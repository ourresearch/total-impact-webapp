angular.module("services.tiMixpanel", [])
.factory("TiMixpanel", function($cookieStore){
    var superProperties = {}

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



      // methods just for tiMixpanel, not wrappers around mixpanel methods.

      get: function(keyToGet){
        var mixpanelCookie = $cookieStore.get("mp_impactstory")
        if (mixpanelCookie && _.has(mixpanelCookie, keyToGet)){
          return mixpanelCookie[keyToGet]
        }
        else {
          return undefined
        }
      },
      clear: function(){
        for (var k in superProperties) delete superProperties[k];
        return true
      }
    }

  })