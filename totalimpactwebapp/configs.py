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


def metrics(this_key_only=None):
    ret = {}
    for provider in providers:
        try:
            for metric_name, metric_config in provider["metrics"].iteritems():
                new_key = provider["name"] + ":" + metric_name

                if this_key_only is None:
                    ret[new_key] = metric_config

                # this_key_only is set, and exists in the metric config obj
                elif metric_config[this_key_only] is not None:
                    ret[new_key] = metric_config[this_key_only]

                # this_key_only is set, but metric config doesn't have it.
                else:
                    pass

        except KeyError:
            pass

    return ret








#***************************************************************************
#*
#*                           Award Configs
#*
#***************************************************************************

award_configs = {
    "viewed":["views", 1],
    "discussed": ["discussion", 2],
    "saved": ["saves", 3],
    "cited": ["citation", 4],
    "recommended": ["recommendation", 5],
    "unknown": ["interactions", 6]
}







#***************************************************************************
#*
#*                           Award Configs
#*
#***************************************************************************

genre_icons = {
    'article': "icon-file-text-alt",
    'blog': "icon-comments",
    'dataset': "icon-table",
    'figure': "icon-bar-chart",
    'poster': "icon-picture",
    'slides': "icon-desktop",
    'software': "icon-save",
    'twitter': "icon-twitter",
    'video': "icon-facetime-video",
    'webpage': "icon-globe",
    'other': "icon-question-sign",
    'unknown': "icon-question-sign"
}








#***************************************************************************
#*
#*                     Provider and Metric configs
#*
#***************************************************************************

