var analytics = analytics || {};

angular.module('services.tiAnalytics', [
//    'services.page'
  ])
  .run(['$http', function($http) {

    // this is where you'd initialize GA, but segment.io is doing this for us.

}])
  .factory('tiAnalytics', function($window, $location, $routeParams) {

//	$rootScope.$on('$viewContentLoaded', track);



    var getPageType = function(){
      var myPageType = "profile"


      var pageTypeLookupTable = {
        account: [
          "/settings",
          "/reset-password"
        ],
        landing: [
          "/"
        ],
        infopage: [
          "/faq",
          "/about"
        ],
        signup: [
          "/signup"
        ]
      }

      _.each(pageTypeLookupTable, function(urlStartsWithList, pageType){
        var filtered = _.filter(urlStartsWithList, function(x){
           return _($location.path()).startsWith(x)
        })
        if (filtered.length) {
          myPageType = pageType
        }

      })
      return myPageType
    }


    var trackPageLoad = function(){
      analytics.page(getPageType(), $location.path(), {

      })
    }



	
	var convertPathToQueryString = function(path, $routeParams) {
		for (var key in $routeParams) {
			var queryParam = '/' + $routeParams[key];
			path = path.replace(queryParam, '');
		}

		var querystring = decodeURIComponent($.param($routeParams));

		if (querystring === '') return path;

		return path + "?" + querystring;
	};


  return {
    'pageload': trackPageLoad

  }
});