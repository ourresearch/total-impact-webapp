angular.module("services.map", [])
.factory("MapService", function(){
  var table = {
    sortBy: "-impact_per_million_internet_users"
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
    table: table
  }
})