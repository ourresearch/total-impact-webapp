angular.module('services.cardService', [
  'resources.users'
])
.factory("CardService", function($q,
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
                                SelfCancellingProfileResource){


    // just copied this from the profileservice,
    // to svae it for now; not sure if/how works.
    function genreCards(genreName, numberOfCards, smallestFirst){
      if (typeof data.genres == "undefined"){
        return []
      }
      else {
        var cardsToReturn
        var myGenre = _.findWhere(data.genres, {name: genreName})
        if (typeof myGenre == "undefined"){
          return []
        }
        var sortedCards = _.sortBy(myGenre.cards, "sort_by")
        if (smallestFirst){
          cardsToReturn = sortedCards
        }
        else {
          cardsToReturn = sortedCards.concat([]).reverse()
        }
        return cardsToReturn.slice(0, numberOfCards)
      }
    }




    return {
      genreCards: genreCards
    }
})