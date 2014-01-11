// only have to use this once per page. could be on the main view i think?

angular.module("directives.jQueryTools", [])
  .directive('jqPopover', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        $("body").popover({
          html:true,
          trigger:'hover',
          placement:'bottom',
          selector: "[data-content]"
        })
      }
    }
  })

  .directive('jqTooltip', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        $("body").tooltip({
          placement:'bottom',
          selector: "[data-toggle='tooltip']"
        })
      }
    }
  });