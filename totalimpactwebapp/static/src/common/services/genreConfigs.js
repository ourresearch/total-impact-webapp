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

          if (!myConfig){ // this genre is not in the configs
            myConfig = getDefaultConfig(name)
          }

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

    function getDefaultConfig(genreName){
      var myPlural = genreName + "s"
      return {
        name: genreName,
        icon: "icon-file-alt",
        plural_name: myPlural,
        url_representation: myPlural.replace(" ", "_")

      }
    }

    function getDefaultConfigFromUrlRepresentation(genreUrlRepresentation){
      var myName = genreUrlRepresentation.replace(/s$/, "")
      return {
        name: myName,
        icon: "icon-file-alt",
        plural_name: myName + "s",
        url_representation: genreUrlRepresentation

      }
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

        if (!myConfig){ // this genre is not in the configs
          myConfig = getDefaultConfigFromUrlRepresentation(urlRepresentation)
        }

        return myConfig
      },


      getByName: function(genreName){
        return _.findWhere(configs, {name: genreName})
      }
    }

  })