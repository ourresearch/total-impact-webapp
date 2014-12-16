angular.module("directives.tweetThis", [])
  .directive("tweetThis", function($location){
    return {
      restrict: 'E',
      replace: true,
      template: '<a class="tweet-this btn btn-default btn-xs" href="https://twitter.com/intent/tweet' +
        '?original_referer={{ myUrl }}' +
        '&text={{ textToTweet }}' +
        '&url={{ myUrl }}' +
        '&via=impactstory"><i class="fa fa-twitter left"></i>Tweet it</a>',
      link: function(scope, elem, attr, ctrl){
        scope.myUrl = encodeURI($location.absUrl())
        attr.$observe('text', function(newVal){
          scope.textToTweet = newVal
        })

      }
    }
  })