angular.module('services.breadcrumbs', []);
angular.module('services.breadcrumbs').factory('Breadcrumbs', ['$rootScope', '$location', function($rootScope, $location){

  var levels = []

  return {
    set: function(level,obj){ // {text: foo, url: bar}
      levels[level] = obj
    },
    get: function(level, key){ // key is "text" or "url"
      var myLevel = levels[level]
      if (myLevel) {
        return myLevel[key]
      }
      else {
        return undefined
      }
    },
    hasLevel: function(level){
      return !!levels[level]
    },
    clear: function(){
      levels.length = 0
    }

  }
}]);