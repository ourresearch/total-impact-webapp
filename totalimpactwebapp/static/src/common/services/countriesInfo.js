globalCountryNames = globalCountryNames || []

angular.module('services.countriesInfo', [])
  .factory("CountriesInfo", function(){
    var names = globalCountryNames

    return {
      nameFromCode:function(code){
        return names[code]
      }
    }




  })