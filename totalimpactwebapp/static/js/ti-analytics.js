function TiAnalytics(userDict){
    this.userDict = userDict
    this.init()
}
TiAnalytics.prototype = {
    init: function(){
        that = this
        analytics.ready(function(){
            console.log("loaded all the analytics")
            that.analyticsLoadedCallback.call(that)
        })
        analytics.load(segmentio_key);

    }
    ,getMixpanelId: function(){
        var cookieName = "mp_" + mixpanelKey + "_mixpanel"
        var mixpanelCookie = JSON.parse(unescape($.cookie(cookieName)))

        return mixpanelCookie["distinct_id"]
    }
    ,analyticsLoadedCallback: function(){
        var mixpanelId = that.getMixpanelId()
        var pageType = this.getPageType()

        this.sendPageLoadReport(mixpanelId, pageType)
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
    ,sendPageLoadReport: function(mixpanelId, pageType){
        var referrer_hostname
        var referrer_domain
        try {
            referrer_hostname = document.referrer.split("/")[2]
            referrer_domain = referrer_hostname.split(".").slice(-2).join(".")
        } catch (e) {
            referrer_hostname = ""
            referrer_domain = ""
        }

        var pageLoadObj = {
            url: window.location["href"],
            page_type: pageType,
            referrer_hostname: referrer_hostname,
            referrer_fullname: document.referrer,
            referrer_domain: referrer_domain,
            ga_cookie: $.cookie("_ga"),
            mixpanel_distinct_id: mixpanelId
        }

        if (typeof urlParams !== "undefined") {
            pageLoadObj = _.extend(pageLoadObj, urlParams)
        }

        console.log("loaded a page; pageLoadObj is", pageLoadObj)

        // send one event the first time a user comes to our site, no matter which page
        analytics.track("Loaded a page (custom)", pageLoadObj)
    }
    ,getPageTemplateName: function(){
        var bodyClasses = document.getElementsByTagName("body")[0].className
        var re = / template-(.+) /
        var m = re.exec(bodyClasses)
        if (m) {
            return m[1]
        }
        else {
            return "none"
        }
    },
    getPageType: function(){
        var myPageType = "docs"
        var myTemplateName = this.getPageTemplateName()
        var pageTypeLookupTable = {
            account: [
                "change-password",
                "create-collection",
                "login",
                "reset-password"
            ],
            admin: [
                "generate-api"
            ],
            item: [
                "item"
            ],
            landing: [
                "index"
            ],
            old_collection: [
                "collection"
            ],
            preferences: [
                "user-preferences"
            ],
            profile: [
                "user-profile"
            ]
        }

        _.each(pageTypeLookupTable, function(pageType, templateNames){
            if (_.contains(templateNames, myTemplateName)) {
                myPageType = pageType
            }
        })
        return myPageType
    }
}


