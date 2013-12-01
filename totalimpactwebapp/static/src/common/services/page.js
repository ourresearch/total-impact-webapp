angular.module("services.page", [
  'signup'
])
angular.module("services.page")
.factory("Page", function($location){
   var title = '';
   var notificationsLoc = "header"
   var uservoiceTabLoc = "right"
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
     scrollToId: function(id, $rootScope){
       console.log("scroll to id", id)

       $rootScope.$watch("", function(){

       })

       scope.$evalAsync(
         function(){
           console.log("eval-ing async. id=", id)
           if (!id) return false
           return document.getElementById(id).scrollIntoView()
         }
       )
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
     }

   };
})