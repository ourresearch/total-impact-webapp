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
                                       ProfileCountries,
                                       MapService,
                                       Loading,
                                       Page){
  console.log("profile map ctrl ran.")
  Page.setName("map")
  Page.setTitle("Map")
  if (!ProfileService.hasFullProducts()){
    Loading.startPage()
  }

    $scope.MapService = MapService




  ProfileCountries.get(
    {id: $routeParams.url_slug },
    function(resp){
      console.log("here is where we load le map", resp.list)
      Loading.finishPage()

      $scope.countries = resp.list
      MapService.setCountries(resp.list)


      var countryCounts = {}
      _.each(resp.list, function(countryObj){
        countryCounts[countryObj.iso_code] = countryObj.event_sum
      })

      console.log("preparing to run the map", countryCounts)

      $(function(){
        console.log("running the map", countryCounts)
        $("#profile-map").vectorMap({
          map: 'world_mill_en',
          backgroundColor: "#fff",
          zoomOnScroll: false,
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
          onRegionTipShow: MapService.makeRegionTipHandler(resp.list),
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
  )



})