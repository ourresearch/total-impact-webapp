angular.module("services.genreConfigs", [])
.factory("GenreConfigs", function($http){
    var configs = []

    var load = function(){
      $http.get("/configs/genres")
        .success(function(resp){
          configs = resp
        })
    }



    return {
      load: load,
      get: function(){
        return configs
      },
      getByName: function(genreName){
        return _.findWhere(configs, {name: genreName})
      }
    }

  })