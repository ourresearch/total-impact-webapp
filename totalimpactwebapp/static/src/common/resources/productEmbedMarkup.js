angular.module('resources.productEmbedMarkup',['ngResource'])

.factory('ProductEmbedMarkup', function ($resource) {

  return $resource(
    "/product/:tiid/embed-markup",
    {}
  )
})
