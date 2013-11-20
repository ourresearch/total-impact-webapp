angular.module("services.page", [
  'signup'
])
angular.module("services.page")
.factory("Page", function(){
   var title = '';
   var notificationsLoc = "header"
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


     getTitle: function() { return title; },
     setTitle: function(newTitle) { title = newTitle }

   };
})