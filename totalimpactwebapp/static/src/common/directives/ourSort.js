angular.module("directives.ourSort", [])

  .directive("ourSort", function(){
    return {
     restrict: 'E',
     templateUrl: 'directives/our-sort.tpl.html',
     link: function(scope, elem, attr, ctrl){
       console.log("looks like the ourSort thing done ran!")

     }

    }
    });