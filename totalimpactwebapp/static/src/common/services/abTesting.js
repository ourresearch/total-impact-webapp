angular.module('services.abTesting', ['ngCookies'])
  .factory("AbTesting", function($cookieStore){
    console.log("abTesting loaded. test those abs!")

    var testDefinitions = {
      "link to sample profile from landing page": ["yes", "no"]
    }

    var assignTestStates = function(){
      _.each(testDefinitions, function(testName, testStates){
        if ($cookieStore.get(testName)) {
          // it's already set, move on
        }
        else {
          $cookieStore.set(testName, _.sample(testStates) )
        }
      })
    }

    var getTestStates = function(){
      var ret = {}
      _.each(testDefinitions, function(testName){
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
