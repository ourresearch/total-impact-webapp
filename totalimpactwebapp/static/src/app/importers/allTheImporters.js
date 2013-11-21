angular.module('importers.allTheImporters', [
  'importers.importer'
])

angular.module('importers.allTheImporters')
.factory('AllTheImporters', function(){

  var importedProducts = []
  var importers = [
    {
      displayName: "GitHub",
      inputType: "username",
      inputNeeded: "username",
      url: 'http://github.com',
      descr: "GitHub is an online code repository emphasizing community collaboration features.",
      help: "Your GitHub account ID is at the top right of your screen when you're logged in."
    },
    {
      displayName: "ORCID",
      inputType: "username",
      inputNeeded: "ID",
      url: 'http://orcid.org',
      signupUrl: 'http://orcid.org/register',
      descr: "ORCID is an open, non-profit, community-based effort to create unique IDs for researchers, and link these to research products. It's the preferred way to import products into ImpactStory.",
      help: "You can find your ID at top left of your ORCID page, beneath your name (make sure you're logged in).",
      placeholder: "http://orcid.org/xxxx-xxxx-xxxx-xxxx",
      extra: "If ORCID has listed any of your products as 'private,' you'll need to change them to 'public' to be imported."
    },
    {
      displayName: "Slideshare",
      inputType: "username",
      inputNeeded: "username",
      url:'http://slideshare.net',
      descr: "Slideshare is community for sharing presentations online.",
      help: "Your username is right after \"slideshare.net/\" in your profile's URL."
    },
    {
      displayName: "Twitter",
      inputType: "username",
      inputNeeded: "username",
      endpoint: "twitter_account",      
      url: "http://twitter.com",
      descr: "Twitter is a social networking site for sharing short messages.",
      help: "Your Twitter username is often written starting with @.",
      placeholder: "@username"
    },     
    {
      displayName: "Google Scholar",
      inputType: "file",
      inputNeeded: "BibTeX file",
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
      inputType: "username",
      inputNeeded: "author page URL",
      url: "http://figshare.com",
      descr: "Figshare is a repository where users can make all of their research outputs available in a citable, shareable and discoverable manner.",
      help: "Your figshare author page URL is the URL of the webpage you arrive at when you click your name on one of your figshare item pages.",
      placeholder: "http://figshare.com/authors/schamberlain/96554"
    },
    {
      displayName: "WordPress",
      inputType: "idList",
      inputNeeded: ".com  URLs",
      endpoint: "wordpresscom",            
      url: "http://wordpress.com",
      descr: "WordPress.com is a blog hosting site.",
      help: "Paste the URLs for WordPress.com blogs.  The URLs can be on custom domains (like http://blog.impactstory.org), as long as the blogs are hosted on WordPress.com.",
      placeholder: "http://retractionwatch.wordpress.com"
    },    
    {
      displayName: "YouTube",
      inputType: "idList",
      inputNeeded: "URLs",
      endpoint: "urls",            
      url: "http://youtube.com",
      descr: "YouTube is an online video-sharing site.",
      help: "Copy the URLs for the videos you want to add, then paste them here.",
      placeholder: "http://www.youtube.com/watch?v=2eNZcU4aVnQ"
    },
    {
      displayName: "Vimeo",
      inputType: "idList",
      inputNeeded: "URLs",
      endpoint: "urls",      
      url: "http://vimeo.com",
      descr: "Vimeo is an online video-sharing site.",
      help: "Copy the URLs for the videos you want to add, then paste them here.",
      placeholder: "http://vimeo.com/48605764"
    },   
    {
      displayName: "Dryad",
      inputType: "idList",
      inputNeeded: "DOIs",
      endpoint: "dois",
      url: 'http://datadryad.org',
      descr: "The Dryad Digital Repository is a curated resource that makes the data underlying scientific publications discoverable, freely reusable, and citable.",
      help: "You can find Dryad DOIs on each dataset's individual Dryad webpage, inside the <strong>\"please cite the Dryad data package\"</strong> section.",
      placeholder: "doi:10.5061/dryad.example"
    },
    {
      displayName: "Dataset DOIs",
      inputType: "idList",
      inputNeeded: "",
      endpoint: "dois",
      descr: "Datasets can often be identified by their DOI, a unique ID assigned by the repository to a given dataset.",
      help: "You can often find dataset DOIs (when they exist; alas, often they don't) on their repository pages.",
      placeholder: "http://doi.org/10.example/example"
    },
    {
      displayName: "Article DOIs",
      inputType: "idList",
      inputNeeded: "",
      endpoint: "dois",
      descr: "Articles can often be identified by their DOI: a unique ID most publishers assign to the articles they publish.",
      help: "You can (generally) find article DOIs wherever the publishers have made the articles available online.",
      placeholder: "http://doi.org/10.example/example"
    },
    {
      displayName: "PubMed IDs",
      inputType: "idList",
      inputNeeded: "",
      endpoint: "pmids",
      url:'http://www.ncbi.nlm.nih.gov/pubmed',
      descr: "PubMed is a large database of biomedical literature. Every article in PubMed has a unique PubMed ID.",
      placeholder: "123456789",
      help: "You can find PubMed IDs (PMIDs) beneath each article's abstract on the PubMed site."
    },
    {
      displayName: "Webpages",
      inputType: "idList",
      inputNeeded: "URLs",
      endpoint: "urls",
      descr: "You can import any webpages. If it has a DOI or PubMed ID, though, use those more specific importers instead of this one; you'll get better results."
    }

  ]


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

        return importer
      })

      return _.sortBy(importersWithAllData, function(importer){
        return importer.displayName.toLocaleLowerCase();
      })

    }


  }



})