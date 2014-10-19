angular.module("services.productList", [])

.factory("ProductList", function(
    $location,
    SelectedProducts,
    GenreConfigs,
    ProfileService){

  var genreChangeDropdown = {}
  var queryDimension
  var queryValue


  var changeProductsGenre = function(newGenre){
    ProfileService.changeProductsGenre(SelectedProducts.get(), newGenre)
    SelectedProducts.removeAll()
    genreChangeDropdown.isOpen = false

    // handle moving the last product in our current genre
    if (!get().length){
      var newGenreUrlRepresentation = GenreConfigs.get(newGenre, "url_representation")
      var currentProfileSlug = ProfileService.getUrlSlug()
      $location.path(currentProfileSlug + "/products/" + newGenreUrlRepresentation)
    }
  }

  var setQuery = function(dimension, value) {
    queryDimension = dimension
    queryValue = value
  }

  var get = function(){
    if (queryDimension == "genre") {
      return ProfileService.productsByGenre(queryValue)
    }
    else {
      return []
    }
  }

  return {
    changeProductsGenre: changeProductsGenre,
    setQuery: setQuery,
    get: get,
    genreChangeDropdown: genreChangeDropdown
  }


})


.factory("SelectedProducts", function(){
  var tiids = []

  return {
    add: function(tiid){
      return tiids.push(tiid)
    },
    addFromObjects: function(objects){
      return tiids = _.pluck(objects, "tiid")
    },
    remove: function(tiid){
      tiids = _.without(tiids, tiid)
    },
    removeAll: function(){
      return tiids.length = 0
    },
    contains: function(tiid){
      return _.contains(tiids, tiid)
    },
    containsAny: function(){
      return tiids.length > 0
    },
    get: function(){
      return tiids
    },
    count: function(){
      return tiids.length
    }
  }
})

.factory("ProductListSort", function($location){

  var configs = [
    {
      keys: ["-awardedness_score", '-metric_raw_sum', 'biblio.title'],
      name: "default",
      urlName: "default"
    } ,
    {
      keys: ["biblio.title", "-awardedness_score", '-metric_raw_sum'],
      name: "title",
      urlName: "title"
    },
    {
      keys: ["-year", "-awardedness_score", '-metric_raw_sum', 'biblio.title'],
      name: "year",
      urlName: "year"
    },
    {
      keys: ["biblio.authors", "-awardedness_score", '-metric_raw_sum', 'biblio.title'],
      name: "first author",
      urlName: "first_author"
    }
  ]

  function getCurrentConfig(){
    var ret
    ret = _.findWhere(configs, {urlName: $location.search().sort_by})
    if (!ret){
      ret = _.findWhere(configs, {urlName: "default"})
    }
    return ret
  }


  return {
    get: getCurrentConfig,
    set: function(name){
      var myConfig = _.findWhere(configs, {name: name})
      if (myConfig.name == "default"){
        $location.search("sort_by", null)
      }
      else {
        $location.search("sort_by", myConfig.urlName)
      }
    },
    options: function(){
      var currentName = getCurrentConfig().name
      return _.filter(configs, function(config){
        return config.name !== currentName
      })
    }
  }
})
