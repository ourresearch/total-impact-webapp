function TiAnalytics(userDict){
    this.userDict = userDict
    this.init()
}
TiAnalytics.prototype = {
    init: function(){
        that = this
        analytics.ready(function(){
            that.analyticsLoadedCallback.call(that)
        })
        analytics.load(segmentio_key);

    }
    ,getMixpanelId: function(){
        var mixpanelCookie = JSON.parse(
            unescape($.cookie("mp_{{ g.mixpanel_token }}_mixpanel"))
        )
        return mixpanelCookie["distinct_id"]
    }
    ,analyticsLoadedCallback: function(){
        mixpanelId = that.getMixpanelId()
        if (tiUserIsLoggedIn) {
            this.userIsLoggedIn()
        }
        else {
            this.userIsNotLoggedIn(mixpanelId)
        }
    }
    ,userIsLoggedIn: function() {
        // if on profile page and haven't been here before, make alias call and event
        // alias call needs to be above the identify call below
        if (($.cookie("impactstory_first_loaded_own_profile") == null) &&
            (window.location["href"].indexOf(this.userDict.url_slug) > 1)) {
    
            analytics.alias(this.userDict.id)
            analytics.track("First Loaded own profile")
            $.cookie("impactstory_first_loaded_own_profile", 1)
        }
    
        analytics.identify(this.userDict.id, {
            firstName               : this.userDict.given_name,
            lastName                : this.userDict.surname,
            account_created         : this.userDict.created + 0, //+0 says is utc
            last_viewed_profile     : this.userDict.last_viewed_profile + 0, //+0 says is utc
            url_slug                : this.userDict.url_slug,
            email                   : this.userDict.email
        });
    }
    ,userIsNotLoggedIn: function(mixpanelId){
        analytics.identify(mixpanelId)

        // send one event the first time a user comes to our site, no matter which page
        if ($.cookie("impactstory_loaded_a_page") == null) {
            analytics.track("First Loaded a Page", {"url": window.location["href"]})
            $.cookie("impactstory_loaded_a_page", 1)
        }   
    }
}


