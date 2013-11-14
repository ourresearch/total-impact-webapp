angular.module("services.page", [])
angular.module("services.page")
.factory("Page", function(){
   var title = '';
   var showHeader = true
   var showFooter = true

   return {
     getTitle: function() { return title; },
     setTitle: function(newTitle) { title = newTitle },
     'showFrame': function(header, footer) {
       showHeader = !!header;
       showFooter = !!footer;
     },
     header: function(){return showHeader},
     footer: function(){return showFooter}
   };
})