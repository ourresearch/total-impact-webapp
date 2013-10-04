angular.module("services.loading", [])
angular.module("services.loading")
.factory("Loading", function(){
  var loading = false;

  return {
    is: function(){return loading},
    set: function(setLoadingTo) {
      loading = !!setLoadingTo;
      return loading
    },
    start: function(){loading = true;},
    finish:function(){loading = false}
  }
})