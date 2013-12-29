angular.module("tips", ['ngResource'])
.factory("TipsResource", function($resource){

    return $resource(
      '/user/:slug/tips',
      {},
      {
        delete: {
          method: "DELETE",
          headers: {'Content-Type': 'application/json'}
        }
      }
    )
})

.factory("TipsService", function($interpolate, TipsResource){

  var whitelist = []
  var url_slug

  var tipDefaults = {
    status: 'success'
  }

  var getTips = function(url_slug){
    return [
      {
        id: "how_we_found_these_blog_posts",
        msg: "We’ve imported some of your most-tweeted posts. You can click a post to remove it, or click "
          + "<a href='/"
          + url_slug
          + "/products/add'><i class='icon-upload'></i>import</a> to add more."
      },

      {
        id: "how_we_found_these_tweets",
        msg: "We’ve imported some of your most popular tweets. You can click their badges to remove tweets, or <a href='/user/"
          + url_slug
          + "/products/add'><i class='icon-upload'></i>import</a> to add more."
      },

      {
        id: 'upload_wordpress_key',
        msg: '<a href="/settings/linked-accounts">Link your wordpress.com account</a> to see page view metrics for this blog!',
        status: 'warning'
      },

      {
        id: 'you_can_change_your_url',
        msg: 'dude, have you seriously not changed you url yet?'
      }
    ]
  }


  return {
    'get': function(key, tipProperty){

      var ret
      if (_.contains(whitelist, key)){
        var tips = getTips(url_slug)
        var tip = _.findWhere(tips, {id: key})
        var tipWithDefaults = _.defaults(tip, tipDefaults)
        ret = tipWithDefaults[tipProperty]
      }
      else {
        ret = null
      }

      return ret

    },

    keysStr: function(){
      return _.pluck(getTips(url_slug), "id").join()
    },

    clear: function(){
      whitelist.length = 0
    },

    load: function(url_slug_arg){
      if (!url_slug_arg) return false // user is probably mid-login

      url_slug = url_slug_arg // set factory-level var

      TipsResource.get({slug: url_slug}, function(resp){
        whitelist = resp.ids
      })
    },


    remove: function(id){
      whitelist = _.without(whitelist, id)
      TipsResource.delete(
        {slug: url_slug},
        {'id': id},
        function(resp){
          console.log("we deleted a thing!", resp)
        }

      )
    }
  }
})

.directive("tip", function(TipsService, $parse){

    return {
      templateUrl: 'tips/tip.tpl.html',
      restrict: 'E',
      scope: {
        key: "=key" // linked to attr, evaluated in parent scope
      },
      link: function(scope, elem, attrs){

        scope.getStatus = function(){
          return TipsService.get(scope.key, 'status')
        }

        scope.getMsg = function(){
          return TipsService.get(scope.key, 'msg')
        }


        scope.dismiss = function() {
          console.log("dismissing tip", scope.key)
          return TipsService.remove(scope.key)
        }




      }
    }

})