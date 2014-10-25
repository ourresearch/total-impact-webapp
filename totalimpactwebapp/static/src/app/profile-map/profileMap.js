angular.module( 'profileMap', [
    'security',
    'services.page',
    'services.tiMixpanel'
  ])

.config(function($routeProvider) {
  $routeProvider

  .when('/:url_slug/map', {
    templateUrl: 'profile-map/profile-map.tpl.html',
    controller: 'ProfileMapCtrl'
  })
})

.controller("ProfileMapCtrl", function($scope,
                                       $location,
                                       $rootScope,
                                       $routeParams,
                                       CountryNames,
                                       ProfileService,
                                       Loading,
                                       Page){
  console.log("profile map ctrl ran.")
  Page.setName("map")
  Page.setTitle("Map")
  if (!ProfileService.hasFullProducts()){
    Loading.startPage()
  }


  function makeRegionTipHandler(countriesData){
    console.log("making the region tip handler with", countriesData)


    return (function(event, element, countryCode){

      function makeTipMetricLine(metricName){
        console.log("country code", countryCode)

        var metricValue = countriesData[countryCode][metricName]
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





  $scope.$watch('profileService.data', function(newVal, oldVal){
    console.log("profileService.data watch triggered from profileMap", newVal, oldVal)
    if (newVal.countries) {
      console.log("here is where we load le map", newVal.countries)
      Loading.finishPage()

      var countryCounts = {}
      _.each(newVal.countries, function(myCountryCounts, myCountryCode){
        countryCounts[myCountryCode] = myCountryCounts.sum
      })

      console.log("preparing to run the map", countryCounts)

      $(function(){
        console.log("running the map", countryCounts)
        $("#profile-map").vectorMap({
          map: 'world_mill_en',
          backgroundColor: "#fff",
          regionStyle: {
            initial: {
              fill: "#dddddd"
            }
          },
          series: {
            regions: [{
              values: countryCounts,
              scale: ['#C8EEFF', '#0071A4'],
              normalizeFunction: 'polynomial'
            }]
          },
          onRegionTipShow: makeRegionTipHandler(newVal.countries),
          onRegionClick: function(event, countryCode){
            if (!countryCounts[countryCode]) {
              return false // no country pages for blank countries.
            }


            console.log("country code click!", countryCode)
            $rootScope.$apply(function(){
              var countrySlug = CountryNames.urlFromCode(countryCode)
              $location.path($routeParams.url_slug + "/country/" + countrySlug )
              $(".jvectormap-tip").remove()

            })
          }
        })
      })
    }
  }, true);


  // this shouldn't live here.


})