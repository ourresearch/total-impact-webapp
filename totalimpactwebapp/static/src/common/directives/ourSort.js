angular.module("directives.ourSort", [])

  .directive("ourSort", function(
    $rootScope,
    $location,
    OurSortService){

    return {
     restrict: 'E',
     templateUrl: 'directives/our-sort.tpl.html',
     link: function(scope, elem, attr, ctrl){

       scope.setSortKey = function(newSortKeyIndex){
         console.log("setting sort key index", newSortKeyIndex)
         OurSortService.setCurrent(newSortKeyIndex)
       }
     }
    }
  })


.factory("OurSortService", function($location){
    var current = {
      name: null,
      key: null,
      urlName: null
    }

    var choices = []

    var setFromUrl = function(){
      var myUrlName = $location.search().sort_by || "default"
      var newChoice = _.findWhere(choices, {urlName: myUrlName})
      angular.extend(current, newChoice)
    }


  return {
    current: current,
    choices: choices,
    setCurrent: function(index){
      var newChoice = choices[index]
      angular.extend(current, newChoice)
      if (newChoice.urlName == "default"){
        $location.search("sort_by", null)
      }
      else {
        $location.search("sort_by", newChoice.urlName)
      }
    },
    setChoices: function(newChoices){
      choices.length = 0
      _.each(newChoices, function(newChoice){
        choices.push(newChoice)
      })

      // finish up by setting the choice from the current URL
      setFromUrl()
    }

  }
});