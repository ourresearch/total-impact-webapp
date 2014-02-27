angular.module("services.page", [
  'signup'
])
angular.module("services.page")
.factory("Page", function($location, $window){
   var title = '';
   var notificationsLoc = "header"
   var uservoiceTabLoc = "right"
   var lastScrollPosition = {}
   var isEmbedded =  _($location.path()).startsWith("/embed/")
   var testVersion

   var showHeaderNow = true
   var showFooterNow = true

   var frameTemplatePaths = {
     header: "",
     footer: ""
   }

   var addTplHtml = function(pathRoot){
     if (pathRoot){
       return pathRoot + ".tpl.html"
     }
     else {
       return ""
     }
   }

    var getPageType = function(){
      var myPageType = "profile"
      var path = $location.path()

      var accountPages = [
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
      else if (_.contains(accountPages, path)) {
        myPageType = "account"
      }
      else if (path.indexOf("products/add") > -1) {
        myPageType = "import"
      }

      return myPageType
    }


   return {
     showHeader: function(showHeaderArg){
       // read current value
       if (typeof showHeaderArg === "undefined"){
         return showHeaderNow
       }

       // set value
       else {
         showHeaderNow = !!showHeaderArg
         return showHeaderNow
       }
     },
     showFooter: function(showFooterArg){

       // read current value
       if (typeof showFooterArg === "undefined"){
         return showFooterNow
       }

       // set value
       else {
         showFooterNow = !!showFooterArg
         return showFooterNow
       }
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
          'show-tab-on-bottom': uservoiceTabLoc == "bottom",
          'show-tab-on-right': uservoiceTabLoc == "right",
          'hide-tab': uservoiceTabLoc == "hidden",
          'embedded': isEmbedded
        }

       var classes = [
         'test-version-' + testVersion
       ]

       _.each(conditionalClasses, function(v, k){
         if (v) classes.push(k)
       })

       return classes.join(" ")



     },
     getBaseUrl: function(){
       return "http://" + window.location.host
     },
     'isEmbedded': function(){
       return isEmbedded
     } ,
     setUservoiceTabLoc: function(loc) {uservoiceTabLoc = loc},

     getTitle: function() { return title; },
     setTitle: function(newTitle) { title = "ImpactStory: " + newTitle },

     pickTestVersion: function(){testVersion = (Math.random() > .5) ? "a" : "b"},
     isTestVersion: function(versionLetter){
       return testVersion === versionLetter
     },


     isLandingPage: function(){
       return ($location.path() === "/")
     },

     isProfile:function(){
       var path = $location.path()
       return (path != "/") && (path != "/faq") && (path != "/about")
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
           "version": testVersion,
           "viewport width": $(window).width(),
           "page_type": getPageType()
         }
       )
     }
   };
})












