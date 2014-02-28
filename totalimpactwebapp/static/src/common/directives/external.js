angular.module("directives.external", [])

/*https://github.com/iameugenejo/angular-centered/angular-centered.js*/
.directive("centered", function() {
  return {
		restrict : "ECA",
		transclude : true,
		template : "<div class=\"angular-center-container\">\
						<div class=\"angular-centered\" ng-transclude>\
						</div>\
					</div>"
	};
});
