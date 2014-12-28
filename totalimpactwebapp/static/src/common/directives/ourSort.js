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
         console.log("setting sort key by index", newSortKeyIndex)

         OurSortService.setCurrent(newSortKeyIndex)
       }
     }
    }
  });