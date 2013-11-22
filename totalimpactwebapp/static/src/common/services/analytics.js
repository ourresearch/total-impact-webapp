var _gaq = _gaq || [];

angular.module('analytics', []).run(['$http', function($http) {

    // this is where you'd initialize GA, but segment.io is doing this for us.

}])
  .service('analytics', function($rootScope, $window, $location, $routeParams) {

	$rootScope.$on('$viewContentLoaded', track);

	var track = function() {
		var path = convertPathToQueryString($location.path(), $routeParams)
		$window._gaq.push(['_trackPageview', path]);
	};
	
	var convertPathToQueryString = function(path, $routeParams) {
		for (var key in $routeParams) {
			var queryParam = '/' + $routeParams[key];
			path = path.replace(queryParam, '');
		}

		var querystring = decodeURIComponent($.param($routeParams));

		if (querystring === '') return path;

		return path + "?" + querystring;
	};
});