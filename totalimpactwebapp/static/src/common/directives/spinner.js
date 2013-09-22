angular.module("directives.spinner", [])
angular.module("directives.spinner")

  .directive("spinner", function(){
    return {
     restrict: 'E',
     template: '<div class="working help-block" ng-show="isLoading">' +
       '<i class="icon-refresh icon-spin"></i>' +
       '<span class="text">{{ msg }}...</span>' +
       '</div>',
     link: function(scope, elem, attr, ctrl){


       scope.$watch('loading', function(jobs){
          scope.isLoading = jobs[attr.loading]
       }, true)

       if (attr.msg) {
         scope.msg = attr.msg;
       }
       else {
         scope.msg = "Loading"
       }

     }

    }
    })