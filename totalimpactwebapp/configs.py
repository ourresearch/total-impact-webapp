#***************************************************************************
#*
#*                 Config creation and access functions
#*
#***************************************************************************

def orders_of_magnitude(start_with_fives=False):
    ret = [1]
    if start_with_fives:
        ret += range(5, 50, 5) + range(50, 100, 10)  # fives then tens
    else:
        ret += range(10, 100, 10)  # tens

    ret += range(100, 1000, 100)  # hundreds
    ret += range(1000, 10000, 1000)  # thousands
    ret += range (10000, 100000, 10000)  # ten-thousands
    ret += range(100000, 500000, 100000)  # hundred-thousands
    return ret


def fives_then_orders_of_magnitude():
    # convenience wrapper for readability below
    return orders_of_magnitude(True)









#***************************************************************************
#*
#*                           Award Configs
#*
#***************************************************************************

award_configs = {
    "engagement_types": {
        "viewed":["views", 1],
        "discussed": ["discussion", 2],
        "saved": ["saves", 3],
        "cited": ["citation", 4],
        "recommended": ["recommendation", 5],
        "unknown": ["interactions", 6]
    },
    "audiences": {
        "scholars": [],
        "public": []
    }
}

#
#award_configs = {
#    "engagement_types": [
#        {}
#    ],
#
#    "audiences": [
#        {"name": "scholars"},
#        {"name": "public"}
#    ]
#}







#***************************************************************************
#*
#*                           linked account Configs
#*
#***************************************************************************
linked_accounts = {
    "orcid": u"https://orcid.org/{id}",
    "github": u"https://github.com/{id}",
    "slideshare": u"http://www.slideshare.net/{id}",
    "twitter": u"http://twitter.com/{id}",
    "figshare": u"{id}",
    "publons": u"{id}",
    "google_scholar": u"{id}",
    "mendeley": u"http://mendeley.com/{id}",
    "researchgate": u"http://researchgate.com/{id}",
    "academia_edu": u"http://academia.edu/{id}",
    "linkedin": u"{id}"
}








#***************************************************************************
#*
#*                     Provider and Metric configs
#*
#***************************************************************************

