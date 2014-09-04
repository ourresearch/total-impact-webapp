angular.module("genrePage", [
  'resources.users',
  'services.page',
  'ui.bootstrap',
  'security',
  'services.loading',
  'services.timer',
  'services.userMessage'
])

.config(['$routeProvider', function ($routeProvider, security) {

  $routeProvider.when("/:url_slug/products/:genre_name", {
    templateUrl:'genre-page/genre-page.tpl.html',
    controller:'GenrePageCtrl'
  })

}])



.controller('GenrePageCtrl', function (){
  console.log("genre page controller loaded.")


})
