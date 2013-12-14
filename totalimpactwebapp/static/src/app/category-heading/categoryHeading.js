angular.module('product.categoryHeading', ["security"])
  .factory("CategoryHeading", function(){

    var genreIcons = {
      article: "icon-file-text-alt",
      blog: "icon-comments",
      dataset: "icon-table",
      figure: "icon-bar-chart",
      poster: "icon-picture",
      slides: "icon-desktop",
      software: "icon-save",
      twitter: "icon-twitter",
      video: "icon-facetime-video",
      webpage: "icon-globe",
      other: "icon-question-sign"
    }

    return {
      getGenreIcon: function(genre){
        if (genre in genreIcons){
          return genreIcons[genre]
        }
        else {
          return genreIcons.other
        }
      }
    }

  })
.controller("CategoryHeadingCtrl", function($scope, CategoryHeading, $location, security){
    $scope.genreIcon = CategoryHeading.getGenreIcon
    $scope.makeAnchorLink = function(anchor){
      return $location.path() + "#" + anchor
    }

    $scope.getUrl= function(){
      if ($scope.product.account_biblio) {
        return $scope.product.account_biblio.url
      }
      else {
        return false
      }
    }

    if ($scope.product.genre == "blog"){
      $scope.how_we_found_these = "how_we_found_these_blog_posts"
    }

    if ($scope.product.genre == "twitter"){
      $scope.how_we_found_these = "how_we_found_these_tweets"
    }


    $scope.upload_wordpress_key = function(){
      var wpHeading =  ($scope.product.account_biblio && $scope.product.account_biblio.hosting_platform == "wordpress.com")
      var wpKeySet = security.getCurrentUser("wordpress_api_key")
      if (wpHeading && !wpKeySet){
        return "upload_wordpress_key"
      }
      else {
        return null
      }
    }
})
