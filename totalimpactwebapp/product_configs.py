

"""
Award Configs
"""

award_configs = {
    "viewed":["views", 1],
    "discussed": ["discussion", 2],
    "saved": ["saves", 3],
    "cited": ["citation", 4],
    "recommended": ["recommendation", 5],
    "unknown": ["interactions", 6]
}




"""
Genre icons
"""
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




"""
Metric Configs
"""

config_keys = ["name", "audience", "engagement_type", "display", "min_for_award"]
configs = [
    ["altmetric_com:tweets", "public", "discussed", "badge", 3],
    ["altmetric_com:facebook_posts", "public", "discussed", "badge", 3],
    ["altmetric_com:gplus_posts", "public", "discussed", "badge", 3],
    ["altmetric_com:blog_posts", "public", "discussed", "badge", 3],
    ["citeulike:bookmarks", "scholars", "saved", "badge", 3],
    ["crossref:citations", "scholars", "cited", "badge", 3],
    ["delicious:bookmarks", "public", "saved", "badge", 3],
    ["dryad:most_downloaded_file"],
    ["dryad:package_views", "scholars", "viewed", "badge", 3],
    ["dryad:total_downloads", "scholars", "viewed", "badge", 3],
    ["figshare:views", "scholars", "viewed", "badge", 3],
    ["figshare:downloads", "scholars", "viewed", "badge", 3],
    ["figshare:shares", "scholars", "discussed", "badge", 3],
    ["facebook:shares", "public", "discussed", "badge", 3],
    ["facebook:comments", "public", "discussed", "badge", 3],
    ["facebook:likes", "public", "discussed", "badge", 3],
    ["facebook:clicks", "public", "discussed", "badge", 3],
    ["github:forks", "public", "cited", "badge", 3],
    ["github:stars", "public", "recommended", "badge", 3],
    ["github:watchers", "public", "saved", "badge", 3],  # depricate this later
    ["mendeley:career_stage"],
    ["mendeley:country"],
    ["mendeley:discipline"],
    ["mendeley:student_readers"], # display later
    ["mendeley:developing_countries"], # display later
    ["mendeley:groups"],
    ["mendeley:readers", "scholars", "saved", "badge", 3],
    ["pmc:pdf_downloads"],
    ["pmc:abstract_views"],
    ["pmc:fulltext_views"],
    ["pmc:unique_ip_views"],
    ["pmc:figure_views"],
    ["pmc:suppdata_views"],
    ["plosalm:crossref" ],                    # figure it out
    ["plosalm:html_views", "public", "viewed", "badge", 3],
    ["plosalm:pdf_views", "scholars", "viewed", "badge", 3],
    ["plosalm:pmc_abstract"],
    ["plosalm:pmc_figure"],
    ["plosalm:pmc_full-text"],
    ["plosalm:pmc_pdf"],
    ["plosalm:pmc_supp-data"],
    ["plosalm:pmc_unique-ip"],
    ["plosalm:pubmed_central"],
    ["plosalm:scopus"],                      # figure it out
    ["plossearch:mentions", "scholars", "cited", "badge", 3],
    ["pubmed:f1000", "scholars", "recommended", "badge", 1],
    ["pubmed:pmc_citations", "scholars", "cited", "badge", 3],
    ["pubmed:pmc_citations_editorials"],
    ["pubmed:pmc_citations_reviews"],
    ["scienceseeker:blog_posts", "scholars", "discussed", "badge", 3],
    ["scopus:citations", "scholars", "cited", "badge", 3],
    ["researchblogging:blogs", "scholars", "discussed"],
    ["slideshare:comments", "public", "discussed", "badge", 3],
    ["slideshare:downloads", "public", "viewed", "badge", 3],
    ["slideshare:favorites", "public", "recommended", "badge", 3],
    ["slideshare:views", "public", "viewed", "badge", 3],
    ["topsy:influential_tweets", "public", "discussed", "zoom", 0],
    ["topsy:tweets", "public", "discussed", "badge", 3],
    ["twitter_account:followers", "public", "recommended", "badge", 3],
    ["twitter_account:lists", "public", "saved", "badge", 3],
    ["vimeo:plays", "public", "viewed", "badge", 3],
    ["vimeo:likes", "public", "recommended", "badge", 3],
    ["vimeo:comments", "public", "discussed", "badge", 3],
    ["wikipedia:mentions", "public", "cited", "badge", 3],
    ["wordpresscom:comments", "public", "discussed", "badge", 3],
    ["wordpresscom:subscribers", "public", "viewed", "badge", 3],
    ["wordpresscom:views", "public", "viewed", "badge", 3],
    ["youtube:likes", "public", "recommended", "badge", 3],
    ["youtube:dislikes", "public", "discussed", "badge", 3],
    ["youtube:favorites", "public", "saved", "badge", 3],
    ["youtube:comments", "public", "discussed", "badge", 3],
    ["youtube:views", "public", "viewed", "badge", 3]
]


def get_metric_configs():
    ret = {}
    for config_values in configs:
        config_dict = dict(map(None, config_keys, config_values))

        ret[config_values[0]] = config_dict

    return ret



















