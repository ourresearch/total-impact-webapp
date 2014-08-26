angular.module('resources.products',['ngResource'])

.factory('Products', function ($resource) {

  return $resource(
   "/importer/:importerName",
   {}
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
    "/profile/:user_id/product/:tiid",
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



