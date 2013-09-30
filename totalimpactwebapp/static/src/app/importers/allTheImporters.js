angular.module('importers.allTheImporters', [
  'importers.importer'
])

angular.module('importers.allTheImporters')
.factory('AllTheImporters', function(){

  var importerNames = [
    'github'
//    'orcid',
//    'bibtex',
//    'slideshare',
//    'figshareDois',
//    'dryadDois',
//    'datasetDois',
//    'articleDois',
//    'pubmedIds'
  ]

  var templatePath = function(importerName){
    return 'importers/'+importerName+'.tpl.html';
  }

  var logoPath = function(importerName) {
    return '/static/dist/img/logos/' + importerName + '.png';
  }

  return {
    get: function(){
      return _.map(importerNames, function(name){
        return {
          name: name,
          templatePath: templatePath(name),
          logoPath: logoPath(name)
        }
      })
    }


  }



})