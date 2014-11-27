angular.module('services.profileService', [
  'resources.users'
])
  .factory("ProfileService", function($q,
                                      $timeout,
                                      $location,
                                      Update,
                                      UserMessage,
                                      TiMixpanel,
                                      Product,
                                      Loading,
                                      PinboardService,
                                      ProfileAboutService,
                                      GenreConfigs,
                                      UsersProducts,
                                      ProductsBiblio,
                                      SelfCancellingProductsResource){

    var loading = true
    var data = {
      products:[]
    }

    function getProductStubs(url_slug){
      data.url_slug = url_slug
      UsersProducts.get(
        {id: url_slug, stubs: true},
        function(resp){
          console.log("ProfileService got stubs back", resp)
          data.products = resp.list
        },
        function(resp){
          console.log("stubs call failed", resp)
        }
      )

    }

    function overwriteProduct(newProduct){
      removeProductsLocal([newProduct._tiid])
      data.products.push(newProduct)
    }


    function get(url_slug){
      data.url_slug = url_slug

      if (!data.products){
        getProductStubs(url_slug)
      }

      loading = true
      return SelfCancellingProductsResource.createResource().get(
        {id: url_slug, embedded:false}, // pretend is never embedded for now
        function(resp){
//          _.each(data, function(v, k){delete data[k]})

          data.products.length = 0
          angular.extend(data.products, resp.list)

          // got the new stuff. but does the server say it's
          // actually still updating there? if so, show
          // updating modal
          Update.showUpdateModal(url_slug, resp.is_refreshing).then(
            function(msg){
              console.log("updater (resolved):", msg)
              get(url_slug, true)
            },
            function(msg){
              // great, everything's all up-to-date.
            }
          )
        },

        function(resp){
          console.log("ProfileService got a failure response", resp)
          if (resp.status == 404){
            data.is404 = true
          }
        }

      ).$promise
        .finally(function(resp){ // runs whether succeeds or fails
          Loading.finishPage()
          loading = false
      })
    }

    function removeProductsLocal(tiids){
      _.each(tiids, function(tiid){
        var tiidIndex = getProductIndexFromTiid(tiid)
        data.products.splice(tiidIndex, 1)
      })

    }


    function removeProducts(tiids){
      if (!tiids.length){
        return false
      }

      removeProductsLocal(tiids)
      UserMessage.setStr("Deleted "+ tiids.length +" items.", "success" )

      UsersProducts.delete(
        {id: data.url_slug, tiids: tiids.join(",")},
        function(resp){
          console.log("finished deleting", tiids)
          get(data.url_slug, true)

        }
      )
    }

    function hasFullProducts(){
      if (!data.products){
        return false
      }

      if (data.products[0] && data.products[0].markup){
        return true
      }
    }


    function changeProductsGenre(tiids, newGenre){
      if (!tiids.length){
        return false
      }

      _.each(tiids, function(tiid){
        var productToChange = getProductFromTiid(tiid)
        if (productToChange){
          productToChange.genre = newGenre
        }
      })

      // assume it worked...
      UserMessage.setStr("Moved "+ tiids.length +" items to " + GenreConfigs.get(newGenre, "plural_name") + ".", "success" )

      // save the new genre info on the server here...
      ProductsBiblio.patch(
        {commaSeparatedTiids: tiids.join(",")},
        {genre: newGenre},
        function(resp){
          console.log("ProfileService.changeProductsGenre() successful.", resp)
          get(data.url_slug)
        },
        function(resp){
          console.log("ProfileService.changeProductsGenre() FAILED.", resp)
        }
      )

    }

    function getProductIndexFromTiid(tiid){
      for (var i=0; i<data.products.length; i++ ){
        if (data.products[i].tiid == tiid) {
          return i
        }
      }
      return -1
    }

    function getProductFromTiid(tiid){
      var tiidIndex = getProductIndexFromTiid(tiid)
      if (tiidIndex > -1){
        return data.products[tiidIndex]
      }
      else {
        return null
      }

    }

    function isLoading(){
      return loading
    }

    function getGenreCounts(){
      var counts = _.countBy(data.products, function(product){
        return product.genre
      })
      return counts

    }

    function productByTiid(tiid){
      return _.findWhere(data.products, {tiid: tiid})
    }

    function clear(){
      // from http://stackoverflow.com/questions/684575/how-to-quickly-clear-a-javascript-object
      for (var prop in data) { if (data.hasOwnProperty(prop)) { delete data[prop]; } }
    }






    return {
      data: data,
      loading: loading,
      isLoading: isLoading,
      get: get,
      productByTiid: productByTiid,
      removeProducts: removeProducts,
      changeProductsGenre: changeProductsGenre,
      getGenreCounts: getGenreCounts,
      hasFullProducts: hasFullProducts,
      clear: clear,
      overwriteProduct: overwriteProduct,
      getUrlSlug: function(){
        return data.url_slug
      }
    }
  })



// http://stackoverflow.com/a/24958268
.factory( 'SelfCancellingProductsResource', ['$resource','$q',
function( $resource, $q ) {
  var canceler = $q.defer();

  var cancel = function() {
    canceler.resolve();
    canceler = $q.defer();
  };

  // Check if a username exists
  // create a resource
  // (we have to re-craete it every time because this is the only
  // way to renew the promise)
  var createResource = function() {
    cancel();
    return $resource( '/profile/:id/products',
      {},
      {
        get: {
          method : 'GET',
          timeout : canceler.promise
        }
      });
  };

  return {
    createResource: createResource,
    cancelResource: cancel
  };
}]);

