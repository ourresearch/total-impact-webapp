angular.module("services.map", [
  "services.countryNames"
  ])
.factory("MapService", function($location, CountryNames){
  var data = {
    sortBy: "name",
    countries: []
  }

  function goToCountryPage(url_slug, isoCode){
    $location.path(url_slug + "/country/" + CountryNames.urlFromCode(isoCode))
  }

  function sum(arr){
    var len = arr.length
    var sum = 0
    for (var i = 0; i < len; i++) {
      if (arr[i]) {  // undefined or NaN will kill the whole sum
        sum += arr[i]
      }
    }

    return sum
  }

  function makeRegionTipHandler(countriesData){
    console.log("making the region tip handler with", countriesData)

    return (function(event, element, countryCode){

      function makeTipMetricLine(metricName){
        console.log("country code", countryCode)

        var country = _.findWhere(countriesData, {iso_code: countryCode})
        console.log("country", country)

        var metricValue = country.event_counts[metricName]
        if (!metricValue) {
          return ""
        }
        var iconPath
        var metricLabel
        if (metricName == "altmetric_com:tweets") {
          iconPath = '/static/img/favicons/altmetric_com_tweets.ico'
          metricLabel = "Tweets"
        }
        else if (metricName == "impactstory:views"){
          iconPath = '/static/img/favicons/impactstory_views.ico'
          metricLabel = "Impactstory views"
        }
        else if (metricName == "mendeley:readers"){
          iconPath = '/static/img/favicons/mendeley_readers.ico'
          metricLabel = "Mendeley readers"
        }

        var ret = ("<li>" +
          "<img src='" + iconPath + "'>" +
          "<span class='val'>" + metricValue + "</span>" +
          "<span class='name'>"+ metricLabel +"</span>" +
          "</li>")

        return ret
      }


      var contents = "<ul>"
      contents += makeTipMetricLine("altmetric_com:tweets")
      contents += makeTipMetricLine("impactstory:views")
      contents += makeTipMetricLine("mendeley:readers")
      contents += "</ul>"

      element.html(element.html() + contents);

    })
  }


  return {
    makeRegionTipHandler: makeRegionTipHandler,
    goToCountryPage: goToCountryPage,
    data: data,
    setCountries: function(myCountries){
      data.countries.length = 0
      _.each(myCountries, function(thisCountry){
        data.countries.push(thisCountry)
      })
    },
    getEventSum: function(metricName){
      var counts
      if (metricName){
        counts = _.map(data.countries, function(country){
          return country.event_counts[metricName]
        })
      }
      else {
        counts = _.pluck(data.countries, "event_sum")
      }
      return sum(counts)
    }
  }
})