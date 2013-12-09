angular.module('product.categoryHeading', [])
  .factory("CategoryHeading", function(){

    var genreIcons = {
      software: "icon-save",
      article: "icon-file-text-alt",
      dataset: "icon-table",
      slides: "icon-desktop",
      webpage: "icon-globe",
      video: "icon-facetime-video",
      blog: "icon-comment",
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
