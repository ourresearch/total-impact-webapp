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
//      "/settings", // sort of a profile page
      "/spread-the-word"
    ]


    $rootScope.$on('$routeChangeSuccess', function () {
      isInfopage = false
      pageName = null
      profileSlug = findProfileSlug()
      if (profileSlug){

        if (ProfileAboutService.getUrlSlug() != profileSlug){
          ProfileAboutService.clear()
          ProfileAboutService.get(profileSlug, true)
        }

        if (ProfileService.getUrlSlug() != profileSlug){
          console.log("in Page, running ProfileService.clear()")
          ProfileService.clear()
          ProfileService.get(profileSlug, true)
        }

        if (PinboardService.getUrlSlug() != profileSlug){
          console.log("looks like the pinboard slug is different from profile slug:", PinboardService.getUrlSlug(), profileSlug)
          PinboardService.clear()
          console.log("supposedly, the pinboard is clear now:", PinboardService.cols, PinboardService.data)
          PinboardService.get(profileSlug)
        }
      }
      else {
        ProfileAboutService.clear()
        ProfileService.clear()
        PinboardService.clear()
      }
    });


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