providers = [

    # *************************************************************************
    #                             Impactstory
    # *************************************************************************
    {
        "descr": "User interactions on Impactstory.",
        "metrics": {
            "views": {
                "description": "the number of views of the product on Impactstory",
                "display_name": "views",
                "icon": "https://impactstory.org/static/img/favicon.ico",
                "provider_name": "Impactstory",
                "provider_url": "https://impactstory.org/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "downloads": {
                "description": "the number of downloads of the product on Impactstory",
                "display_name": "downloads",
                "icon": "https://impactstory.org/static/img/favicon.ico",
                "provider_name": "Impactstory",
                "provider_url": "https://impactstory.org/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "countries": {
                "description": "the countries of the views of a product on Impactstory",
                "display_name": "country",
                "icon": "https://impactstory.org/static/img/favicon.ico",
                "provider_name": "Impactstory",
                "provider_url": "https://impactstory.org/",
                "audience": "public",
                "engagement_type": "viewed",
                "hide_badge": True,
                "milestones": orders_of_magnitude()
            }            
        },
        "name": "impactstory",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "https://impactstory.org/"
    },



    # *************************************************************************
    #                             PLOS ALM
    # *************************************************************************
    {
        "descr": "PLOS article level metrics.",
        "metrics": {
            "html_views": {
                "description": "the number of views of the HTML article on PLOS",
                "display_name": "html views",
                "icon": "http://www.plos.org/wp-content/themes/plos_new/favicon.ico",
                "provider_name": "PLOS",
                "provider_url": "http://www.plos.org/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "pdf_views": {
                "description": "the number of downloads of the PDF from PLOS",
                "display_name": "pdf views",
                "icon": "http://www.plos.org/wp-content/themes/plos_new/favicon.ico",
                "provider_name": "PLOS",
                "provider_url": "http://www.plos.org/",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            }
        },
        "name": "plosalm",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://www.plos.org/"
    },


    # *************************************************************************
    #                             Slideshare
    # *************************************************************************
    {
        "descr": "The best way to share presentations, documents and professional videos.",
        "metrics": {
            "comments": {
                "description": "The number of comments the presentation has received",
                "display_name": "comments",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider_name": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": orders_of_magnitude()
            },
            "downloads": {
                "description": "The number of times the presentation has been downloaded",
                "display_name": "downloads",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider_name": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "favorites": {
                "description": "The number of times the presentation has been favorited",
                "display_name": "favorites",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider_name": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "recommended",
                "milestones": orders_of_magnitude()
            },
            "views": {
                "description": "The number of times the presentation has been viewed",
                "display_name": "views",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider_name": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            }
        },
        "name": "slideshare",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://www.slideshare.net/"
    },

    # *************************************************************************
    #                             Slideshare account
    # *************************************************************************
    {
        "descr": "The best way to share presentations, documents and professional videos.",
        "metrics": {
            "followers": {
                "description": "The number of people who follow this account",
                "display_name": "followers",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider_name": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude(),
                "metric_debut_date": "2014-09-17"
            }
        },
        "name": "slideshare_account",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://www.slideshare.net/"
    },



    # *************************************************************************
    #                             figshare
    # *************************************************************************
    {
        "descr": "Make all of your research outputs sharable, citable and visible in the browser for free.",
        "metrics": {
            "downloads": {
                "description": "The number of times this has been downloaded",
                "display_name": "downloads",
                "icon": "http://figshare.com/static/img/favicon.png",
                "provider_name": "figshare",
                "provider_url": "http://figshare.com",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "shares": {
                "description": "The number of times this has been shared",
                "display_name": "shares",
                "icon": "http://figshare.com/static/img/favicon.png",
                "provider_name": "figshare",
                "provider_url": "http://figshare.com",
                "audience": "scholars",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "views": {
                "description": "The number of times this item has been viewed",
                "display_name": "views",
                "icon": "http://figshare.com/static/img/favicon.png",
                "provider_name": "figshare",
                "provider_url": "http://figshare.com",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            }
        },
        "name": "figshare",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://figshare.com"
    },


    # *************************************************************************
    #                             Publons
    # *************************************************************************
    {
        "descr": "Speeding up science by making peer review faster, more efficient, and more effective.",
        "metrics": {
            "views": {
                "description": "The number of times this item has been viewed",
                "display_name": "views",
                "icon": "https://publons.com/favicon.ico",
                "provider_name": "Publons",
                "provider_url": "https://publons.com",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            }
        },
        "name": "publons",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "https://publons.com"
    },



    # *************************************************************************
    #                             webpages
    # *************************************************************************
    {
        "descr": "Information scraped from webpages by ImpactStory",
        "name": "webpage",
        "provides_aliases": False,
        "provides_metrics": False,
        "url": "http://impactstory.org"
    },




    # *************************************************************************
    #                             Vimeo
    # *************************************************************************
    {
        "descr": "Vimeo: Your videos belong here.",
        "metrics": {
            "comments": {
                "description": "The number of comments on a video",
                "display_name": "comments",
                "icon": "https://secure-a.vimeocdn.com/images_v6/favicon_32.ico",
                "provider_name": "Vimeo",
                "provider_url": "http://vimeo.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "likes": {
                "description": "The number of people who have 'liked' the video",
                "display_name": "likes",
                "icon": "https://secure-a.vimeocdn.com/images_v6/favicon_32.ico",
                "provider_name": "Vimeo",
                "provider_url": "http://vimeo.com",
                "audience": "public",
                "engagement_type": "recommended",
                "milestones": fives_then_orders_of_magnitude()
            },
            "plays": {
                "description": "The number of people who have played the video",
                "display_name": "plays",
                "icon": "https://secure-a.vimeocdn.com/images_v6/favicon_32.ico",
                "provider_name": "Vimeo",
                "provider_url": "http://vimeo.com",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "vimeo",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://vimeo.com"
    },




    # *************************************************************************
    #                             ArXiv
    # *************************************************************************
    {
        "descr": "arXiv is an e-print service in the fields of physics, mathematics, computer science, quantitative biology, quantitative finance and statistics.",
        "metrics": {},
        "name": "arxiv",
        "provides_aliases": True,
        "provides_metrics": False,
        "url": "http://arxiv.org"
    },




    # *************************************************************************
    #                             Wikipedia
    # *************************************************************************
    {
        "descr": "The free encyclopedia that anyone can edit.",
        "metrics": {
            "mentions": {
                "description": "The number of Wikipedia articles that mentioned this object.",
                "display_name": "mentions",
                "icon": "http://wikipedia.org/favicon.ico",
                "provider_name": "Wikipedia",
                "provider_url": "http://www.wikipedia.org/",
                "audience": "public",
                "engagement_type": "cited",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "wikipedia",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://www.wikipedia.org/"
    },





    # *************************************************************************
    #                             YouTube
    # *************************************************************************
    {
        "descr": "YouTube allows billions of people to discover, watch and share originally-created videos",
        "metrics": {
            "comments": {
                "description": "The number of comments on a video",
                "display_name": "comments",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider_name": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "dislikes": {
                "description": "The number of people who have who have 'disliked' the video",
                "display_name": "dislikes",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider_name": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "favorites": {
                "description": "The number of people who have marked the video as a favorite",
                "display_name": "favorites",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider_name": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            },
            "likes": {
                "description": "The number of people who have 'liked' the video",
                "display_name": "likes",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider_name": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "recommended",
                "milestones": fives_then_orders_of_magnitude()
            },
            "views": {
                "description": "The number of people who have viewed the video",
                "display_name": "views",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider_name": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "youtube",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://youtube.com"
    },






    # *************************************************************************
    #                             Scopus
    # *************************************************************************
    {
        "descr": "The world's largest abstract and citation database of peer-reviewed literature.",
        "metrics": {
            "citations": {
                "description": "Number of times the item has been cited",
                "display_name": "citations",
                "icon": "http://www.info.sciverse.com/sites/all/themes/sciverse/favicon.ico",
                "provider_name": "Scopus",
                "provider_url": "http://www.info.sciverse.com/scopus/about",
                "audience": "scholars",
                "engagement_type": "cited",
                "milestones": orders_of_magnitude()
            }
        },
        "name": "scopus",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://www.info.sciverse.com/scopus/about"
    },






    # *************************************************************************
    #                             CiteULike
    # *************************************************************************
    {
        "descr": "CiteULike is a free service to help you to store, organise and share the scholarly papers you are reading.",
        "metrics": {
            "bookmarks": {
                "description": "Number of users who have bookmarked this item.",
                "display_name": "bookmarks",
                "icon": "http://citeulike.org/favicon.ico",
                "provider_name": "CiteULike",
                "provider_url": "http://www.citeulike.org/",
                "audience": "scholars",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "citeulike",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://www.citeulike.org/"
    },






    # *************************************************************************
    #                             GitHub
    # *************************************************************************
    {
        "descr": "A social, online repository for open-source software.",
        "metrics": {
            "forks": {
                "description": "The number of people who have forked the GitHub repository",
                "display_name": "forks",
                "icon": "https://github.com/fluidicon.png",
                "provider_name": "GitHub",
                "provider_url": "http://github.com",
                "audience": "public",
                "engagement_type": "cited",
                "milestones": fives_then_orders_of_magnitude()
            },
            "stars": {
                "description": "The number of people who have given the GitHub repository a star",
                "display_name": "stars",
                "icon": "https://github.com/fluidicon.png",
                "provider_name": "GitHub",
                "provider_url": "http://github.com",
                "audience": "public",
                "engagement_type": "recommended",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "github",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://github.com"
    },


    # *************************************************************************
    #                             GitHub account
    # *************************************************************************
    {
        "descr": "A social, online repository for open-source software.",
        "metrics": {
            "followers": {
                "description": "The number of people who follow this account",
                "display_name": "followers",
                "icon": "https://github.com/fluidicon.png",
                "provider_name": "GitHub",
                "provider_url": "http://github.com",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude(),
                "metric_debut_date": "2014-09-17"                
            },
            "longest_streak_days": {
                "description": "The longest commit streak (consecutive days with code commits) this year",
                "display_name": "days in longest commit streak",
                "icon": "https://github.com/fluidicon.png",
                "provider_name": "GitHub",
                "provider_url": "http://github.com",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude(),
                "metric_debut_date": "2014-09-17"                
            }
        },
        "name": "github_account",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://github.com"
    },


    # *************************************************************************
    #                             BibTex
    # *************************************************************************
    {
        "descr": "",
        "name": "bibtex",
        "provides_aliases": False,
        "provides_metrics": False,
        "url": ""
    },









    # *************************************************************************
    #                             Mendeley
    # *************************************************************************
    {
        "descr": " A research management tool for desktop and web.",
        "metrics": {
            "countries": {
                "description": "Mendeley readers by country",
                "display_name": "readers by country",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider_name": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "value_type": "object",
                "hide_badge": True,
                "audience": "scholars",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            },
            "discipline": {
                "description": "Mendeley readers by discipline",
                "display_name": "readers by discipline",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider_name": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "value_type": "object",
                "hide_badge": True,
                "audience": "scholars",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            },
            "groups": {
                "description": "The number of groups who have added the article to their libraries",
                "display_name": "groups",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider_name": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "audience": "scholars",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            },
            "readers": {
                "description": "The number of readers who have added the article to their libraries",
                "display_name": "readers",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider_name": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "audience": "scholars",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "mendeley",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://www.mendeley.com"
    },

    {
        "descr": " A research management tool for desktop and web.",
        "metrics": {
            "countries": {
                "description": "Mendeley readers by country",
                "display_name": "readers by country",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider_name": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "value_type": "object",
                "hide_badge": True,
                "audience": "scholars",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "mendeley_new",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://www.mendeley.com"
    },



    # *************************************************************************
    #                         PLOS full text search
    # *************************************************************************
    {
        "descr": "PLoS article level metrics.",
        "metrics": {
            "mentions": {
                "description": "the number of times the research product was mentioned in the full-text of PLOS papers",
                "display_name": "mentions",
                "icon": "http://www.plos.org/wp-content/themes/plos_new/favicon.ico",
                "provider_name": "PLOS",
                "provider_url": "http://www.plos.org/",
                "audience": "scholars",
                "engagement_type": "cited",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "plossearch",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://www.plos.org/"
    },







    # *************************************************************************
    #                             Dryad
    # *************************************************************************
    {
        "descr": "An international repository of data underlying peer-reviewed articles in the basic and applied biology.",
        "metrics": {
            "package_views": {
                "description": "Dryad package views: number of views of the main package page",
                "display_name": "package views",
                "icon": "http:\\/\\/datadryad.org\\/favicon.ico",
                "provider_name": "Dryad",
                "provider_url": "http:\\/\\/www.datadryad.org\\/",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "total_downloads": {
                "description": "Dryad total downloads: combined number of downloads of the data package and data files",
                "display_name": "total downloads",
                "icon": "http:\\/\\/datadryad.org\\/favicon.ico",
                "provider_name": "Dryad",
                "provider_url": "http:\\/\\/www.datadryad.org\\/",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            }
        },
        "name": "dryad",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://www.datadryad.org"
    },






    # *************************************************************************
    #                             Altmetric.com
    # *************************************************************************
    {
        "descr": "We make article level metrics easy.",
        "metrics": {
            "blog_posts": {
                "description": "Number of blog posts mentioning the product",
                "display_name": "blog posts",
                "display_provider": 'science blogs',
                "icon": "http://impactstory.org/static/img/blogs-icon.png",
                "provider_name": "Altmetric.com",
                "provider_url": "http://plus.google.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "facebook_posts": {
                "description": "Number of posts mentioning the product on a public Facebook wall",
                "display_name": "public posts",
                "display_provider": "Facebook",
                "icon": "http://facebook.com/favicon.ico",
                "provider_name": "Altmetric.com",
                "provider_url": "http://facebook.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "gplus_posts": {
                "description": "Number of posts mentioning the product on Google+",
                "display_name": "posts",
                "display_provider": "Google+",
                "icon": "http://plus.google.com/favicon.ico",
                "provider_name": "Altmetric.com",
                "provider_url": "http://plus.google.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "tweets": {
                "description": "Number of times the product has been tweeted",
                "display_name": "tweets",
                "display_provider": "Twitter",
                "icon": "https://twitter.com/favicon.ico",
                "provider_name": "Altmetric.com",
                "provider_url": "http://twitter.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "demographics": {
                "description": "Countries where the product has been tweeted",
                "display_name": "countries",
                "display_provider": "Twitter",
                "icon": "https://twitter.com/favicon.ico",
                "provider_name": "Altmetric.com",
                "provider_url": "http://twitter.com",
                "audience": "public",
                "hide_badge": True,                
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },                       
            "tweeter_followers": {
                "hide_badge": True,            
                "description": "People who have tweeted the product and their follower counts",
                "display_name": "tweeter followers",
                "display_provider": "Twitter",
                "icon": "https://twitter.com/favicon.ico",
                "provider_name": "Altmetric.com",
                "provider_url": "http://twitter.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude(),
                "metric_debut_date": "2014-09-17"
            },
            "posts": {
                "hide_badge": True,            
                "description": "",
                "display_name": "",
                "display_provider": "",
                "icon": "",
                "provider_name": "",
                "provider_url": "",
                "audience": "",
                "engagement_type": "",
                "milestones": None,
                "metric_debut_date": "2014-09-17"
            }                                             
        },
        "name": "altmetric_com",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://www.altmetric.com"
    },








    # *************************************************************************
    #                             PubMed
    # *************************************************************************
    {
        "descr": "PubMed comprises more than 21 million citations for biomedical literature",
        "metrics": {
            "f1000": {
                "description": "The article has been reviewed by F1000",
                "display_name": "reviewed",
                "icon": "http://f1000.com/1371136042516/images/favicons/favicon-F1000.ico",
                "provider_name": "F1000",
                "provider_url": "http://f1000.com",
                "audience": "scholars",
                "engagement_type": "recommended",
                "milestones": fives_then_orders_of_magnitude(),
                "interaction": "recommendations"
            },
            "pmc_citations": {
                "description": "The number of citations by papers in PubMed Central",
                "display_name": "citations",
                "icon": "http://www.ncbi.nlm.nih.gov/favicon.ico",
                "provider_name": "PubMed Central",
                "provider_url": "http://pubmed.gov",
                "hide_badge": True,
                "audience": "scholars",
                "engagement_type": "cited",
                "milestones": fives_then_orders_of_magnitude(),
                "interaction": "citations"
            },
            "pmc_citations_editorials": {
                "description": "The number of citations by editorials papers in PubMed Central",
                "display_name": "citations: editorials",
                "icon": "http://www.ncbi.nlm.nih.gov/favicon.ico",
                "provider_name": "PubMed Central",
                "provider_url": "http://pubmed.gov",
                "hide_badge": True,
                "audience": "scholars",
                "engagement_type": "cited",
                "milestones": fives_then_orders_of_magnitude(),
                "interaction": "citations"
            },
            "pmc_citations_reviews": {
                "description": "The number of citations by review papers in PubMed Central",
                "display_name": "citations: reviews",
                "icon": "http://www.ncbi.nlm.nih.gov/favicon.ico",
                "provider_name": "PubMed Central",
                "provider_url": "http://pubmed.gov",
                "hide_badge": True,
                "audience": "scholars",
                "engagement_type": "cited",
                "milestones": fives_then_orders_of_magnitude(),
                "interaction": "citations"
            }
        },
        "name": "pubmed",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://pubmed.gov"
    },




    # *************************************************************************
    #                             Twitter account
    # *************************************************************************
    {
        "descr": "Social networking and microblogging service",
        "metrics": {
            "followers": {
                "description": "Twitter followers: the number of people who follow this twitter account",
                "display_name": "package views",
                "icon": "http:\\/\\/twitter.com\\/favicon.ico",
                "provider_name": "Twitter",
                "provider_url": "http:\\/\\/twitter.com\\/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude(),
                "metric_debut_date": "2014-09-17"
            },
            "lists": {
                "description": "Twitter lists:  the number of lists that include this twitter account",
                "display_name": "lists",
                "icon": "http:\\/\\/twitter.com\\/favicon.ico",
                "provider_name": "Twitter",
                "provider_url": "http:\\/\\/twitter.com\\/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude(),
                "metric_debut_date": "2014-09-17"                
            },
            "number_tweets": {
                "description": "Twitter number of tweets: the number of tweets sent by this twitter account",
                "display_name": "number of tweets",
                "icon": "http:\\/\\/twitter.com\\/favicon.ico",
                "provider_name": "Twitter",
                "provider_url": "http:\\/\\/twitter.com\\/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude(),
                "metric_debut_date": "2014-09-17"                
            }        
        },
        "name": "twitter",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://twitter.com"
    },



    # *************************************************************************
    #                             DOI
    # *************************************************************************
    {
        "descr": "An official Digital Object Identifier (DOI) Registration Agency of the International DOI Foundation.",
        "name": "crossref",
        "provides_aliases": True,
        "provides_metrics": False,
        "url": "http://www.crossref.org/"
    }
]













#***************************************************************************
#*
#*                           Access functions
#*
#***************************************************************************
def metrics(this_key_only=None):
    # todo: we should not do logic in the config like this...should build it into the Metric obj
    ret = {}
    for provider in providers:
        if "metrics" not in provider.keys():
            # doing this the Less Pythonic Way because wrapping that whole loop
            # in a try was hiding important errors.
            continue

        for metric_name, metric_config in provider["metrics"].iteritems():

            # first, add constructed keys to the the metric config
            new_key = provider["name"] + ":" + metric_name
            metric_config["provider"] = provider["name"]
            metric_config["interaction"] = metric_name

            metric_config["display_audience"] = \
                metric_config["audience"].replace("public", "the public")

            if "interaction" not in metric_config.keys():
                metric_config["interaction"] = metric_name
            if "display_interaction" not in metric_config.keys():
                metric_config["display_interaction"] = metric_config["interaction"].replace("_", " ")

            # next, handle the this_key_only stuff:
            if this_key_only is None:
                ret[new_key] = metric_config
            # this_key_only is set, and exists in the metric config obj
            elif metric_config[this_key_only] is not None:
                ret[new_key] = metric_config[this_key_only]
            # this_key_only is set, but metric config doesn't have it.
            else:
                pass

    return ret





#***************************************************************************
#*
#*                           Genres
#*
#***************************************************************************

# not using this any more
genre_icons = {
    'article': "icon-file-text-alt",
    #'blog': "icon-comments",
    'dataset': "icon-table",
    'figure': "icon-bar-chart",
    'poster': "icon-picture",
    'slides': "icon-desktop",
    'software': "icon-save",
    #'twitter': "icon-twitter",
    'video': "icon-facetime-video",
    'webpage': "icon-keyboard",
    'other': "icon-file-alt",
    'unknown': "icon-file-alt",
    "conference paper": "icon-list-alt",  # conference proceeding
    "book": "icon-book",
    "book chapter": "icon-bookmark-empty",  # chapter anthology
    "thesis": "icon-align-center",  # dissertation
    "peer review": "icon-comment-alt",
}

genre_config_dict = {
    "article": {
        "icon": "icon-file-text-alt",
        "fulltext_cta": "read fulltext"
    },
    "dataset": {
        "icon": "icon-table",
        "fulltext_cta": "view dataset"
    },
    "figure": {
        "icon": "icon-bar-chart",
        "fulltext_cta": "view figure"
    },
    "poster": {
        "icon": "icon-picture",
        "fulltext_cta": "view poster"
    },
    "slides": {
        "icon": "icon-desktop",
        "fulltext_cta": "view slides",
        "plural_name": "slide decks"
    },
    "software": {
        "icon": "fa fa-floppy-o",
        "fulltext_cta": "view readme",
        "plural_name": "software products"
    },
    "video": {
        "icon": "fa fa-film",
        "fulltext_cta": "watch video"
    },
    "webpage": {
        "icon": "fa fa-laptop",
        "fulltext_cta": "view webpage"
    },
    "other": {
        "icon": "icon-file-alt",
        "fulltext_cta": "view resource",
        "plural_name": "other products"
    },
    "unknown": {
        "icon": "icon-file-alt",
        "fulltext_cta": "view resource"
    },
    "conference paper": {
        "icon": "icon-list-alt",
        "fulltext_cta": "read fulltext"
    },
    "book": {
        "icon": "icon-book",
        "fulltext_cta": "read full book"
    },
    "book chapter": {
        "icon": "icon-bookmark-empty",
        "fulltext_cta": "read full chapter"
    },
    "thesis": {
        "icon": "icon-align-center",
        "fulltext_cta": "read full thesis",
        "plural_name": "theses"
    },
    "peer review": {
        "icon": "icon-comment-alt",
        "fulltext_cta": "read review"
    },
}

def pluralize_genre(genre):
    # for use in phrases like "79 - 91 percentile of articles from 2013"
    genre_plural = genre + u"s"
    if genre_plural.endswith("ys"):
        genre_plural = genre[:-1] + u"ies"
    return genre_plural


def get_genre_config(genre_name):
    try:
        ret = genre_config_dict[genre_name]
    except KeyError:
        genre_name = "other"
        ret = genre_config_dict[genre_name]

    ret["name"] = genre_name

    if "plural_name" not in ret.keys():
        ret["plural_name"] = pluralize_genre(genre_name)

    if "url_representation" not in ret:
        ret["url_representation"] = ret["plural_name"].replace(" ", "-")

    return ret

def genre_configs():
    ret = []
    for name in genre_config_dict:
        ret.append(get_genre_config(name))

    return ret













