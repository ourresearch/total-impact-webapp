// mostly copped from
// http://stackoverflow.com/a/15208347/226013


angular.module("directives.onRepeatFinished", [])
  .directive('onRepeatFinished', function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        if (scope.$last === true) {
          $timeout(function () {
            scope.$emit('ngRepeatFinished');
          });
        }
      }
    }
  });