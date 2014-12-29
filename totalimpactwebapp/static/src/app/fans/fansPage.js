angular.module('fansPage', [
  ])

.config(function($routeProvider) {
  $routeProvider

  .when('/:url_slug/fans', {
    templateUrl: 'fans/fans-page.tpl.html',
    controller: 'FansPageCtrl'
  })
})

.controller("FansPageCtrl", function(
    $scope,
    $routeParams,
    FansService,
    OurSortService,
    ProfileProducts,
    GenreConfigs,
    Page){
    Page.setName("fans")

    console.log("fans page controller ran.")
    $scope.FansService = FansService


    OurSortService.setChoices([
      {
        key: ["-about.followers", 'about.name'],
        name: "followers",
        urlName: "default"
      },
      {
        key: "about.name",
        name: "name",
        urlName: "name"
      },
      {
        key: "-about.numTweets",
        name: "citing tweets",
        urlName: "citing_tweets"
      }
    ])


    var pages = {
      current: 1,
      perPage: 25
    }
    $scope.pages = pages
    pages.onPageChange = function(newPageNumber){
      console.log("page change!", newPageNumber)
      pages.current = newPageNumber
      window.scrollTo(0,0)
    }

    $scope.$watch("FansService.data.tweeters", function(newVal, oldVal){
      pages.numPages = Math.ceil(newVal.length / pages.perPage)
    })


    $scope.titleFromTiid = ProfileProducts.getTitleFromTiid
    $scope.urlFromTiid = function(tiid){
      var myProduct = ProfileProducts.getProductFromTiid(tiid)
      if (myProduct){
        return $routeParams.url_slug + "/product/" + tiid
      }
    }

    $scope.genreIconClassFromTiid = function(tiid){
      var myProduct = ProfileProducts.getProductFromTiid(tiid)
      if (myProduct){
        return GenreConfigs.get(myProduct.genre, "icon")
      }
    }


  })
