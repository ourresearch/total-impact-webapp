angular.module("directives.jQueryPopover", [])
  .directive('jqPopover', function () {
    console.log("jq-popovers loading")
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        console.log("popovers!")

        scope.$on("ngRepeatFinished", function(){
          $("[data-content]").popover({
            html:true,
            trigger:'hover',
            placement:'bottom'
          })
        })
      }
    }
  });