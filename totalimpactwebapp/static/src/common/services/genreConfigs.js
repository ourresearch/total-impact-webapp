globalGenreConfigs = globalGenreConfigs || []

angular.module("services.genreConfigs", [])
.factory("GenreConfigs", function($http){
    var configs = globalGenreConfigs

    var get = function(name, configKey){

        if (!configs.length){
          return false
        }

        var ret
        if (name){
          var myConfig = _.findWhere(configs, {name: name})
          if (configKey){
            ret = myConfig[configKey]
          }
          else {
            ret = myConfig
          }
        }
        else {
          ret = configs
        }
        return ret
    }

    return {
      get: get,
      getForMove: function(){
        var removeConfigs = [
          "unknown",
          "other"
        ]
        return _.filter(configs, function(myConfig){
          return !_.contains(removeConfigs, myConfig.name)
        })
      },

      getConfigFromUrlRepresentation: function(urlRepresentation){
        var myConfig = _.findWhere(configs, {url_representation: urlRepresentation})
        return myConfig
      },


      getByName: function(genreName){
        return _.findWhere(configs, {name: genreName})
      }
    }

  })