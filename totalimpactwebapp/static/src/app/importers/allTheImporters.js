angular.module('importers.allTheImporters', [
  'importers.importer'
])

angular.module('importers.allTheImporters')
.factory('AllTheImporters', function(){

  var importedProducts = []
  var importers = [
    {
      displayName: "GitHub",
      inputs: [{
        inputType: "username",
        inputNeeded: "username",
        help: "Your GitHub account ID is at the top right of your screen when you're logged in."
      }
      // ,{
      //   inputType: "username",
      //   inputNeeded: "API key",
      //   placeholder: "This is just for testing.",
      //   name: "apiKey",
      //   help: "Your GitHub API key is somewhere in GitHub. It's a mystery! Go find it!"
      // }
      ],
      saveUsername: true,
      url: 'http://github.com',
      descr: "GitHub is an online code repository emphasizing community collaboration features."
    },


    {
      displayName: "ORCID",
      inputs: [{
        inputType: "username",
        inputNeeded: "ID",
        placeholder: "http://orcid.org/xxxx-xxxx-xxxx-xxxx",
        help: "You can find your ID at top left of your ORCID page, beneath your name (make sure you're logged in)."
      }],
      saveUsername: true,
      url: 'http://orcid.org',
      signupUrl: 'http://orcid.org/register',
      descr: "ORCID is an open, non-profit, community-based effort to create unique IDs for researchers, and link these to research products. It's the preferred way to import products into ImpactStory.",
      extra: "If ORCID has listed any of your products as 'private,' you'll need to change them to 'public' to be imported."
    },


    {
      displayName: "Slideshare",
      inputs: [{
        inputType: "username",
        inputNeeded: "username",
        help: "Your username is right after \"slideshare.net/\" in your profile's URL."
      }],
      saveUsername: true,
      url:'http://slideshare.net',
      descr: "Slideshare is community for sharing presentations online."
    },


    {
      displayName: "Twitter",
      inputs: [{
        inputType: "username",
        inputNeeded: "username",
        help: "Your Twitter username is often written starting with @.",
        placeholder: "@username",
        inputCleanupFunction: function(x) {return('@'+x.replace('@', ''))}
      }],
      saveUsername: true,
      endpoint: "twitter_account",
      url: "http://twitter.com",
      descr: "Twitter is a social networking site for sharing short messages."
    },


    {
      displayName: "Google Scholar",
      inputs: [{
        inputType: "file",
        inputNeeded: "BibTeX file",
        help: "Your GitHub account ID is at the top right of your screen when you're logged in."
      }],
      endpoint: "bibtex",
      url: 'http://scholar.google.com/citations',
      descr: "Google Scholar profiles find and show researchers' articles as well as their citation impact.",
      extra: '<h3>How to import your Google Scholar profile:</h3>'
        + '<ol>'
          + '<li>Visit (or <a target="_blank" href="http://scholar.google.com/intl/en/scholar/citations.html">make</a>) your Google Scholar Citations <a target="_blank" href="http://scholar.google.com/citations">author profile</a>.</li>'
          + '<li>In the green bar above your articles, find the white dropdown box that says <code>Actions</code>.  Change this to <code>Export</code>. </li>'
          + '<li>Click <code>Export all my articles</code>, then save the BibTex file.</li>'
          + '<li>Return to ImpactStory. Click "upload" in this window, select your previously saved file, and upload.'
        + '</ol>'
    },


    {
      displayName: "figshare",
      inputs: [{
        inputType: "username",
        inputNeeded: "author page URL",
        help: "Your GitHub account ID is at the top right of your screen when you're logged in.",
        placeholder: "http://figshare.com/authors/schamberlain/96554",
        inputCleanupFunction: function(x) {return('http://'+x.replace('http://', ''))}        
      }],
      saveUsername: true,
      url: "http://figshare.com",
      descr: "Figshare is a repository where users can make all of their research outputs available in a citable, shareable and discoverable manner."
    },


    {
      displayName: "WordPress",
      inputs: [{
          name: "blogUrl",
          inputType: "username",
          inputNeeded: "WordPress.com  URL",
          help: "Paste the URL for a WordPress.com blog.  The URL can be on custom domains (like http://blog.impactstory.org), as long as the blog is hosted on WordPress.com.",
          placeholder: "http://retractionwatch.wordpress.com"
        },
        {
          inputType: "username",
          inputNeeded: "API key",
          name: "apiKey",
          help: "Your WordPress.com API key can be discovered through Akismet at <a href='http://akismet.com/resend/'>http://akismet.com/resend/</a>"
        }],
      endpoint: "wordpresscom",            
      url: "http://wordpress.com",
      descr: "WordPress.com is site that provides web hosting for blogs, using the popular WordPress software."
    },    


    {
      displayName: "YouTube",
      inputs: [{
        inputType: "idList",
        inputNeeded: "URLs",
        help: "Copy the URLs for the videos you want to add, then paste them here.",
        placeholder: "http://www.youtube.com/watch?v=2eNZcU4aVnQ"
      }],
      endpoint: "urls",
      url: "http://youtube.com",
      descr: "YouTube is an online video-sharing site."
    },


    {
      displayName: "Vimeo",
      inputs: [{
        inputType: "idList",
        inputNeeded: "URLs",
        help: "Copy the URL for the video you want to add, then paste it here.",
        placeholder: "http://vimeo.com/48605764"
      }],
      endpoint: "urls",
      url: "http://vimeo.com",
      descr: "Vimeo is an online video-sharing site."
    },


    {
      displayName: "Dryad",
      inputs: [{
        inputType: "idList",
        inputNeeded: "DOIs",
        help: "You can find Dryad DOIs on each dataset's individual Dryad webpage, inside the <strong>\"please cite the Dryad data package\"</strong> section.",
        placeholder: "doi:10.5061/dryad.example"
      }],
      endpoint: "dois",
      url: 'http://datadryad.org',
      descr: "The Dryad Digital Repository is a curated resource that makes the data underlying scientific publications discoverable, freely reusable, and citable."
    },


    {
      displayName: "Dataset DOIs",
      inputs: [{
        inputType: "idList",
        inputNeeded: "DOIs",
        help: "You can often find dataset DOIs (when they exist; alas, often they don't) on their repository pages.",
        placeholder: "http://doi.org/10.example/example"
      }],
      endpoint: "dois",
      descr: "Datasets can often be identified by their DOI, a unique ID assigned by the repository to a given dataset."
    },


    {
      displayName: "Article DOIs",
      inputs: [{
        inputType: "idList",
        inputNeeded: "DOIs",
        help: "You can (generally) find article DOIs wherever the publishers have made the articles available online.",
        placeholder: "http://doi.org/10.example/example"
      }],
      endpoint: "dois",
      descr: "Articles can often be identified by their DOI: a unique ID most publishers assign to the articles they publish."
    },


    {
      displayName: "PubMed IDs",
      inputs: [{
        inputType: "idList",
        inputNeeded: "IDs",
        placeholder: "123456789",
        help: "You can find PubMed IDs (PMIDs) beneath each article's abstract on the PubMed site."
      }],
      endpoint: "pmids",
      url:'http://www.ncbi.nlm.nih.gov/pubmed',
      descr: "PubMed is a large database of biomedical literature. Every article in PubMed has a unique PubMed ID."
    },


    {
      displayName: "Webpages",
      inputs: [{
        inputType: "idList",
        inputNeeded: "URLs"
      }],
      endpoint: "urls",
      descr: "You can import any webpages. If it has a DOI or PubMed ID, though, use those more specific importers instead of this one; you'll get better results."
    }
  ]


  var makeLogoPath = function(displayName) {
    var urlStyleName = displayName.toLowerCase().replace(" ", "-")
    return '/static/img/logos/' + urlStyleName + '.png';
  }

  var makeLogoPath = function(displayName) {
    var urlStyleName = displayName.toLowerCase().replace(" ", "-")
    return '/static/img/logos/' + urlStyleName + '.png';
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

  var prepInputObject = function(inputObject) {
    var defaultInputName = "primary"
    inputObject.name || (inputObject.name = defaultInputName)

    return inputObject
  }



  return {
    addProducts: function(products) {
      importedProducts = importedProducts.concat(products)
}   ,
    getProducts: function(){
      return importedProducts
    },
    get: function(){
      var importersWithAllData = _.map(importers, function(importer){
        importer.name = makeName(importer.displayName)
        importer.logoPath = makeLogoPath(importer.displayName)
        importer.endpoint = makeEndpoint(importer)

        importer.inputs = _.map(importer.inputs, prepInputObject)


        return importer
      })

      return _.sortBy(importersWithAllData, function(importer){
        return importer.displayName.toLocaleLowerCase();
      })

    }


  }



})