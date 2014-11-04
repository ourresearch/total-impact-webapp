globalCountryNames = globalCountryNames || []

angular.module('services.countriesInfo', [])
  .factory("CountriesInfo", function(){
    var names = globalCountryNames



    function countriesList(countriesDict){
      ret = []
      if (countriesDict){
        console.log("countries list!")
        _.each(countriesDict, function(countsDict, isoCode){
          var countryName = globalCountryNames[isoCode]
          if (!countryName){
            return false
          }
          ret.push({
            isoCode: isoCode,
            name: countryName,
            sum: countsDict.sum
          })
        })
      }
      console.log("trying to return this countries list: ", ret)
      return ret
    }

    return {
      nameFromCode:function(code){
        return names[code]
      },
      countriesList: countriesList

    }




  })