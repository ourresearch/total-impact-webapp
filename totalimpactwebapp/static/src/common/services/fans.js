angular.module("services.fansService", [])
.factory("FansService", function(){

    var data = {}
    data.tweetersDict = {}
    data.tweeters = []

    var ui = {}
    ui.perPage = 5
    ui.currentPage = 1
    ui.sortBy = "-about.followers"



    return {
      data: data,
      ui: ui,
      onPageChange: function(newPageNumber){
        ui.currentPage = newPageNumber
      },
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
          var myScreenName = myTweeter.screen_name
          var myTweet = angular.copy(tweet)
          delete myTweet.tweeter

          if (data.tweetersDict[myScreenName]){
            data.tweetersDict[myScreenName].tweets.push(myTweet)
          }
          else {
            data.tweetersDict[myScreenName] = {
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
