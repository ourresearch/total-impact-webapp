angular.module("services.fansService", [])
.factory("FansService", function(){

    var data = {}
    data.tweetersDict = {}



    data.foo = "bar!"





    return {
      data: data,
      setTweets: function(tweets){
        console.log("trying to set tweets", tweets)
        var flatTweetsList = []
        _.each(tweets, function(tweetsForThisProduct, tiid){

          console.log("tweets for this product", tiid, tweetsForThisProduct)

          _.each(tweetsForThisProduct, function(tweet){
            tweet.tiid = tiid
            flatTweetsList.push(tweet)
          })
        })

        data.tweets = flatTweetsList

      }

    }

  })
