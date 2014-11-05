globalCountryNames = globalCountryNames || []

angular.module("services.countryNames", [])
.factory("CountryNames", function(){
  var isoCountries = globalCountryNames
    
  var urlName = function(fullName) {
    return fullName.replace(/ /g, "_")
  }
    
  var isoCodeFromUrl = function(myUrlName){
    for (var isoCode in isoCountries){
      if (myUrlName ==  urlName(isoCountries[isoCode])){
        return isoCode
      }
    }
  }




  return {
    urlFromCode: function(isoCode){
      return urlName(isoCountries[isoCode])
    },
    humanFromUrl: function(urlName){
      var code = isoCodeFromUrl(urlName)
      return isoCountries[code]
    },
    codeFromUrl: isoCodeFromUrl
  }

})