angular.module("services.tiMixpanel", [])
.factory("TiMixpanel", function(){
    var superProperties = {}

    return {
      register: function(obj){
        _.extend(superProperties, obj) // new values win conflicts (overwrite)
        mixpanel.register(obj)
      },
      register_once: function(obj){
        _.defaults(superProperties, obj) // old values win conflicts
        mixpanel.register_once(obj)
      },
      track: function(obj){
        mixpanel.track(obj)
      }
    }

  })