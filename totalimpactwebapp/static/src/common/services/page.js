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


      var pageTypeLookupTable = {
        account: [
          "/settings",
          "/reset-password"
        ],
        landing: [
          "/"
        ],
        infopage: [
          "/faq",
          "/about"
        ],
        signup: [
          "/signup"
        ]
      }

      _.each(pageTypeLookupTable, function(urlStartsWithList, pageType){
        var filtered = _.filter(urlStartsWithList, function(x){
           return _($location.path()).startsWith(x)
        })
        if (filtered.length) {
          myPageType = pageType
        }

      })
    }



   var headers = {
     signup: "signup/signup-header.tpl.html"
   }

   return {
     setTemplates: function(headerPathRoot, footerPathRoot){
       frameTemplatePaths.header = addTplHtml(headerPathRoot)
       frameTemplatePaths.footer = addTplHtml(footerPathRoot)
     },
     getTemplate: function(templateName){
       return frameTemplatePaths[templateName]
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
        return {
          'show-tab-on-bottom': uservoiceTabLoc == "bottom",
          'show-tab-on-right': uservoiceTabLoc == "right",
          'embedded': isEmbedded
        }
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

     isLandingPage: function(){
       return ($location.path() == "/")
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

//       analytics.page(
//         getPageType(),
//         $location.path(),
//         {
//           "version": (Math.random() > .5) ? "A" : "B",
//           "viewport width": $(window).width(),
//           "page_type": getPageType()
//         }
//       )
     }
   };
})












