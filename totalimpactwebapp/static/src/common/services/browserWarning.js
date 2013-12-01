angular.module('services.browser', [
  'services.i18nNotifications'
  ])

// A simple directive to display a gravatar image given an email
.factory('Browser', function(i18nNotifications){
  if (typeof oldIE == "undefined") {
    var oldIE = false
  }

  return {
    warnOldIE: function(){
      if (oldIE) {
        console.log("old ie!")
        i18nNotifications.pushSticky("browser.error.oldIE", "danger", {})
      }
      else {
        console.log("not old ie!")
      }
    }
  }
})