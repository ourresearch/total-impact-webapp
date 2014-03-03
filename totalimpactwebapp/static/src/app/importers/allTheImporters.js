angular.module('importers.allTheImporters', [
  'importers.importer'
])

angular.module('importers.allTheImporters')
.factory('AllTheImporters', function(){

  var importedProducts = []
  var importers = [
    {
      displayName: "GitHub",
      url: 'http://github.com',
      descr: "GitHub is an online code repository emphasizing community collaboration features.",
     tabs: [
       {
         label: "account"
       },
       {
         label: "additional repositories"
       }
     ],
      inputs: [{
            tab: 0,
            name: "account_name",            
            inputType: "username",
            inputNeeded: "username",
            help: "Your GitHub account ID is at the top right of your screen when you're logged in.",
            saveUsername: "github_id"
          }
         ,{
            tab:1,
            name: "standard_urls_input",                        
            inputType: "idList",
            inputNeeded: "URLs",
            help: "Paste URLs for other github repositories here.",
            placeholder: "https://github.com/your_username/your_repository",
            cleanupFunction: function (fullString) {
              if (typeof fullString==="undefined") return fullString; 
              return _.map(fullString.split("\n"), function(line) {            
                // make sure it starts with https and doesn't end with trailing slash
                var working = line.replace(/^https*:\/\//, ""); 
                working = working.replace(/\/$/, ""); 
                return "https://"+working}).join("\n")}
         }
      ]
    },


    {
      displayName: "ORCID",
      inputs: [{
        inputType: "username",
        inputNeeded: "ID",
        placeholder: "http://orcid.org/xxxx-xxxx-xxxx-xxxx",
        saveUsername: "orcid_id",
        cleanupFunction: function(x) {return(x.replace('http://orcid.org/', ''))},
        help: "You can find your ID at top left of your ORCID page, beneath your name (make sure you're logged in)."
      }],
      url: 'http://orcid.org',
      signupUrl: 'http://orcid.org/register',
      descr: "ORCID is an open, non-profit, community-based effort to create unique IDs for researchers, and link these to research products. It's the preferred way to import products into Impactstory.",
      extra: "If ORCID has listed any of your products as 'private,' you'll need to change them to 'public' to be imported."
    },

    {
      displayName: "SlideShare",
      url:'http://slideshare.net',
      descr: "SlideShare is community for sharing presentations online.",
      tabs: [
       {
         label: "account"
       },
       {
         label: "additional products"
       }
       ],
      inputs: [{
            tab: 0,
            name: "account_name",            
            inputType: "username",
            inputNeeded: "username",
            help: "Your username is right after \"slideshare.net/\" in your profile's URL.",            
            saveUsername: "slideshare_id"
          }
         ,{
            tab:1,
            name: "standard_urls_input",                        
            inputType: "idList",
            inputNeeded: "URLs",
            help: "Paste URLs for other SlideShare products here.",
            placeholder: "http://www.slideshare.net/your-username/your-presentation",
            cleanupFunction: function (fullString) {
              if (typeof fullString==="undefined") return fullString; 
              return _.map(fullString.split("\n"), function(line) {            
                // make sure it starts with http
                var working = line.replace(/^https*:\/\//, ""); 
                return "http://"+working}).join("\n")}
         }
      ]
    },


    {
      displayName: "Google Scholar",
      inputs: [{
        inputType: "file",
        inputNeeded: "BibTeX file"
      }],
      endpoint: "bibtex",
      url: 'http://scholar.google.com/citations',
      descr: "Google Scholar profiles find and show researchers' articles as well as their citation impact.",
      extra: '<h3>How to import your Google Scholar profile:</h3>'
        + '<ol>'
          + '<li>Visit (or <a target="_blank" href="http://scholar.google.com/intl/en/scholar/citations.html">make</a>) your Google Scholar Citations <a target="_blank" href="http://scholar.google.com/citations">author profile</a>.</li>'
          + '<li>In the green bar above your articles, find the white dropdown box that says <code>Actions</code>.  Change this to <code>Export</code>. </li>'
          + '<li>Click <code>Export all my articles</code>, then save the BibTex file.</li>'
          + '<li>Return to Impactstory. Click "upload" in this window, select your previously saved file, and upload.'
        + '</ol>'
    },


    {
      displayName: "figshare",
      url: "http://figshare.com",
      descr: "Figshare is a repository where users can make all of their research outputs available in a citable, shareable and discoverable manner.",
      tabs: [
       {
         label: "account"
       },
       {
         label: "additional products"
       }
       ],
      inputs: [{
            tab: 0,
            name: "account_name",            
            inputType: "username",
            inputNeeded: "author page URL",
            placeholder: "http://figshare.com/authors/your_username/12345",
            cleanupFunction: function(x) {
              if (typeof x==="undefined") return x; 
              return('http://'+x.replace('http://', ''))},
            saveUsername: "figshare_id"
          }
         ,{
            tab:1,
            name: "standard_dois_input",                        
            inputType: "idList",
            inputNeeded: "DOIs",
            help: "Paste DOIs for other figshare products here.",
            placeholder: "http://dx.doi.org/10.6084/m9.figshare.12345"
         }
      ]
    },




  ]

  var defaultInputObj = {
    name: "primary",
    cleanupFunction: function(x){return x},
    tab:0
  }




  var makeLogoPath = function(displayName) {
    return '/static/img/logos/' + _(displayName.toLowerCase()).dasherize() + '.png';
  }


  var makeEndpoint = function(importer) {
    if (importer.endpoint) {
      return importer.endpoint
    }
    else {
      return makeName(importer.displayName)
    }
  }
          
  var makeName = function(importerName) {
    var words = importerName.split(" ");
    var capitalizedWords = _.map(words, function(word){
      return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
    })
    capitalizedWords[0] = capitalizedWords[0].toLowerCase()
    return capitalizedWords.join("");

  }


  var makeCSSName = function(importerName) {
    return importerName.replace(/ /g, '-').toLowerCase()

  }


  return {
    addProducts: function(products) {
      importedProducts = importedProducts.concat(products)
}   ,
    getProducts: function(){
      return importedProducts
    },
    get: function(){

      // this way no state is saved in the actual importers obj.
      var importersConfig = angular.copy(importers)

      var importersWithAllData = _.map(importersConfig, function(importer){
        importer.name = makeName(importer.displayName)
        importer.CSSname = makeCSSName(importer.displayName)
        importer.logoPath = makeLogoPath(importer.displayName)
        importer.endpoint = makeEndpoint(importer)

        importer.inputs = _.map(importer.inputs, function(inputObj){
          return _.defaults(inputObj, defaultInputObj)
        })


        return importer
      })

      return _.sortBy(importersWithAllData, function(importer){
        return importer.displayName.toLocaleLowerCase();
      })

    }


  }



})
