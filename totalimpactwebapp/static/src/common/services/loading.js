angular.module("services.loading", [])
angular.module("services.loading")
.factory("Loading", function(ngProgress){

  var loadingJobs = {}
  var pageLoading = false

  var setLoading = function(setLoadingTo, jobName) {
    loadingJobs[jobName] = !!setLoadingTo
  }

  function clear(){
    for (var jobName in loadingJobs) delete loadingJobs[jobName]
  }



  return {
    is: function(jobName){

      // loading.is() ... is ANY loading job set to True?
      if (!jobName) {
        return _.some(_.values(loadingJobs))
      }

      // loading.is("jobname") ... is THIS job set to true?
      else {

        // no one ever set this job
        if (!(jobName in loadingJobs)) {
          return null
        }

        // ok, someone asked for a real job object.
        return loadingJobs[jobName]
      }
    },
    set: setLoading,
    start: function(jobName){
      setLoading(true, jobName)
    },
    finish:function(jobName){
      setLoading(false, jobName)
    },
    finishAll: clear,  // alias because i keep forgetting clear()
    clear: clear,


    startPage: function(){
      ngProgress.start()
      pageLoading = true
    },
    finishPage:function(){
      if (pageLoading){
        ngProgress.complete()
      }
      pageLoading = false
    },
    isPage: function(){
      return pageLoading
    }
  }
})