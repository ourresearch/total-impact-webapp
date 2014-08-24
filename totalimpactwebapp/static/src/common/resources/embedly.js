angular.module('resources.embedly',['ngResource'])

.factory('Embedly', function ($resource) {

  return $resource(
   "http://api.embed.ly/1/oembed",
   {
     key: "46010d661a874d8ab9d9bdb4da077d03",
     maxwidth: 700,
     width: 700
   }
  )
})