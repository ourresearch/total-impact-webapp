angular.module("directives.tweetThis", [])
  .directive("tweetThis", function($location){
    return {
      restrict: 'E',
      replace: true,
      template: '<a class="tweet-this" href="https://twitter.com/intent/tweet' +
        '?original_referer={{ myUrl }}' +
        '&text={{ textToTweet }}' +
        '&url={{ myUrl }}' +
        '&via=impactstory" ' +
        'tooltip="Tweet it!"' +
        'target="_blank"' +
        'tooltip-placement="left">' +
        '<i class="fa fa-twitter left"></i></a>',
      link: function(scope, elem, attr, ctrl){
        scope.myUrl = encodeURI($location.absUrl())
        attr.$observe('text', function(newVal){
          scope.textToTweet = newVal
        })

      }
    }
  })