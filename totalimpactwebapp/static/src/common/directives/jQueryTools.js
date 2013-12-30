// only have to use this once per page. could be on the main view i think?

angular.module("directives.jQueryTools", [])
  .directive('jqPopover', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {

        scope.$on("ngRepeatFinished", function(){
          $("[data-content]").popover({
            html:true,
            trigger:'hover',
            placement:'bottom'
          })
        })
      }
    }
  })

  .directive('jqPopover', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {

        scope.$on("ngRepeatFinished", function(){
          $("[data-toggle='tooltip']").tooltip({
            placement:'bottom'
          })
        })
      }
    }
  });