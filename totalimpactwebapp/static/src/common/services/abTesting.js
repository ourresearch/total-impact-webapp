angular.module('services.abTesting', ['ngCookies'])
  .factory("AbTesting", function($cookieStore){

    var testDefinitions = {
      "link to sample profile from landing page": ["yes", "no"]
    }

    var assignTestStates = function(){
      _.each(testDefinitions, function(testStates, testName){
        if ($cookieStore.get(testName)) {
          // it's already set, move on
          console.log("test already set: ", testName, $cookieStore.get(testName))
        }
        else {
          var testState = _.sample(testStates)
          console.log("setting A/B test state: ", testName, testState)
          $cookieStore.put(testName, testState)
        }
      })
    }

    var getTestStates = function(){
      var ret = {}
      _.each(testDefinitions, function(testStates, testName){
        ret[testName] = $cookieStore.get(testName)
      })
      return ret
    }

    var getTestState = function(testName){
      return $cookieStore[testName]
    }

    return {
      assignTestStates: assignTestStates,
      getTestStates: getTestStates,
      getTestState: getTestState
    }




  })
