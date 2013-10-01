angular.module('importers.allTheImporters', [
  'importers.importer'
])

angular.module('importers.allTheImporters')
.factory('AllTheImporters', function(){

  var importers = [
    {
      displayName: "GitHub",
      inputType: "username",
      descr: "GitHub is an online code repository emphasizing community collaboration features."
    },
    {
      displayName: "ORCID",
      inputType: "username",
      descr: "ORCID is an open, non-profit, community-based effort to create unique IDs for researcher, and link these to research products."
    },
    {
      displayName: "Slideshare",
      inputType: "username",
      descr: "Slideshare is community for sharing presentations online."
    },
    {
      displayName: "Google Scholar",
      inputType: "file",
      descr: "Google Scholar profiles find and show researchers' articles as well as their citation impact."
    },
    {
      displayName: "figshare",
      inputType: "idList",
      descr: "figshare is a repository where users can make all of their research outputs available in a citable, shareable and discoverable manner."
    },
    {
      displayName: "Dryad",
      inputType: "idList",
      descr: "The Dryad Digital Repository is a curated resource that makes the data underlying scientific publications discoverable, freely reusable, and citable."
    },
    {
      displayName: "Dataset DOIs",
      inputType: "idList",
      descr: "Datasets can be identified by DOI, a unique ID specific to a given research product."
    },
    {
      displayName: "Article DOIs",
      inputType: "idList",
      descr: "Articles can be identified by DOI, a unique ID specific to a given research product."
    },
    {
      displayName: "PubMed IDs",
      inputType: "idList",
      descr: "PubMed is a large database of biomedical literature. Every article in PubMed has a unique PumMed ID."
    }

  ]


  var makeLogoPath = function(displayName) {
    var urlStyleName = displayName.toLowerCase().replace(" ", "-")
    return '/static/dist/img/logos/' + urlStyleName + '.png';
  }
          
  var makeName = function(importerName) {
    var words = importerName.split(" ");
    var capitalizedWords = _.map(words, function(word){
      return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
    })
    capitalizedWords[0] = capitalizedWords[0].toLowerCase()
    return capitalizedWords.join();

  }
           

  return {
    get: function(){
      var importersWithAllData = _.map(importers, function(importer){
        var name = makeName(importer.displayName)

        importer.name = name
        importer.logoPath = makeLogoPath(importer.displayName)

        return importer
      })

      return _.sortBy(importersWithAllData, function(importer){
        return importer.displayName.toLocaleLowerCase();
      })

    }


  }



})