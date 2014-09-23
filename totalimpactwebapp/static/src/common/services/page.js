angular.module("services.page", [
  'signup'
])
angular.module("services.page")
  .factory("Page", function($location,
                            $rootScope,
                            PinboardService,
                            security,
                            ProfileAboutService,
                            ProfileService){
    var title = '';
    var notificationsLoc = "header"
    var lastScrollPosition = {}
    var isEmbedded =  _($location.path()).startsWith("/embed/")
    var profileUrl
    var pageName
    var isInfopage
    var profileSlug

    var nonProfilePages = [
      "/",
      "/reset-password",
      "/h-index",
      "/open-science",
      "/faq",
      "/signup",
      "/about",
      "/advisors",
      "/spread-the-word"
    ]

    $rootScope.$on('$routeChangeSuccess', function () {
      isInfopage = false // init...it's being set elsewhere
      pageName = null // init...it's being set elsewhere

      profileSlug = findProfileSlug()

      if (!profileSlug) {
        clearProfileData()
      }

      handleDeadProfile(ProfileAboutService, profileSlug)

      if (ProfileAboutService.slugIsNew(profileSlug)) {
        console.log("new user slug; loading new profile.")
        clearProfileData()
        ProfileService.get(profileSlug, true)
        PinboardService.get(profileSlug)
        ProfileAboutService.get(profileSlug, true).then(function(resp){
            handleDeadProfile(ProfileAboutService, profileSlug)
          }
        )

      }
    });


    function clearProfileData(){
        ProfileAboutService.clear()
        ProfileService.clear()
        PinboardService.clear()
    }


    function handleDeadProfile(ProfileAboutService, profileSlug){
      if (ProfileAboutService.data.is_live === false){
        console.log("we've got a dead profile.")

        ProfileService.clear()
        PinboardService.clear()

        security.currentUserOwnsProfile(profileSlug).then(
          function(currentUserOwnsProfile){
            // is this profile's owner here? give em a chance to subscribe.
            if (currentUserOwnsProfile){
              $location.path("/settings/subscription")
            }

            // for everyone else, show a Dead Profile page
            else {
              $location.path(profileSlug + "/expired")
            }
          }
        )

      }
    }


    function findProfileSlug(){
      var firstPartOfPath = "/" + $location.path().split("/")[1]
      if (firstPartOfPath == "/settings") {
        console.log("findprofileslug reporting /settings page")
        return security.getCurrentUserSlug()
      }


      if (_.contains(nonProfilePages, firstPartOfPath)){
        return undefined
      }
      else {
        return firstPartOfPath.substr(1) // no slash
      }
    }

    var isSubscriptionPage = function(){
      var splitPath = $location.path().split("/")
      return splitPath[1] == "settings" && splitPath[2] == "subscription"

    }





    var getPageType = function(){
      var myPageType = "profile"
      var path = $location.path()

      var settingsPages = [
        "/settings",
        "/reset-password"
      ]

      var infopages = [
        "/faq",
        "/about"
      ]

      if (path === "/"){
        myPageType = "landing"
      }
      else if (path === "/CarlBoettiger") {
        myPageType = "demoProfile"
      }
      else if (path === "/signup") {
        myPageType = "signup"
      }
      else if (_.contains(infopages, path)){
        myPageType = "infopages"
      }
      else if (_.contains(settingsPages, path)) {
        myPageType = "settings"
      }
      else if (path.indexOf("products/add") > -1) {
        myPageType = "importIndividual"
      }
      else if (path.indexOf("account") > -1) {
        myPageType = "linkAccount"
      }

      return myPageType
    }


    return {


      setProfileUrl: function(url){
        profileUrl = url
      },
      getProfileUrl: function(){
        return profileUrl
      },

      getUrl: function(){
        return window.location.href
      },


      'setNotificationsLoc': function(loc){
        notificationsLoc = loc;
      },
      showNotificationsIn: function(loc){
        return notificationsLoc == loc
      },
      setVersion: function(versionName){
        version = versionName;
      },
      getBodyClasses: function(){
        var conditionalClasses = {
          'embedded': isEmbedded
        }

        var classes = [
          "page-name-" + pageName
        ]

        _.each(conditionalClasses, function(v, k){
          if (v) classes.push(k)
        })

        return classes.join(" ")



      },
      isInfopage: function(){
        return !!isInfopage
      },
      setInfopage: function(val){
        isInfopage = !!val
      },

      'isEmbedded': function(){
        return isEmbedded
      } ,

      getTitle: function() { return title; },
      setTitle: function(newTitle) { title = "Impactstory: " + newTitle },


      isProfile:function(){
        var path = $location.path()
        return (path != "/") && (path != "/faq") && (path != "/about")
      },

      setName: function(name){
        pageName = name
      },

      getUrlSlug: function(){
        return profileSlug
      },

      isNamed: function(name){
        return name === pageName
      },

      setLastScrollPosition: function(pos, path){
        if (pos) {
          lastScrollPosition[path] = pos
        }
      },
      getLastScrollPosition: function(path){
        return lastScrollPosition[path]
      },

      findProfileSlug: findProfileSlug,

      sendPageloadToSegmentio: function(){

        analytics.page(
          getPageType(),
          $location.path(),
          {
            "viewport width": $(window).width(),
            "page_type": getPageType()
          }
        )
      }
    };
  })












