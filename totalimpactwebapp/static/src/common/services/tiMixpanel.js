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

      track: function(event, obj){
        return mixpanel.track(event, obj)
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
    registerFromUserObject: function(userObject){
      if (!userObject){
        return false
      }

      var keysToRegister = [
        "created",
        "email",
        "given_name",
        "is_advisor",
        "last_email_sent",
        "last_viewed_profile",
        "products_count",
        "surname",
        "url_slug"
      ]

      var activeLinkedAccountServices = _.map(
        userObject.linked_accounts,
        function(linkedAccount){
          if (linkedAccount.username){
            return linkedAccount.service
          }
          else {
            return false
          }
      })

      var objToRegister = _.pick(userObject, keysToRegister)
      objToRegister.linkedAccounts = _.compact(activeLinkedAccountServices).join(",")
      mixpanel.register(objToRegister)

      return true
    },


      get: getFromCookie
    }

  })