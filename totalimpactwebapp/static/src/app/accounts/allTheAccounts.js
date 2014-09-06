angular.module('accounts.allTheAccounts', [
  'accounts.account'
])

.factory('AllTheAccounts', function(){

  var importedProducts = []
  var accounts = {
//    academia_edu: {
//      displayName: "Academia.edu",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://academia.edu',
//      descr: "Academia.edu is a place to share and follow research.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "http://your_university.academia.edu/your_username"
//      }
//    },

    figshare: {
      displayName: "figshare",
      url: "http://figshare.com",
      sync: true,
      descr: "Figshare is a repository where users can make all of their research outputs available in a citable, shareable and discoverable manner.",
      username:{
            inputNeeded: "author page URL",
            placeholder: "http://figshare.com/authors/your_username/12345"

      },
      usernameCleanupFunction: function(x) {
              if (typeof x==="undefined") return x;
              return('http://'+x.replace('http://', ''))
      }
    },

    github: {
      displayName: "GitHub",
      sync: true,
      usernameCleanupFunction: function(x){return x},
      url: 'http://github.com',
      descr: "GitHub is an online code repository emphasizing community collaboration features.",
      username: {
        inputNeeded: "username",
        help: "Your GitHub account ID is at the top right of your screen when you're logged in."
      }
    },

    google_scholar: {
      displayName: "Google Scholar",
      sync:false,
      usernameCleanupFunction: function(x){return x},
      url: 'http://scholar.google.com/citations',
      descr: "Google Scholar profiles find and show researchers' articles as well as their citation impact.",
      username: {
        inputNeeded: "profile URL",
        placeholder: "http://scholar.google.ca/citations?user=your_user_id"
      }
    },

//    linkedin: {
//      displayName: "LinkedIn",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://linkedin.com',
//      descr: "LinkedIn is a social networking site for professional networking.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "http://www.linkedin.com/in/your_username"
//      }
//    },

//    mendeley: {
//      displayName: "Mendeley",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://mendeley.com',
//      descr: "Mendeley is a desktop and web program for managing and sharing research papers,discovering research data, and collaborating online.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "http://www.mendeley.com/profiles/your_username"
//      }
//    },

    orcid: {
      displayName: "ORCID",
      sync: true,
      username:{
        inputNeeded: "ID",
        placeholder: "http://orcid.org/xxxx-xxxx-xxxx-xxxx",
        help: "You can find your ID at top left of your ORCID page, beneath your name (make sure you're logged in)."
      },
      usernameCleanupFunction: function(x) {return(x.replace('http://orcid.org/', ''))},
      url: 'http://orcid.org',
      signupUrl: 'http://orcid.org/register',
      descr: "ORCID is an open, non-profit, community-based effort to create unique IDs for researchers, and link these to research products. It's the preferred way to import products into Impactstory.",
      extra: "If ORCID has listed any of your products as 'private,' you'll need to change them to 'public' to be imported."
    },

//    researchgate: {
//      displayName: "ResearchGate",
//      usernameCleanupFunction: function(x){return x},
//      url:'http://researchgate.net',
//      descr: "ResearchGate is a social networking site for scientists and researchers to share papers, ask and answer questions, and find collaborators.",
//      username: {
//        inputNeeded: "profile URL",
//          placeholder: "https://www.researchgate.net/profile/your_username"
//      }
//    },

    slideshare: {
      displayName: "SlideShare",
      sync: true,
      usernameCleanupFunction: function(x){return x},
      url:'http://slideshare.net',
      descr: "SlideShare is community for sharing presentations online.",
      username: {
          help: "Your username is right after \"slideshare.net/\" in your profile's URL.",
          inputNeeded: "username"
      }
    }


   ,twitter: {
     displayName: "Twitter",
     sync: true,     
     usernameCleanupFunction: function(x) {return('@'+x.replace('@', ''))},
     url:'http://twitter.com',
     descr: "Twitter is a social networking site for sharing short messages.",
     username: {
         inputNeeded: "username",
         placeholder: "@example",
         help: "Your Twitter username is often written starting with @."
     }
   }

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
    accountServiceNamesFromUserAboutDict:function(userAboutDict){

    },

    get: function(userDict){

      var ret = []
      var accountsConfig = angular.copy(accounts)

      _.each(accountsConfig, function(accountObj, accountHost){
        var userDictAccountKey = accountHost + "_id"


        accountObj.username.value = userDict[userDictAccountKey]


        accountObj.accountHost = accountHost
        accountObj.CSSname = makeCSSName(accountObj.displayName)
        accountObj.logoPath = makeLogoPath(accountObj.displayName)

        ret.push(accountObj)
      })

      return _.sortBy(ret, function(account){
        return account.displayName.toLocaleLowerCase();
      })

    }

  }



})
