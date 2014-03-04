angular.module('accounts.allTheAccounts', [
  'accounts.account'
])

.factory('AllTheAccounts', function(){

  var importedProducts = []
  var accounts = [
    {
      displayName: "GitHub",
      url: 'http://github.com',
      descr: "GitHub is an online code repository emphasizing community collaboration features.",
//     tabs: [
//       {
//         label: "account"
//       },
//       {
//         label: "additional repositories"
//       }
//     ],
      inputs: [{
//            tab: 0,
            name: "account_name",
            inputType: "username",
            inputNeeded: "username",
            help: "Your GitHub account ID is at the top right of your screen when you're logged in.",
            saveUsername: "github_id"
          }]
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
      inputs: [{
            name: "account_name",
            inputType: "username",
            inputNeeded: "username",
            help: "Your username is right after \"slideshare.net/\" in your profile's URL.",            
            saveUsername: "slideshare_id"
          }]
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
      inputs: [{
            name: "account_name",
            inputType: "username",
            inputNeeded: "author page URL",
            placeholder: "http://figshare.com/authors/your_username/12345",
            cleanupFunction: function(x) {
              if (typeof x==="undefined") return x; 
              return('http://'+x.replace('http://', ''))},
            saveUsername: "figshare_id"
          }]
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


  var makeEndpoint = function(account) {
    if (account.endpoint) {
      return account.endpoint
    }
    else {
      return makeName(account.displayName)
    }
  }
          
  var makeName = function(accountName) {
    var words = accountName.split(" ");
    var capitalizedWords = _.map(words, function(word){
      return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
    })
    capitalizedWords[0] = capitalizedWords[0].toLowerCase()
    return capitalizedWords.join("");

  }


  var makeCSSName = function(accountName) {
    return accountName.replace(/ /g, '-').toLowerCase()

  }


  return {
    addProducts: function(products) {
      importedProducts = importedProducts.concat(products)
}   ,
    getProducts: function(){
      return importedProducts
    },
    get: function(){

      // this way no state is saved in the actual accounts obj.
      var accountsConfig = angular.copy(accounts)

      var accountsWithAllData = _.map(accountsConfig, function(account){
        account.name = makeName(account.displayName)
        account.CSSname = makeCSSName(account.displayName)
        account.logoPath = makeLogoPath(account.displayName)
        account.endpoint = makeEndpoint(account)

        account.inputs = _.map(account.inputs, function(inputObj){
          return _.defaults(inputObj, defaultInputObj)
        })


        return account
      })

      return _.sortBy(accountsWithAllData, function(account){
        return account.displayName.toLocaleLowerCase();
      })

    }


  }



})
