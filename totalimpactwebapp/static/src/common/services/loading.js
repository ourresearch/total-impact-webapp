angular.module("services.loading", [])
angular.module("services.loading")
.factory("Loading", function(){
  var loading = false;
  var loadingJobs = {}
  var setLoading = function(setLoadingTo, jobName) {
    if (jobName){
      loadingJobs[jobName] = !!setLoadingTo
    }
    else {
      loading = !!setLoadingTo;
    }
    return !!setLoadingTo
  }

  return {
    is: function(jobName){
      if (jobName && jobName in loadingJobs){
        return loadingJobs[jobName]
      }
      else if (jobName && !(jobName in loadingJobs)){
        // you asked for loading state of a job that doesn't exist:
        return null
      }
      else {
        return loading
      }
    },
    set: setLoading,
    start: function(jobName){
      setLoading(true, jobName)
    },
    finish:function(jobName){
      setLoading(false, jobName)
    },
    clear: function(){
      loading = false;
      for (var jobName in loadingJobs) delete loadingJobs[jobName]
    }
  }
})