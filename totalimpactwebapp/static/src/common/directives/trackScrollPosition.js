angular.module("directives.trackScrollPosition", [
  'services.page'
])

angular.module("directives.trackScrollPosition")
.directive("trackScrollPosition", function($window, $location, $anchorScroll, Page){
    return {
      restrict: 'A',
      link: function($scope, elem){
        angular.element($window).bind("scroll", function(event) {
          console.log("setting scrolltop: ", $(window).scrollTop())
          Page.setLastScrollPosition($(window).scrollTop())
        })
      }
    }

  })