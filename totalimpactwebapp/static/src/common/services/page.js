angular.module("services.page", [
  'signup'
])
angular.module("services.page")
.factory("Page", function($location, $window){
   var title = '';
   var notificationsLoc = "header"
   var uservoiceTabLoc = "right"
   var lastScrollPosition = {}
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

    var isEmbedded = function(){
       return $location.search().embed
    }


    var parseUrl = function(url){
      var m = /(^.+\w)#(\w[\w]+$)/.exec(url)
      var ret = {
        pathAndSearch: null,
        anchor: null
      }
      if (m) {
        ret.pathAndSearch = m[1]
        ret.anchor = m[2]
      }
      else {
        ret.pathAndSearch = url
      }
      return ret

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
     getBodyClasses: function(){
        return {
          'show-tab-on-bottom': uservoiceTabLoc == "bottom",
          'show-tab-on-right': uservoiceTabLoc == "right",
          'embedded': isEmbedded()
        }
     },
     getBaseUrl: function(){
       return window.location.origin
     },
     'isEmbedded': isEmbedded,

     setUservoiceTabLoc: function(loc) {uservoiceTabLoc = loc},
     getTitle: function() { return title; },
     setTitle: function(newTitle) { title = newTitle },

     isLandingPage: function(){
       return ($location.path() == "/")
     },
     setLastScrollPosition: function(pos, path){
       if (pos) {
        lastScrollPosition[path] = pos
       }
     },
     getLastScrollPosition: function(path){
       return lastScrollPosition[path]
     }

   };
})