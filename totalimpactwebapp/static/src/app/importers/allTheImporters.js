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
      descr: "ORCID is an open, non-profit, community-based effort to create unique IDs for researchers, and link these to research products. It's the preferred way to import products into ImpactStory.",
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
      displayName: "Twitter",
      url: "http://twitter.com",
      descr: "Twitter is a social networking site for sharing short messages.",
      endpoint: "twitter_account",      
      tabs: [
       {
         label: "account"
       },
       {
         label: "additional tweets"
       }
       ],
      inputs: [{
            tab: 0,
            name: "account_name",            
            inputType: "username",
            inputNeeded: "username",
            help: "Your Twitter username is often written starting with @.",
            saveUsername: "twitter_account_id",
            placeholder: "@username",            
            cleanupFunction: function(x) {
              if (typeof x==="undefined") return x; 
              return('@'+x.replace('@', ''))}
          }
         ,{
            tab:1,
            name: "standard_urls_input",                        
            inputType: "idList",
            inputNeeded: "URLs",
            help: "Paste URLs for other Tweets here.",
            placeholder: "https://twitter.com/username/status/123456",
            cleanupFunction: function (fullString) {
              if (typeof fullString==="undefined") return fullString; 
              return _.map(fullString.split("\n"), function(line) {            
                // make sure it starts with http
                var working = line.replace(/https*:\/\//, ""); 
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
          + '<li>Return to ImpactStory. Click "upload" in this window, select your previously saved file, and upload.'
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
            cleanupFunction: function(x) {return('http://'+x.replace('http://', ''))},            
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



    {
      displayName: "Blogs",
      descr: "Blogs and websites",
      endpoint: "wordpresscom",      
      tabs: [
       {
         label: "blog url"
       },
       {
         label: "additional posts"
       }       
       ],
      inputs: [{
            tab: 0,
            name: "blogUrl",            
            inputType: "username",
            inputNeeded: "Blog URL",
            help: "The URL for your blog (such as http://retractionwatch.wordpress.com or http://blog.impactstory.org)",
            placeholder: "yourblogname.com",
            cleanupFunction: function (line) {
              if (typeof line==="undefined") return line; 
              var working = line.replace(/^https*:\/\//, ""); 
              working = working.replace(/\/$/, ""); 
              return "http://"+working; 
              }
          }
         ,{
            tab:1,
            name: "blog_post_urls",                        
            inputType: "idList",
            inputNeeded: "Blog post URLs",
            help: "Paste URLs for individual blog posts here.",
            placeholder: "http://yourblog.com/your-awesome-post",
            cleanupFunction: function (fullString) {
              if (typeof fullString==="undefined") return fullString; 
              return _.map(fullString.split("\n"), function(line) {            
                // make sure it starts with http and ends without trailing slash
                var working = line.replace(/^https*:\/\//, ""); 
                 working = working.replace(/\/$/, ""); 
                return "http://"+working}).join("\n")}
         }     
      ]
    }, 


    {
      displayName: "YouTube",
      inputs: [{
        name: "standard_urls_input",
        inputType: "idList",
        inputNeeded: "URLs",
        help: "Copy the URLs for the videos you want to add, then paste them here.",
        placeholder: "http://www.youtube.com/watch?v=12345"
      }],
      endpoint: "urls",
      url: "http://youtube.com",
      descr: "YouTube is an online video-sharing site."
    },


    {
      displayName: "Vimeo",
      inputs: [{
        name: "standard_urls_input",        
        inputType: "idList",
        inputNeeded: "URLs",
        help: "Copy the URL for the video you want to add, then paste it here.",
        placeholder: "http://vimeo.com/12345"
      }],
      endpoint: "urls",
      url: "http://vimeo.com",
      descr: "Vimeo is an online video-sharing site."
    },

    {
      displayName: "arXiv",
      inputs: [{
        name: "arxiv_id_input",
        inputType: "idList",
        inputNeeded: "arXiv IDs",
        help: "A typical arXiv ID looks like this: 1305.3328",
        placeholder: "arXiv:1234.5678"       
      }],
      endpoint: "arxiv",
      url: "http://arXiv.org",
      descr: "arXiv is an e-print service in the fields of physics, mathematics, computer science, quantitative biology, quantitative finance and statistics."
    },


    {
      displayName: "Dryad",
      inputs: [{
        name: "standard_dois_input",        
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
        name: "standard_dois_input",                
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
        name: "standard_dois_input",                
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
        name: "standard_pmids_input",                
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
      displayName: "Products by URL",
      inputs: [{
        name: "standard_urls_input",                
        inputType: "idList",
        inputNeeded: "URLs"
      }],
      endpoint: "urls",
      descr: "Our service-specific importers (DOI, blogs, GitHub, etc) give the most comprehensive results. But if you've got a product not handled by any of those, you can import it here, via URL."
    }
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
