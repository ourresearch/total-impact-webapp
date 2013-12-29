angular.module("services.timer", [])
.factory("Timer", function(){
    var jobs = []
    return {
      start: function(jobName){
        jobs[jobName] = Date.now()
      },
      elapsed: function(jobName){
        return Date.now() - jobs[jobName]
      }
    }

  })