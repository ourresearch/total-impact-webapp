angular.module('services.profileProducts', [
  'resources.users'
])
  .factory("ProfileProducts", function($q,
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
                                      FansService,
                                      ProductsBiblio,
                                      SelfCancellingProfileTweetsResource,
                                      SelfCancellingProductsResource){

    var loading = true
    var data = {
      products:[],
      tweets: [],
      hasTweets: false
    }

    function getProductStubs(url_slug){
      data.url_slug = url_slug
      return UsersProducts.get(
        {id: url_slug, stubs: true},
        function(resp){
          console.log("ProfileProducts got stubs back", resp)
          data.products = resp.list
        },
        function(resp){
          console.log("stubs call failed", resp)
        }
      ).$promise

    }

    function overwriteProduct(newProduct){
      removeProductsLocal([newProduct._tiid])
      data.products.push(newProduct)
    }

    function appendToProduct(tiid, key, val){
      _.each(data.products, function(product){
        if (product.tiid === tiid){
          product[key] = val
        }
      })
    }


    function getTweets(url_slug){
      console.log("getting tweets")
      return SelfCancellingProfileTweetsResource.createResource().get(
        {id: url_slug},
        function(resp){
          Loading.finish("tweets")

          // the Fans service needs the latest set of tweets.
          data.tweets = resp.tweets
          data.hasTweets = !_.isEmpty(resp.tweets)

          FansService.setTweets(resp.tweets)
        }
      ).$promise
    }


    function get(url_slug){
      data.url_slug = url_slug
      Loading.start("tweets")


      if (!data.products || !data.products.length){
        getProductStubs(url_slug)
          .then(function(resp){
            return getTweets(url_slug)
          })
          .then(function(tweetsResp){
            console.log("in profileService.get(), got tweets back", tweetsResp)
            _.each(data.products, function(product){
              var myTweets = tweetsResp.tweets[product.tiid]
              if (typeof myTweets === "undefined") {
                myTweets = []
              }
              product.tweets = myTweets
            })
          })
      }

      loading = true
      return SelfCancellingProductsResource.createResource().get(
        {id: url_slug, embedded:false}, // pretend it's never embedded, for now
        function(resp){
            console.log("in profileService.get(), got ProductsResource() data back", resp)

          if (!data.products){
            data.products = []
          }

          _.each(resp.list, function(newProduct){
            var oldProduct = getProductFromTiid(newProduct.tiid)
            if (!oldProduct){
              data.products.push(newProduct)
            }
            else {
              angular.extend(oldProduct, newProduct)
            }
          })


          // got the new stuff. but does the server say it's
          // actually still updating there? if so, show
          // updating modal
          Update.showUpdateModal(url_slug, resp.is_refreshing).then(
            function(msg){
              console.log("in profileService.get(), Update.showUpdateModal() resolved its promise: '" + msg + "'")

              // our old products list probably has duplicates in it. ditch it.
              data.products.length = 0
              get(url_slug)
            },
            function(msg){
              console.log("in profileService.get(), Update.showUpdateModal() rejected its promise: '" + msg + "'")
              // great, everything's all up-to-date.
            }
          )
        },

        function(resp){
          console.log("ProfileProducts got a failure response", resp)
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
          console.log("ProfileProducts.changeProductsGenre() successful.", resp)
        },
        function(resp){
          console.log("ProfileProducts.changeProductsGenre() FAILED.", resp)
        }
      )

    }

    function getProductIndexFromTiid(tiid){

      if (!data.products){
        return -1
      }

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

    function getTitleFromTiid(tiid){
      var myProduct = getProductFromTiid(tiid)
      if (myProduct) {
        return myProduct.title
      }
    }
    function gen(tiid){
      var myProduct = getProductFromTiid(tiid)
      if (myProduct) {
        return myProduct.title
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
      getProductFromTiid: getProductFromTiid,
      getTitleFromTiid: getTitleFromTiid,
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
}])


// http://stackoverflow.com/a/24958268
// copied straight from above; refactor if we make a third one of these.
.factory( 'SelfCancellingProfileTweetsResource', ['$resource','$q',
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
    return $resource( '/profile/:id/products/tweets',
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

