angular.module('services.profileService', [
  'resources.users'
])
  .factory("ProfileService", function($q,
                                      $timeout,
                                      Update,
                                      Page,
                                      UserMessage,
                                      TiMixpanel,
                                      Product,
                                      PinboardService,
                                      ProfileAboutService,
                                      Users){

    var loading = true
    var data = {}


    function get(url_slug, getFromServer){
      console.log("calling ProfileService.get() with", url_slug)

      if (data && !getFromServer && !loading){
        return $q.when(data)
      }

      PinboardService.get(url_slug)

      loading = true
      return Users.get(
        {id: url_slug, embedded: Page.isEmbedded()},
        function(resp){
          console.log("ProfileService got a response", resp)
          profileObj = resp  // cache for future use
          _.each(data, function(v, k){delete data[k]})
          angular.extend(data, resp)
          loading = false


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
          loading = false
        }
      ).$promise
    }

    function removeProduct(product){
      console.log("removing product in profileService", product)
      data.products.splice(data.products.indexOf(product),1)


      UserMessage.set(
        "profile.removeProduct.success",
        false,
        {title: product.display_title}
      )

      // do the deletion in the background, without a progress spinner...
      Product.delete(
        {user_id: data.about.url_slug, tiid: product.tiid},
        function(){
          console.log("finished deleting", product.display_title)
          get(data.about.url_slug, true) // go back to the server to get new data

          TiMixpanel.track("delete product", {
            tiid: product.tiid,
            title: product.display_title
          })
        }
      )
    }


    function isLoading(){
      return loading
    }

    function genreLookup(url_representation){
      if (typeof data.genres == "undefined"){
        return undefined
      }
      else {
        var res = _.findWhere(data.genres, {url_representation: url_representation})
        return res
      }
    }

    function productsByGenre(url_representation){
      if (typeof data.products == "undefined"){
        return undefined
      }
      else {
        var genreCanonicalName = genreLookup(url_representation).name
        var res = _.where(data.products, {genre: genreCanonicalName})
        return res
      }
    }

    function productByTiid(tiid){
      return _.findWhere(data.products, {tiid: tiid})
    }

    function getGenreCard(idObj){

    }

    function getAccountProduct(indexName){
      console.log("calling getAccountProducts")

      if (typeof data.account_products == "undefined"){
        return undefined
      }

      console.log("account_products", data.account_products)

      return _.findWhere(data.account_products, {index_name: indexName})
    }

    function getFromPinId(pinId){ // only for genre pins
      /*
      "genre", :genre_name, "sum", "metric", :provider, :interaction
      "genre", :genre_name, "sum", "engagement", :engagement_type
      */
      if (!data.genres){
        return false
      }

      var cards = []
      _.each(data.genres, function(genre){
        cards.push(genre.cards)
      })

      var flatCards = _.flatten(cards)
      var pinnedCard = _.findWhere(flatCards, {genre_card_address: pinId})
      var myGenreObj = _.findWhere(data.genres, {name: pinnedCard.genre})

      var extraData = {
        genre_num_products: myGenreObj.num_products,
        genre_icon: myGenreObj.icon,
        genre_plural_name: myGenreObj.plural_name,
        genre_url_representation: myGenreObj.url_representation

      }
      return _.extend(pinnedCard, extraData)
    }



    return {
      data: data,
      loading: loading,
      isLoading: isLoading,
      get: get,
      productsByGenre: productsByGenre,
      genreLookup: genreLookup,
      productByTiid: productByTiid,
      removeProduct: removeProduct,
      getAccountProduct: getAccountProduct,
      getFromPinId: getFromPinId
    }


  })