angular.module("services.page", [
  'signup'
])
angular.module("services.page")
.factory("Page", function($location){
   var title = '';
   var notificationsLoc = "header"
   var uservoiceTabLoc = "right"
   var lastScrollPosition = {}
   var isEmbedded =  _($location.path()).startsWith("/embed/")
   var headerFullName
   var profileUrl

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

     setHeaderFullName: function(name){
       headerFullName = name
     },


     getHeaderFullName: function(name){
       return headerFullName
     },

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
          'show-tab-on-bottom': uservoiceTabLoc == "bottom",
          'show-tab-on-right': uservoiceTabLoc == "right",
          'hide-tab': uservoiceTabLoc == "hidden",
          'embedded': isEmbedded
        }

       var classes = []

       _.each(conditionalClasses, function(v, k){
         if (v) classes.push(k)
       })

       return classes.join(" ")



     },
     'isEmbedded': function(){
       return isEmbedded
     } ,
     setUservoiceTabLoc: function(loc) {uservoiceTabLoc = loc},

     getTitle: function() { return title; },
     setTitle: function(newTitle) { title = "Impactstory: " + newTitle },

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
           "viewport width": $(window).width(),
           "page_type": getPageType()
         }
       )
     }
   };
})