providers = [

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
                "provider": "PLOS",
                "provider_url": "http://www.plos.org/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "pdf_views": {
                "description": "the number of downloads of the PDF from PLOS",
                "display_name": "pdf views",
                "icon": "http://www.plos.org/wp-content/themes/plos_new/favicon.ico",
                "provider": "PLOS",
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
                "provider": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": orders_of_magnitude()
            },
            "downloads": {
                "description": "The number of times the presentation has been downloaded",
                "display_name": "downloads",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "favorites": {
                "description": "The number of times the presentation has been favorited",
                "display_name": "favorites",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider": "SlideShare",
                "provider_url": "http://www.slideshare.net/",
                "audience": "public",
                "engagement_type": "recommended",
                "milestones": orders_of_magnitude()
            },
            "views": {
                "description": "The number of times the presentation has been viewed",
                "display_name": "views",
                "icon": "http://www.slideshare.net/favicon.ico",
                "provider": "SlideShare",
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
    #                             figshare
    # *************************************************************************
    {
        "descr": "Make all of your research outputs sharable, citable and visible in the browser for free.",
        "metrics": {
            "downloads": {
                "description": "The number of times this has been downloaded",
                "display_name": "downloads",
                "icon": "http://figshare.com/static/img/favicon.png",
                "provider": "figshare",
                "provider_url": "http://figshare.com",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "shares": {
                "description": "The number of times this has been shared",
                "display_name": "shares",
                "icon": "http://figshare.com/static/img/favicon.png",
                "provider": "figshare",
                "provider_url": "http://figshare.com",
                "audience": "scholars",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "views": {
                "description": "The number of times this item has been viewed",
                "display_name": "views",
                "icon": "http://figshare.com/static/img/favicon.png",
                "provider": "figshare",
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
                "provider": "Vimeo",
                "provider_url": "http://vimeo.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "likes": {
                "description": "The number of people who have 'liked' the video",
                "display_name": "likes",
                "icon": "https://secure-a.vimeocdn.com/images_v6/favicon_32.ico",
                "provider": "Vimeo",
                "provider_url": "http://vimeo.com",
                "audience": "public",
                "engagement_type": "recommended",
                "milestones": fives_then_orders_of_magnitude()
            },
            "plays": {
                "description": "The number of people who have played the video",
                "display_name": "plays",
                "icon": "https://secure-a.vimeocdn.com/images_v6/favicon_32.ico",
                "provider": "Vimeo",
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
                "provider": "Wikipedia",
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
                "provider": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "dislikes": {
                "description": "The number of people who have who have 'disliked' the video",
                "display_name": "dislikes",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "favorites": {
                "description": "The number of people who have marked the video as a favorite",
                "display_name": "favorites",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            },
            "likes": {
                "description": "The number of people who have 'liked' the video",
                "display_name": "likes",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider": "YouTube",
                "provider_url": "http://youtube.com",
                "audience": "public",
                "engagement_type": "recommended",
                "milestones": fives_then_orders_of_magnitude()
            },
            "views": {
                "description": "The number of people who have viewed the video",
                "display_name": "views",
                "icon": "http://www.youtube.com/favicon.ico",
                "provider": "YouTube",
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
                "provider": "Scopus",
                "provider_url": "http://www.info.sciverse.com/scopus/about",
                "audience": "scholars",
                "engagement_type": "viewed",
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
                "provider": "CiteULike",
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
                "provider": "GitHub",
                "provider_url": "http://github.com",
                "audience": "public",
                "engagement_type": "cited",
                "milestones": fives_then_orders_of_magnitude()
            },
            "stars": {
                "description": "The number of people who have given the GitHub repository a star",
                "display_name": "stars",
                "icon": "https://github.com/fluidicon.png",
                "provider": "GitHub",
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
    #                             Delicious
    # *************************************************************************
    {
        "descr": "Online social bookmarking service",
        "metrics": {
            "bookmarks": {
                "description": "The number of bookmarks to this artifact (maximum=100).",
                "display_name": "bookmarks",
                "icon": "http://g.etfv.co/http://delicious.com",
                "provider": "Delicious",
                "provider_url": "http://www.delicious.com/",
                "audience": "public",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            }
        },
        "name": "delicious",
        "provides_aliases": False,
        "provides_metrics": True,
        "url": "http://www.delicious.com"
    },





    # *************************************************************************
    #                             Mendeley
    # *************************************************************************
    {
        "descr": " A research management tool for desktop and web.",
        "metrics": {
            "career_stage": {
                "description": "Percent of readers by career stage, for top three career stages (csv, api only)",
                "display_name": "career stage, top 3 percentages",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "hide_badge": True
            },
            "country": {
                "description": "Percent of readers by country, for top three countries (csv, api only)",
                "display_name": "country, top 3 percentages",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "hide_badge": True
            },
            "discipline": {
                "description": "Percent of readers by discipline, for top three disciplines (csv, api only)",
                "display_name": "discipline, top 3 percentages",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "hide_badge": True
            },
            "groups": {
                "description": "The number of groups who have added the article to their libraries",
                "display_name": "groups",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider": "Mendeley",
                "provider_url": "http://www.mendeley.com/",
                "audience": "scholars",
                "engagement_type": "saved",
                "milestones": fives_then_orders_of_magnitude()
            },
            "readers": {
                "description": "The number of readers who have added the article to their libraries",
                "display_name": "readers",
                "icon": "http://www.mendeley.com/favicon.ico",
                "provider": "Mendeley",
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
                "provider": "PLOS",
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
                "provider": "Dryad",
                "provider_url": "http:\\/\\/www.datadryad.org\\/",
                "audience": "scholars",
                "engagement_type": "viewed",
                "milestones": orders_of_magnitude()
            },
            "total_downloads": {
                "description": "Dryad total downloads: combined number of downloads of the data package and data files",
                "display_name": "total downloads",
                "icon": "http:\\/\\/datadryad.org\\/favicon.ico",
                "provider": "Dryad",
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
                "icon": "http://impactstory.org/static/img/blogs-icon.png",
                "provider": "Altmetric.com",
                "provider_url": "http://plus.google.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "facebook_posts": {
                "description": "Number of posts mentioning the product on a public Facebook wall",
                "display_name": "Facebook public posts",
                "icon": "http://facebook.com/favicon.ico",
                "provider": "Altmetric.com",
                "provider_url": "http://facebook.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "gplus_posts": {
                "description": "Number of posts mentioning the product on Google+",
                "display_name": "Google+ posts",
                "icon": "http://plus.google.com/favicon.ico",
                "provider": "Altmetric.com",
                "provider_url": "http://plus.google.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
            },
            "tweets": {
                "description": "Number of times the product has been tweeted",
                "display_name": "Twitter tweets",
                "icon": "https://twitter.com/favicon.ico",
                "provider": "Altmetric.com",
                "provider_url": "http://twitter.com",
                "audience": "public",
                "engagement_type": "discussed",
                "milestones": fives_then_orders_of_magnitude()
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
                "provider": "F1000",
                "provider_url": "http://f1000.com",
                "audience": "scholars",
                "engagement_type": "recommended",
                "milestones": fives_then_orders_of_magnitude()
            },
            "pmc_citations": {
                "description": "The number of citations by papers in PubMed Central",
                "display_name": "citations",
                "icon": "http://www.ncbi.nlm.nih.gov/favicon.ico",
                "provider": "PubMed Central",
                "provider_url": "http://pubmed.gov",
                "hide_badge": True
            },
            "pmc_citations_editorials": {
                "description": "The number of citations by editorials papers in PubMed Central",
                "display_name": "citations: editorials",
                "icon": "http://www.ncbi.nlm.nih.gov/favicon.ico",
                "provider": "PubMed Central",
                "provider_url": "http://pubmed.gov",
                "hide_badge": True
            },
            "pmc_citations_reviews": {
                "description": "The number of citations by review papers in PubMed Central",
                "display_name": "citations: reviews",
                "icon": "http://www.ncbi.nlm.nih.gov/favicon.ico",
                "provider": "PubMed Central",
                "provider_url": "http://pubmed.gov",
                "hide_badge": True
            }
        },
        "name": "pubmed",
        "provides_aliases": True,
        "provides_metrics": True,
        "url": "http://pubmed.gov"
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

























