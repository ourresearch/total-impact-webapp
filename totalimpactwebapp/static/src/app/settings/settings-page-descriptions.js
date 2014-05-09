angular.module("settings.pageDescriptions", [])
angular.module('settings.pageDescriptions')
.factory('SettingsPageDescriptions', function(){
           
  var settingsPageDisplayNames = [
    "Profile",
    "Notifications",
    "Custom URL",
    "Email",
    "Password"
//    ,"Linked accounts"
  ]

  var urlPathFromDisplayName = function(displayName){
    return "/settings/" + displayName.replace(" ", "-").toLowerCase();
  }           
  var templatePathFromDisplayName = function(displayName){
    return urlPathFromDisplayName(displayName).substring(1) + "-settings.tpl.html";
  }

  var settingsPageDescriptions = [];
           
  // make a list of objects, each describing one our our settings pages.
  _.each(settingsPageDisplayNames, function(pageDisplayName) {
   var settingsPageObj = {
     displayName: pageDisplayName,
     urlPath: urlPathFromDisplayName(pageDisplayName),
     templatePath: templatePathFromDisplayName(pageDisplayName)
   };
    settingsPageDescriptions.push(settingsPageObj);
  })
           
  return {
    get: function(){
      return settingsPageDescriptions;
    }
    ,getDescrFromPath: function(path){
      return _.findWhere(settingsPageDescriptions, {urlPath: path})
    }
  };

})