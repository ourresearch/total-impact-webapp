angular.module("services.fansService", [])
.factory("FansService", function(){

    var data = {}
    data.tweetersDict = {}
    data.tweeters = []


    return {
      data: data,
      setTweets: function(tweets){
        console.log("trying to set tweets", tweets)
        var flatTweetsList = []
        _.each(tweets, function(tweetsForThisProduct, tiid){

          _.each(tweetsForThisProduct, function(tweet){
            tweet.tiid = tiid
            flatTweetsList.push(tweet)
          })
        })

        _.each(flatTweetsList, function(tweet){
          var myTweeter = tweet.tweeter
          var tweeterKey = myTweeter.twitter_id

          var myTweet = angular.copy(tweet)
          delete myTweet.tweeter

          if (data.tweetersDict[tweeterKey]){
            data.tweetersDict[tweeterKey].tweets.push(myTweet)
          }
          else {
            data.tweetersDict[tweeterKey] = {
              about: myTweeter,
              tweets: [myTweet]
            }
          }
        })
        data.tweeters = _.values(data.tweetersDict)

        _.each(data.tweeters, function(tweeter){
          tweeter.about.numTweets = tweeter.tweets.length
        })

      }

    }

  })
