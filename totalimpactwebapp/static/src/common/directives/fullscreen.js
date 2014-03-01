angular.module("directives.fullscreen", [])
  .directive('fullscreen', function () {
    return {
      restrict: 'A',
      link: function (scope, elem, attr) {
        var viewportHeight = $(window).height()
        $(elem).height(viewportHeight)

      }
    }
  })