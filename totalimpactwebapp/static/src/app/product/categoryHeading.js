angular.module('product.categoryHeading', [])
  .factory("CategoryHeading", function(){

    var genreIcons = {
      software: "icon-save",
      article: "icon-file-text-alt",
      dataset: "icon-table",
      slides: "icon-desktop",
      webpage: "icon-globe",
      video: "icon-facetime-video",
      blog: "icon-comments",
      twitter: "icon-twitter",
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
.controller("CategoryHeadingCtrl", function($scope, CategoryHeading, $location, UserProfile){
    $scope.genreIcon = CategoryHeading.getGenreIcon
    $scope.makeAnchorLink = function(anchor){
      return $location.path() + "#" + anchor
    }


    if ($scope.product.genre == "blog"){
      $scope.how_we_found_these = "how_we_found_these_blog_posts"
    }

    if ($scope.product.genre == "twitter"){
      $scope.how_we_found_these = "how_we_found_these_tweets"
    }

    $scope.upload_wordpress_key = false
    if ($scope.product.account_biblio.hosting_platform == "wordpress.com"){
      $scope.upload_wordpress_key =  "upload_wordpress_key"
    }
})
