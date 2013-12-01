angular.module('services.browser', [
  'services.i18nNotifications'
  ])

// A simple directive to display a gravatar image given an email
.factory('Browser', function(i18nNotifications){
  return {
    warnOldIE: function(){
      if ($.browser.msie && parseFloat($.browser.version) < 10) {
        console.log("using old version of ie!")
        i18nNotifications.pushSticky("browser.error.oldIE", "danger", {})
      }
      else {
      }
    }
  }
})