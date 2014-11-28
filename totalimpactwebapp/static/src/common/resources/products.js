angular.module('resources.products',['ngResource'])

.factory('Products', function ($resource) {

  return $resource(
   "/importer/:importerName",
   {}
  )
})

.factory('ProductsBiblio', function ($resource) {

  return $resource(
   "/products/:commaSeparatedTiids/biblio",
   {},
    {
      patch:{
        method: "POST",
        headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'}
      }
    }
  )
})

.factory('ProductBiblio', function ($resource) {

  return $resource(
    "/product/:tiid/biblio",
    {},
    {
      patch:{
        method: "POST",
        headers: {'X-HTTP-METHOD-OVERRIDE': 'PATCH'}
      }
    }
  )
})


.factory("ProductInteraction", function($resource){
  return $resource(
    "/product/:tiid/interaction",
    {}
  )
})




.factory('Product', function ($resource) {

  return $resource(
    "/profile/:id/product/:tiid",
    {},
    {}
  )
})



.factory('ProductWithoutProfile', function ($resource) {

  return $resource(
    "/product/:tiid",
    {},
    {}
  )
})



